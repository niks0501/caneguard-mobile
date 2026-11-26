/* global describe, expect, it */

const fs = require("node:fs");
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

    expect(verify).toMatch(
      /group: \$\{\{ github\.workflow \}\}-\$\{\{ github\.event\.pull_request\.number \|\| github\.ref \}\}/,
    );
    expect(verify).toMatch(/cancel-in-progress: true/);

    const verifyJobStart = verify.indexOf("\n  verify:");
    const versionGuardStart = verify.indexOf("\n  version-guard:");
    expect(verifyJobStart).toBeGreaterThan(-1);
    expect(versionGuardStart).toBeGreaterThan(verifyJobStart);

    const verifyJobBlock = verify.slice(verifyJobStart, versionGuardStart);
    expect(verifyJobBlock).not.toMatch(/\n\s+if:/);
    expect(verifyJobBlock).not.toMatch(/\n\s+continue-on-error:/);

    const versionGuardBlock = verify.slice(versionGuardStart);
    expect(versionGuardBlock).toMatch(/\n\s+if: github\.event_name == 'pull_request'/);
    expect(versionGuardBlock).toMatch(/BASE_SHA: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  });

  it("keeps build and OTA release workflows restricted to main and out of pull requests", () => {
    for (const file of ["build.yml", "update.yml", "update-production.yml"]) {
      const source = readWorkflow(file);
      const onBlock = triggerBlock(source);

      expect(onBlock).toMatch(/\n\s+workflow_dispatch:/);
      expect(onBlock).not.toMatch(/\n\s+pull_request(_target)?:/);
      expect(onBlock).not.toMatch(/\n\s+push:/);
      expect(source).toMatch(/refs\/heads\/main/);
      expect(source).toMatch(/cancel-in-progress: false/);
    }
  });
});
