/* global describe, expect, it */

// Intent: refresh keeps only the current graph; dated snapshots, HTML viewers and caches are removed.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pruneGraphifyOut } = require("../graphify-refresh");

describe("pruneGraphifyOut", () => {
  it("removes dated dirs, graph.html and cache but keeps the current graph", () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "gfy-"));
    fs.mkdirSync(path.join(out, "2026-11-10"));
    fs.mkdirSync(path.join(out, "cache"));
    for (const f of [
      "graph.json",
      "GRAPH_REPORT.md",
      "manifest.json",
      "graph.html",
    ]) {
      fs.writeFileSync(path.join(out, f), "{}");
    }
    pruneGraphifyOut(out);
    expect(fs.readdirSync(out).sort()).toEqual([
      "GRAPH_REPORT.md",
      "graph.json",
      "manifest.json",
    ]);
    fs.rmSync(out, { recursive: true });
  });
});
