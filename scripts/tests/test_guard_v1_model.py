#!/usr/bin/env python3
"""Check the bundled Guard V1 binary against the frozen contract and behavioral references.

Always (standard library only): pinned SHA-256, TFL3 marker and real tensor metadata
(one float32 [1,224,224,3] input, one float32 [1,1] output; tensor names are read from
the model, never assumed).

When numpy, Pillow and a TFLite interpreter (ai_edge_litert, tflite_runtime or
tensorflow) are installed: real CPU inference on the self-created fixtures in
qa/guard-v1/, preprocessed by an independent pipeline (EXIF transpose, then bilinear
direct stretch to 224x224, raw 0..255 RGB). Fixture decisions must satisfy the
contract threshold, the EXIF-rotated fixture must differ strongly without the transpose,
and a double-normalised input must not reproduce the accept behavior.

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
    if importlib.util.find_spec("ai_edge_litert") is None:
        return None
    return importlib.import_module("ai_edge_litert.interpreter").Interpreter


class GuardV1BinaryTests(unittest.TestCase):
    def test_binary_is_present_and_matches_the_pinned_sha(self) -> None:
        data = MODEL_PATH.read_bytes()
        self.assertEqual(data[4:8], b"TFL3")
        self.assertEqual(hashlib.sha256(data).hexdigest(), CONTRACT["tflite_sha256"])

    def test_real_tensor_metadata_matches_the_contract(self) -> None:
        input_contract, output_contract = _load_reader()(MODEL_PATH)
        print(f"guard tensor names: input={input_contract[0]!r} output={output_contract[0]!r}")
        self.assertEqual(input_contract[1:], (tuple(CONTRACT["input"]["shape"]), FLOAT32))
        self.assertEqual(output_contract[1:], (tuple(CONTRACT["output"]["shape"]), FLOAT32))


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
                "Guard V1 behavioral oracle requires numpy, Pillow and ai-edge-litert"
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

    def _numpy_tensor(self, name: str):
        """Second, independent path: numpy-only EXIF orientation and half-pixel bilinear
        resize without antialiasing (the app's semantics); Pillow only decodes the JPEG."""
        np = self.np
        image = self.Image.open(FIXTURES / f"{name}.jpg")
        orientation = image.getexif().get(274, 1)
        pixels = np.asarray(image.convert("RGB"), np.float32)
        ops = {
            2: lambda a: a[:, ::-1], 3: lambda a: a[::-1, ::-1], 4: lambda a: a[::-1],
            5: lambda a: a.transpose(1, 0, 2), 6: lambda a: a.transpose(1, 0, 2)[:, ::-1],
            7: lambda a: a.transpose(1, 0, 2)[::-1, ::-1], 8: lambda a: a.transpose(1, 0, 2)[::-1],
        }
        pixels = ops.get(orientation, lambda a: a)(pixels)
        height, width = pixels.shape[:2]

        def axis(size: int):
            source = np.clip((np.arange(224) + 0.5) * size / 224 - 0.5, 0, size - 1)
            low = np.floor(source).astype(int)
            return low, np.minimum(low + 1, size - 1), (source - low).astype(np.float32)

        y0, y1, fy = axis(height)
        x0, x1, fx = axis(width)
        top = pixels[y0][:, x0] * (1 - fx)[None, :, None] + pixels[y0][:, x1] * fx[None, :, None]
        bottom = pixels[y1][:, x0] * (1 - fx)[None, :, None] + pixels[y1][:, x1] * fx[None, :, None]
        out = top * (1 - fy)[:, None, None] + bottom * fy[:, None, None]
        return np.round(out).astype(np.float32)[None]

    def test_scores_match_the_goldens_through_two_independent_paths(self) -> None:
        tolerance = EXPECTED["tolerance_abs"]
        for name, case in EXPECTED["cases"].items():
            pillow = self._score(self._tensor(name))
            numpy_path = self._score(self._numpy_tensor(name))
            print(f"{name}: golden={case['p_sugarcane']:.6f} pillow={pillow:.6f} numpy={numpy_path:.6f}")
            self.assertAlmostEqual(pillow, case["p_sugarcane"], delta=tolerance, msg=f"{name} (pillow)")
            self.assertAlmostEqual(numpy_path, case["p_sugarcane"], delta=tolerance, msg=f"{name} (numpy)")

    def test_fixture_decisions_match_the_contract_threshold(self) -> None:
        for name, case in EXPECTED["cases"].items():
            score = self._score(self._tensor(name))
            if case["decision"] == "accept":
                self.assertGreaterEqual(score, THRESHOLD, msg=name)
            elif case["decision"] == "reject":
                self.assertLess(score, THRESHOLD, msg=name)
            else:
                self.fail(f"Unknown expected decision for {name}: {case['decision']}")

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
