#!/usr/bin/env node

// Refreshes the local Graphify graph, then drops the extras Graphify writes
// on every run (dated snapshots, graph.html, cache/). Only graph.json,
// GRAPH_REPORT.md and their small sidecars stay. Use --prune-only to clean
// an existing graphify-out/ without re-extracting.

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const DATED_DIR = /^\d{4}-\d{2}-\d{2}$/;
const REMOVED_FILES = new Set(["graph.html", "cache"]);

function pruneGraphifyOut(outDir) {
  if (!fs.existsSync(outDir)) {
    return [];
  }
  const removed = [];
  for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
    const isDatedDir = entry.isDirectory() && DATED_DIR.test(entry.name);
    if (isDatedDir || REMOVED_FILES.has(entry.name)) {
      fs.rmSync(path.join(outDir, entry.name), {
        recursive: true,
        force: true,
      });
      removed.push(entry.name);
    }
  }
  return removed;
}

function main(
  args = process.argv.slice(2),
  root = path.resolve(__dirname, ".."),
) {
  const outDir = path.join(root, "graphify-out");
  if (!args.includes("--prune-only")) {
    const result = spawnSync("graphify", ["update", "."], {
      cwd: root,
      stdio: "inherit",
    });
    if (result.status !== 0) {
      return result.status ?? 1;
    }
  }
  const removed = pruneGraphifyOut(outDir);
  console.log(`[graphify:refresh] pruned ${removed.length} generated extra(s)`);
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = { main, pruneGraphifyOut };
