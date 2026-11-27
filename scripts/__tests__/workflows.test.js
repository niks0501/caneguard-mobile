/* global describe, expect, it */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const workflowsDir = path.resolve(__dirname, "..", "..", ".github", "workflows");

function readWorkflow(name) {
  return fs.readFileSync(path.join(workflowsDir, name), "utf8");
}

function triggerBlock(source) {
  const start = source.indexOf("on:");
  const end = source.indexOf("\npermissions:");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not locate top-level on: block");
  }
  return source.slice(start, end);
}

function extractVerifyRevisionRunScript(buildSource) {
  const marker = "- name: Check expected SHA and main Verify run";
  const stepStart = buildSource.indexOf(marker);
  if (stepStart === -1) {
    throw new Error("Could not locate verify-revision step in build.yml");
  }
  const runStart = buildSource.indexOf("        run: |\n", stepStart);
  if (runStart === -1) {
    throw new Error("Could not locate verify-revision run block in build.yml");
  }
  const bodyStart = runStart + "        run: |\n".length;
  const nextJobStart = buildSource.indexOf("\n  build:", bodyStart);
  const block = buildSource.slice(bodyStart, nextJobStart === -1 ? undefined : nextJobStart);
  return block
    .split("\n")
    .map((line) => (line.startsWith("          ") ? line.slice(10) : line))
    .join("\n");
}

