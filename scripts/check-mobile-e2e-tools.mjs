#!/usr/bin/env node
// Managed by AkiDev integration: maestro

import { existsSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const checks = [];
const UPSTREAM_MOBILE_TESTING_COMMAND = "npx skills add tovimx/maestro-mobile-testing-skill -y";
const UPSTREAM_MOBILE_TESTING_SKILL = join(
  process.cwd(),
  ".agents",
  "skills",
  "maestro-mobile-testing",
  "SKILL.md",
);

function commandExists(name) {
  const lookup = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(lookup, [name], { encoding: "utf8" });
  return result.status === 0;
}

function javaMajor() {
  const result = spawnSync("java", ["-version"], { encoding: "utf8" });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const match = output.match(/version\s+"(\d+)/i);
  return match ? Number(match[1]) : null;
}

function requireCommand(name, hint) {
  if (commandExists(name)) {
    checks.push([true, `PASS ${name} is on PATH`]);
  } else {
    checks.push([false, `FAIL ${name} is missing from PATH — ${hint}`]);
  }
}

const major = javaMajor();
if (major !== null && major >= 17) {
  checks.push([true, `PASS java major ${major} (>= 17)`]);
} else if (major === null) {
  checks.push([false, "FAIL java is missing or its version could not be read — install Java 17+ for your user, then reopen the shell"]);
} else {
  checks.push([false, `FAIL java major ${major} is below 17 — install Java 17+ for your user, then reopen the shell`]);
}

requireCommand("adb", "install Android Platform Tools once for your user");
requireCommand("maestro", "install Maestro once for your user");

for (const [ok, message] of checks) console.log(message);

// This is an advisory, read-only check. AkiDev does not vendor or install the
// upstream authoring skill, and this check must never invoke npx or modify the
// project. The skills CLI installs the full skill at this project-local path.
if (existsSync(UPSTREAM_MOBILE_TESTING_SKILL)) {
  console.log("PASS upstream Maestro mobile-testing skill found at .agents/skills/maestro-mobile-testing/SKILL.md");
} else {
  console.log("REMINDER optional upstream Maestro mobile-testing skill is not installed.");
  console.log(`         Project owner may run manually: ${UPSTREAM_MOBILE_TESTING_COMMAND}`);
}

if (checks.some(([ok]) => !ok)) process.exitCode = 1;
