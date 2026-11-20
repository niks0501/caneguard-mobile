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
EXPECTED_FIELDS = {
    "model_id": "caneguard_guard_v1",
    "model_kind": "binary_sugarcane_presence",
    "labels": {"0": "not_sugarcane", "1": "sugarcane"},
    "input": {
        "shape": [1, 224, 224, 3],
        "dtype": "float32",
        "color_order": "RGB",
        "range": [0, 255],
        "orientation": "apply EXIF orientation before resize",
        "resize": "bilinear direct stretch to 224x224; NO LETTERBOX or center padding",
        "normalization": "inside TFLite model: x/127.5-1",
    },
    "output": {
        "shape": [1, 1],
        "dtype": "float32",
        "meaning": "probability of sugarcane",
    },
    "decision": {
        "accept_if_p_sugarcane_at_least": 0.75,
        "target_val_false_acceptance_rate": 0.05,
    },
}


def fail(message):
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def contract_mismatches(cfg):
    if not isinstance(cfg, dict):
        return ("root",)
    return tuple(field for field, expected in EXPECTED_FIELDS.items() if cfg.get(field) != expected)


def main():
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
    if not isinstance(cfg, dict):
        fail("Contract JSON root must be an object.")
    if cfg.get("tflite_sha256") != EXPECTED_SHA:
        fail("Contract model checksum does not match the pinned model.")
    if cfg.get("frozen_manifest_sha256") != EXPECTED_MANIFEST_SHA:
        fail("Contract training manifest checksum differs from the recorded frozen manifest.")
    mismatches = contract_mismatches(cfg)
    if mismatches:
        fail(f"Frozen Guard contract field differs: {mismatches[0]}.")
    print("PASS: Guard V1 assets, checksums, and frozen model contract verified.")
    print(f"Model: {MODEL} ({len(model_bytes)} bytes)")
    print(f"SHA-256: {sha}")


if __name__ == "__main__":
    main()
