#!/usr/bin/env python3
"""Verify the pinned Guard V1 drop-in assets. Requires only Python 3 standard library."""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODEL = ROOT / "assets/models/caneguard_guard_v1_float32.tflite"
CONTRACT = ROOT / "assets/models/caneguard_guard_v1_contract.json"
EXPECTED_SHA = "36c514184aaa4f96ee762dcbc0ca32eb26df40acec919f6c4264e8ee44fe6d60"
EXPECTED_MANIFEST_SHA = "989fc0303c1ba9269f85e98ec16d664f5d4b8413b1987e0ad49673c14b031490"


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


if not MODEL.is_file() or not CONTRACT.is_file():
    fail("Model or contract file is missing. Copy the approved binary into assets/models locally.")
model_bytes = MODEL.read_bytes()
if model_bytes[4:8] != b"TFL3":
    fail("Model is not a TFLite FlatBuffer (TFL3 marker missing).")
sha = hashlib.sha256(model_bytes).hexdigest()
if sha != EXPECTED_SHA:
    fail(f"Model SHA-256 mismatch: {sha}")
try:
    cfg = json.loads(CONTRACT.read_text(encoding="utf-8"))
except Exception as exc:
    fail(f"Contract JSON invalid: {exc}")
if cfg.get("tflite_sha256") != EXPECTED_SHA:
    fail("Contract model checksum does not match the pinned model.")
if cfg.get("frozen_manifest_sha256") != EXPECTED_MANIFEST_SHA:
    fail("Contract training manifest checksum differs from the recorded frozen manifest.")
if cfg.get("input", {}).get("shape") != [1, 224, 224, 3]:
    fail("Wrong input shape.")
if cfg.get("output", {}).get("shape") != [1, 1]:
    fail("Wrong output shape.")
if cfg.get("decision", {}).get("accept_if_p_sugarcane_at_least") != 0.75:
    fail("Wrong frozen threshold.")
if "NO LETTERBOX" not in cfg.get("input", {}).get("resize", ""):
    fail("Preprocessing contract lost the required direct resize.")
print("PASS: Guard V1 assets, checksums, tensor shapes, and decision threshold verified.")
print(f"Model: {MODEL} ({len(model_bytes)} bytes)")
print(f"SHA-256: {sha}")
