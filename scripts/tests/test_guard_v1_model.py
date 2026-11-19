#!/usr/bin/env python3
"""Check the bundled Guard V1 binary against the frozen contract and independent references.

Always (standard library only): pinned SHA-256, TFL3 marker and real tensor metadata
(one float32 [1,224,224,3] input, one float32 [1,1] output; tensor names are read from
the model, never assumed).

When numpy, Pillow and a TFLite interpreter (ai_edge_litert, tflite_runtime or
tensorflow) are installed: real CPU inference on the self-created fixtures in
qa/guard-v1/, preprocessed by an independent pipeline (EXIF transpose, then bilinear
direct stretch to 224x224, raw 0..255 RGB). Scores must match qa/guard-v1/expected.json
within its documented tolerance, accept/reject decisions at 0.75 must hold, the
EXIF-rotated fixture must differ strongly without the transpose, and a double-normalised
input must not reproduce the accept score.

Run: python3 scripts/tests/test_guard_v1_model.py
"""

from __future__ import annotations

import hashlib
import importlib
import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = ROOT / "assets/models/caneguard_guard_v1_float32.tflite"
FIXTURES = ROOT / "qa/guard-v1"
CONTRACT = json.loads((ROOT / "assets/models/caneguard_guard_v1_contract.json").read_text())
EXPECTED = json.loads((FIXTURES / "expected.json").read_text())
FLOAT32 = 0  # TensorType.FLOAT32 in the TFLite schema
THRESHOLD = CONTRACT["decision"]["accept_if_p_sugarcane_at_least"]


def _load_reader():
    spec = importlib.util.spec_from_file_location(
        "tflite_shapes", ROOT / "scripts/tests/test_tflite_model_shapes.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.model_tensor_contracts


def _interpreter_class():
    for name in ("ai_edge_litert.interpreter", "tflite_runtime.interpreter"):
        if importlib.util.find_spec(name.split(".")[0]) is not None:
            try:
                return importlib.import_module(name).Interpreter
            except Exception:  # noqa: BLE001 - try the next runtime
                continue
    if importlib.util.find_spec("tensorflow") is not None:
        import tensorflow as tf  # type: ignore

        return tf.lite.Interpreter
    return None


HAS_BINARY = MODEL_PATH.is_file()
SKIP_REASON = "private Guard V1 binary not supplied (assets/models is Git-ignored for it)"


@unittest.skipUnless(HAS_BINARY, SKIP_REASON)
class GuardV1BinaryTests(unittest.TestCase):
    def test_binary_matches_the_pinned_sha(self) -> None:
        data = MODEL_PATH.read_bytes()
        self.assertEqual(data[4:8], b"TFL3")
        self.assertEqual(hashlib.sha256(data).hexdigest(), CONTRACT["tflite_sha256"])

    def test_real_tensor_metadata_matches_the_contract(self) -> None:
        input_contract, output_contract = _load_reader()(MODEL_PATH)
        print(f"guard tensor names: input={input_contract[0]!r} output={output_contract[0]!r}")
        self.assertEqual(input_contract[1:], (tuple(CONTRACT["input"]["shape"]), FLOAT32))
        self.assertEqual(output_contract[1:], (tuple(CONTRACT["output"]["shape"]), FLOAT32))


@unittest.skipUnless(HAS_BINARY, SKIP_REASON)
class GuardV1ReferenceOracleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        interpreter_class = _interpreter_class()
        if (
            interpreter_class is None
            or importlib.util.find_spec("numpy") is None
            or importlib.util.find_spec("PIL") is None
        ):
            raise RuntimeError(
                "Guard V1 score oracle requires numpy, Pillow and ai-edge-litert"
            )
        import numpy as np  # type: ignore
        from PIL import Image, ImageOps  # type: ignore

        cls.np, cls.Image, cls.ImageOps = np, Image, ImageOps
        cls.interpreter = interpreter_class(model_path=str(MODEL_PATH))
        cls.interpreter.allocate_tensors()
        cls.input = cls.interpreter.get_input_details()[0]
        cls.output = cls.interpreter.get_output_details()[0]

    def _tensor(self, name: str, transpose: bool = True):
        image = self.Image.open(FIXTURES / f"{name}.jpg")
        if transpose:
            image = self.ImageOps.exif_transpose(image)
        image = image.convert("RGB").resize((224, 224), self.Image.BILINEAR)
        return self.np.asarray(image, self.np.float32)[None]

    def _score(self, tensor) -> float:
        self.interpreter.set_tensor(self.input["index"], tensor)
        self.interpreter.invoke()
        return float(self.interpreter.get_tensor(self.output["index"])[0][0])

    def test_runtime_tensor_abi(self) -> None:
        self.assertEqual(tuple(self.input["shape"]), (1, 224, 224, 3))
        self.assertEqual(tuple(self.output["shape"]), (1, 1))
        self.assertEqual(self.input["dtype"], self.np.float32)
        self.assertEqual(int(self.np.prod(self.input["shape"])) * 4, 602112)

    def test_scores_match_the_independent_reference_within_tolerance(self) -> None:
        tolerance = EXPECTED["tolerance_abs"]
        for name, case in EXPECTED["cases"].items():
            score = self._score(self._tensor(name))
            print(f"{name}: p_sugarcane={score:.6f} expected={case['p_sugarcane']:.6f}")
            self.assertAlmostEqual(score, case["p_sugarcane"], delta=tolerance, msg=name)

    def test_accept_and_reject_decisions(self) -> None:
        score = lambda n: self._score(self._tensor(n))  # noqa: E731
        self.assertGreaterEqual(score("cane-like-accept"), THRESHOLD)
        self.assertGreaterEqual(score("cane-like-exif-rotated"), THRESHOLD)
        self.assertLess(score("reject-sky-gradient"), THRESHOLD)

    def test_exif_orientation_is_decisive(self) -> None:
        upright = self._score(self._tensor("cane-like-exif-rotated", transpose=True))
        sideways = self._score(self._tensor("cane-like-exif-rotated", transpose=False))
        self.assertGreaterEqual(upright, THRESHOLD)
        self.assertLess(sideways, THRESHOLD)
        self.assertGreater(upright - sideways, 0.4)

    def test_double_normalisation_is_detected(self) -> None:
        raw = self._tensor("cane-like-accept")
        correct = self._score(raw)
        doubled = self._score(raw / 127.5 - 1.0)
        self.assertGreater(abs(correct - doubled), 0.2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