describe("GitHub Actions workflow triggers and safety gates", () => {
  it("runs verify.yml on pull requests targeting any branch including base branch changes", () => {
    const verify = readWorkflow("verify.yml");
    const onBlock = triggerBlock(verify);

    const pullRequestMatch = onBlock.match(/\n  pull_request:[\s\S]*?(?=\n  [a-z_]+:|$)/);
    expect(pullRequestMatch).not.toBeNull();
    const pullRequestBlock = pullRequestMatch[0];

    expect(pullRequestBlock).toMatch(
      /pull_request:\s*\n\s+types:\s*\n\s+- opened\s*\n\s+- synchronize\s*\n\s+- reopened\s*\n\s+- edited/,
    );
    expect(pullRequestBlock).not.toMatch(/\n\s+branches(-ignore)?:/);
    expect(pullRequestBlock).not.toMatch(/\n\s+paths(-ignore)?:/);
    expect(onBlock).toMatch(/\n\s+push:\s*\n\s+branches:\s*\n\s+- main\b/);
    expect(onBlock).toMatch(/\n  workflow_call:/);

    expect(verify).toContain("format('dispatch-{0}', github.run_id)");
    expect(verify).toContain("github.event.pull_request.number || github.ref");
    expect(verify).toMatch(/cancel-in-progress: true/);

    const verifyJobStart = verify.indexOf("\n  verify:");
    const versionGuardStart = verify.indexOf("\n  version-guard:");
    expect(verifyJobStart).toBeGreaterThan(-1);
    expect(versionGuardStart).toBeGreaterThan(verifyJobStart);

    const verifyJobBlock = verify.slice(verifyJobStart, versionGuardStart);
    expect(verifyJobBlock).not.toMatch(/\n\s+if:/);
    expect(verifyJobBlock).not.toMatch(/\n\s+continue-on-error:/);
    expect(verifyJobBlock).toContain("refs/heads/main");
    expect(verifyJobBlock).toContain("npm run verify:fast");
    expect(verifyJobBlock).toContain("python3 scripts/tests/test_guard_v1_model.py");
    expect(verifyJobBlock).toContain("EXPO_NO_DOTENV: '1'");
    expect(verifyJobBlock).toContain("expo export --platform android");

    const versionGuardBlock = verify.slice(versionGuardStart);
    expect(versionGuardBlock).toMatch(/\n\s+if: github\.event_name == 'pull_request'/);
    expect(versionGuardBlock).not.toMatch(/\n\s+continue-on-error:/);
    expect(versionGuardBlock).toMatch(/BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
    expect(versionGuardBlock).toContain("node scripts/version-guard.js");
  });

  it("keeps OTA release workflows restricted to main and out of pull requests", () => {
    for (const file of ["update.yml", "update-production.yml"]) {
      const source = readWorkflow(file);
      const onBlock = triggerBlock(source);

      expect(onBlock).toMatch(/\n\s+workflow_dispatch:/);
      expect(onBlock).not.toMatch(/\n\s+pull_request(_target)?:/);
      expect(onBlock).not.toMatch(/\n\s+push:/);
      expect(source).toMatch(/cancel-in-progress: false/);
      expect(source).toMatch(/\n  verify:[\s\S]*?\n    uses: \.\/\.github\/workflows\/verify\.yml/);
      expect(source).toMatch(/\n  publish:\s*\n    needs: verify/);
      expect(source).not.toContain("npm run verify:fast");
    }
    expect(readWorkflow("update.yml")).toContain("if: needs.classify.outputs.publish == 'true'");
  });

  it("builds from a verified main SHA without pushing commits to main and tags production after success", () => {
    const build = readWorkflow("build.yml");
    const onBlock = triggerBlock(build);

    expect(onBlock).toMatch(/\n\s+workflow_dispatch:/);
    expect(onBlock).not.toMatch(/\n\s+pull_request(_target)?:/);
    expect(onBlock).not.toMatch(/\n\s+push:/);
    expect(onBlock).toContain("expected_sha:");
    expect(onBlock).not.toContain("bump:");

    expect(build).toMatch(/\npermissions:\s*\n  contents: read/);
    expect(build).toMatch(/cancel-in-progress: false/);

    const verifyRevStart = build.indexOf("\n  verify-revision:");
    const buildJobStart = build.indexOf("\n  build:");
    expect(verifyRevStart).toBeGreaterThan(-1);
    expect(buildJobStart).toBeGreaterThan(verifyRevStart);

    const verifyRevBlock = build.slice(verifyRevStart, buildJobStart);
    expect(verifyRevBlock).not.toMatch(/\n\s+if:/);
    expect(verifyRevBlock).not.toMatch(/\n\s+continue-on-error:/);
    expect(verifyRevBlock).toMatch(/\n\s+permissions:\s*\n\s+actions: read/);

    const buildJobBlock = build.slice(buildJobStart);
    expect(buildJobBlock).toMatch(/\n\s+needs: verify-revision/);
    expect(buildJobBlock).toContain("ref: ${{ github.sha }}");
    expect(buildJobBlock).not.toContain("bump-version.js");
    expect(buildJobBlock).not.toContain("HEAD:main");
    expect(buildJobBlock).toContain("Record source SHA and EAS build ID");
    expect(buildJobBlock).toContain("Tag verified production commit");
    expect(buildJobBlock.indexOf("Prove production APK is finished and installable")).toBeLessThan(
      buildJobBlock.indexOf("Tag verified production commit"),
    );
    expect(buildJobBlock.indexOf("Upload production APK")).toBeLessThan(
      buildJobBlock.indexOf("Tag verified production commit"),
    );
  });

  describe("build.yml verify-revision admission gate", () => {
    const build = readWorkflow("build.yml");
    const gateScript = extractVerifyRevisionRunScript(build);
    const requestedSha = "a".repeat(40);
    const successfulRun = {
      head_sha: requestedSha,
      head_branch: "main",
      event: "push",
      status: "completed",
      conclusion: "success",
      html_url: "https://github.com/example/repo/actions/runs/1",
    };

    function runGate({
      expectedSha = requestedSha,
      dispatchRef = "refs/heads/main",
      mockResponse = JSON.stringify({ workflow_runs: [successfulRun] }),
    } = {}) {
      const binDir = fs.mkdtempSync(path.join(os.tmpdir(), "mobile-build-gate-"));
      try {
        fs.writeFileSync(
          path.join(binDir, "gh"),
          `#!/bin/sh
set -eu
test "$1" = api
test "$2" = "repos/example/repo/actions/workflows/verify.yml/runs?event=push&branch=main&head_sha=$GITHUB_SHA&per_page=1"
if [ "$MOCK_RESPONSE" = unavailable ]; then
  echo 'request failed' >&2
  exit 1
fi
printf '%s\\n' "$MOCK_RESPONSE"
`,
          { mode: 0o755 },
        );

        return spawnSync("bash", ["-e", "-c", gateScript], {
          encoding: "utf8",
          env: {
            PATH: `${binDir}:${process.env.PATH}`,
            GITHUB_REPOSITORY: "example/repo",
            GITHUB_SHA: requestedSha,
            DISPATCH_REF: dispatchRef,
            EXPECTED_SHA: expectedSha,
            MOCK_RESPONSE: mockResponse,
          },
        });
      } finally {
        fs.rmSync(binDir, { recursive: true, force: true });
      }
    }

    it("admits a dispatch from main when expected_sha matches and Verify passed", () => {
      const result = runGate({ expectedSha: ` ${requestedSha.toUpperCase()} ` });
      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/Verified .* in https:/);
    });

    it.each([
      ["non-main branch", { dispatchRef: "refs/heads/feature" }, /dispatched from main/],
      ["short expected_sha", { expectedSha: "abc123" }, /40-character hexadecimal/],
      ["mismatched expected_sha", { expectedSha: "b".repeat(40) }, /does not match dispatch commit/],
      ["missing Verify run", { mockResponse: JSON.stringify({ workflow_runs: [] }) }, /No main Verify run/],
      [
        "pending Verify run",
        { mockResponse: JSON.stringify({ workflow_runs: [{ ...successfulRun, status: "in_progress", conclusion: null }] }) },
        /Verify must succeed/,
      ],
      [
        "failed Verify run",
        { mockResponse: JSON.stringify({ workflow_runs: [{ ...successfulRun, conclusion: "failure" }] }) },
        /Verify must succeed/,
      ],
      [
        "cancelled Verify run",
        { mockResponse: JSON.stringify({ workflow_runs: [{ ...successfulRun, conclusion: "cancelled" }] }) },
        /Verify must succeed/,
      ],
      [
        "wrong run SHA",
        { mockResponse: JSON.stringify({ workflow_runs: [{ ...successfulRun, head_sha: "b".repeat(40) }] }) },
        /does not match/,
      ],
      [
        "wrong run branch",
        { mockResponse: JSON.stringify({ workflow_runs: [{ ...successfulRun, head_branch: "staging" }] }) },
        /does not match/,
      ],
      [
        "wrong run event",
        { mockResponse: JSON.stringify({ workflow_runs: [{ ...successfulRun, event: "pull_request" }] }) },
        /does not match/,
      ],
      ["unavailable API", { mockResponse: "unavailable" }, /request failed/],
    ])("rejects %s", (_label, options, pattern) => {
      const result = runGate(options);
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(pattern);
    });
  });
});
