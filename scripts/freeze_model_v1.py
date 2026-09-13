#!/usr/bin/env python3
"""Freeze CaneGuard Model V1 threshold and QA handoff evidence.

This script intentionally reads only the five locked OOF prediction files for
threshold derivation. It verifies the accepted Float32 model before loading
those rows or running any derivation, and it never reads holdout outputs.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import math
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

EXPECTED_MODEL_SHA256 = (
    "9ebad12450866b47abc94ffb6b820048c1759e3f3e728a71775af42a0541bae7"
)
CLASS_ORDER = ("healthy", "mosaic", "rust", "smut")
OOF_FILENAMES = tuple(
    f"fold{fold}_validation_predictions.csv" for fold in range(1, 6)
)
QA_FILENAMES = ("healthy.jpg", "mosaic.jpg", "rust.jpg", "smut.jpg")
OOF_HEADER = (
    "Image ID",
    "true_index",
    "true_class",
    "predicted_index",
    "predicted_class",
    "prob_healthy",
    "prob_mosaic",
    "prob_rust",
    "prob_smut",
)
EXPECTED_SOURCE_ROW_COUNT = 567
PROBABILITY_SUM_TOLERANCE = 1e-6


class ArtifactError(RuntimeError):
    """A required handoff artifact is absent, unreadable, or mismatched."""


@dataclass(frozen=True)
class OOFRow:
    true_index: int
    predicted_index: int
    probabilities: tuple[float, ...]

    @property
    def is_error(self) -> bool:
        return self.true_index != self.predicted_index

    @property
    def max_softmax(self) -> float:
        return max(self.probabilities)


def validate_probability_vector(
    probabilities: tuple[float, ...] | list[float], location: str
) -> None:
    if (
        len(probabilities) != len(CLASS_ORDER)
        or any(not math.isfinite(value) or not 0 <= value <= 1 for value in probabilities)
        or not math.isclose(
            sum(probabilities),
            1.0,
            rel_tol=PROBABILITY_SUM_TOLERANCE,
            abs_tol=PROBABILITY_SUM_TOLERANCE,
        )
    ):
        raise ArtifactError(f"invalid probability in {location}: {probabilities!r}")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    try:
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                digest.update(chunk)
    except OSError as error:
        raise ArtifactError(f"cannot read {path}: {error}") from error
    return digest.hexdigest()


def read_json(path: Path) -> dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            value = json.load(handle)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        raise ArtifactError(f"cannot read JSON artifact {path}: {error}") from error
    if not isinstance(value, dict):
        raise ArtifactError(f"JSON artifact {path} must contain an object")
    return value


def require_file(path: Path) -> None:
    try:
        exists = path.is_file()
        size = path.stat().st_size if exists else 0
    except OSError as error:
        raise ArtifactError(f"cannot inspect required artifact {path}: {error}") from error
    if not exists:
        raise ArtifactError(f"required artifact is missing: {path}")
    if not size:
        raise ArtifactError(f"required artifact is empty: {path}")


def relative_to_handoff(path: Path, handoff: Path) -> str:
    return path.relative_to(handoff).as_posix()


def verify_model_and_contract(handoff: Path) -> tuple[Path, dict[str, Any], str]:
    """Verify immutable model identity before any OOF derivation is possible."""

    model_path = handoff / "model" / "CaneGuard_V1_MobileNetV2_float32.tflite"
    require_file(model_path)
    model_sha256 = sha256_file(model_path)
    if model_sha256 != EXPECTED_MODEL_SHA256:
        raise ArtifactError(
            "accepted Float32 model SHA mismatch: "
            f"expected {EXPECTED_MODEL_SHA256}, got {model_sha256}"
        )

    contract_path = handoff / "model" / "CaneGuard_V1_deployment_contract.json"
    labels_path = handoff / "model" / "labels.txt"
    require_file(contract_path)
    require_file(labels_path)
    contract = read_json(contract_path)

    if contract.get("deployment_file") != model_path.name:
        raise ArtifactError(
            "deployment contract names a different model: "
            f"{contract.get('deployment_file')!r}"
        )
    if contract.get("deployment_sha256") != EXPECTED_MODEL_SHA256:
        raise ArtifactError(
            "deployment contract SHA does not name the accepted Float32 model: "
            f"{contract.get('deployment_sha256')!r}"
        )
    if contract.get("precision") != "float32":
        raise ArtifactError(
            f"deployment contract precision is not float32: {contract.get('precision')!r}"
        )

    input_contract = contract.get("input")
    output_contract = contract.get("output")
    if not isinstance(input_contract, dict) or not isinstance(output_contract, dict):
        raise ArtifactError("deployment contract must contain input and output objects")
    if input_contract.get("shape") != [1, 224, 224, 3]:
        raise ArtifactError(f"unexpected V1 input shape: {input_contract.get('shape')!r}")
    if input_contract.get("dtype") != "float32":
        raise ArtifactError(f"unexpected V1 input dtype: {input_contract.get('dtype')!r}")
    if input_contract.get("channel_order") != "RGB":
        raise ArtifactError(
            f"unexpected V1 input channel order: {input_contract.get('channel_order')!r}"
        )
    expected_input_values = {
        "pixel_range_before_model": [0.0, 255.0],
        "resize": "aspect-ratio-preserving letterbox",
        "resize_interpolation": "bilinear",
        "letterbox_value": 127.5,
        "normalization": "NONE in Android. Model internally rescales x / 127.5 - 1.0.",
    }
    for key, expected in expected_input_values.items():
        if input_contract.get(key) != expected:
            raise ArtifactError(
                f"unexpected V1 input contract {key}: {input_contract.get(key)!r}"
            )
    if output_contract.get("shape") != [1, 4]:
        raise ArtifactError(f"unexpected V1 output shape: {output_contract.get('shape')!r}")
    if output_contract.get("dtype") != "float32":
        raise ArtifactError(
            f"unexpected V1 output dtype: {output_contract.get('dtype')!r}"
        )
    if output_contract.get("activation") != "softmax":
        raise ArtifactError(
            f"unexpected V1 output activation: {output_contract.get('activation')!r}"
        )
    contract_class_order = output_contract.get("class_order")
    if not isinstance(contract_class_order, list) or tuple(contract_class_order) != CLASS_ORDER:
        raise ArtifactError(
            "deployment contract class order mismatch: "
            f"{contract_class_order!r}"
        )

    try:
        labels = [line.strip() for line in labels_path.read_text(encoding="utf-8").splitlines()]
    except (OSError, UnicodeError) as error:
        raise ArtifactError(f"cannot read labels file {labels_path}: {error}") from error
    if tuple(labels) != CLASS_ORDER:
        raise ArtifactError(f"labels.txt class order mismatch: {labels!r}")

    return model_path, contract, model_sha256


def read_oof_rows(handoff: Path) -> tuple[list[OOFRow], list[dict[str, Any]]]:
    """Read and validate exactly the five locked OOF prediction files."""

    rows: list[OOFRow] = []
    source_files: list[dict[str, Any]] = []
    seen_ids: set[str] = set()

    for filename in OOF_FILENAMES:
        path = handoff / "training" / filename
        require_file(path)
        file_rows: list[OOFRow] = []
        try:
            with path.open("r", encoding="utf-8", newline="") as handle:
                reader = csv.DictReader(handle)
                if tuple(reader.fieldnames or ()) != OOF_HEADER:
                    raise ArtifactError(
                        f"unexpected header in {path}: {reader.fieldnames!r}"
                    )
                for line_number, raw in enumerate(reader, start=2):
                    try:
                        image_id = raw["Image ID"]
                        true_index = int(raw["true_index"])
                        predicted_index = int(raw["predicted_index"])
                        probabilities = tuple(
                            float(raw[f"prob_{label}"]) for label in CLASS_ORDER
                        )
                    except (KeyError, TypeError, ValueError) as error:
                        raise ArtifactError(
                            f"invalid OOF row {path}:{line_number}: {error}"
                        ) from error
                    if not image_id:
                        raise ArtifactError(f"empty image ID in {path}:{line_number}")
                    if image_id in seen_ids:
                        raise ArtifactError(f"duplicate OOF image ID: {image_id}")
                    if true_index not in range(len(CLASS_ORDER)):
                        raise ArtifactError(
                            f"invalid true_index in {path}:{line_number}: {true_index}"
                        )
                    if predicted_index not in range(len(CLASS_ORDER)):
                        raise ArtifactError(
                            f"invalid predicted_index in {path}:{line_number}: {predicted_index}"
                        )
                    if raw["true_class"] != CLASS_ORDER[true_index]:
                        raise ArtifactError(
                            f"true class/index mismatch in {path}:{line_number}"
                        )
                    if raw["predicted_class"] != CLASS_ORDER[predicted_index]:
                        raise ArtifactError(
                            f"predicted class/index mismatch in {path}:{line_number}"
                        )
                    validate_probability_vector(
                        probabilities, f"{path}:{line_number}"
                    )
                    if max(range(len(probabilities)), key=probabilities.__getitem__) != predicted_index:
                        raise ArtifactError(
                            f"predicted class/probability mismatch in {path}:{line_number}"
                        )
                    file_rows.append(
                        OOFRow(
                            true_index=true_index,
                            predicted_index=predicted_index,
                            probabilities=probabilities,
                        )
                    )
                    seen_ids.add(image_id)
        except (OSError, UnicodeError) as error:
            raise ArtifactError(f"cannot read OOF artifact {path}: {error}") from error

        if not file_rows:
            raise ArtifactError(f"OOF artifact has no rows: {path}")
        rows.extend(file_rows)
        source_files.append(
            {
                "path": relative_to_handoff(path, handoff),
                "sha256": sha256_file(path),
                "row_count": len(file_rows),
            }
        )

    if len(rows) != EXPECTED_SOURCE_ROW_COUNT:
        raise ArtifactError(
            f"expected exactly {EXPECTED_SOURCE_ROW_COUNT} OOF rows from five files, got {len(rows)}"
        )
    return rows, source_files


def metrics(rows: list[OOFRow], threshold: float) -> dict[str, Any]:
    true_positive = false_positive = true_negative = false_negative = 0
    for row in rows:
        warned = row.max_softmax < threshold
        if warned and row.is_error:
            true_positive += 1
        elif warned and not row.is_error:
            false_positive += 1
        elif not warned and not row.is_error:
            true_negative += 1
        else:
            false_negative += 1

    warned_count = true_positive + false_positive
    precision = (
        true_positive / (true_positive + false_positive)
        if true_positive + false_positive
        else 0.0
    )
    recall = (
        true_positive / (true_positive + false_negative)
        if true_positive + false_negative
        else 0.0
    )
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "threshold": threshold,
        "f1": f1,
        "precision": precision,
        "recall": recall,
        "confusion_counts": {
            "true_positive": true_positive,
            "false_positive": false_positive,
            "true_negative": true_negative,
            "false_negative": false_negative,
        },
        "warned_sample_count": warned_count,
        "warned_sample_rate": warned_count / len(rows),
    }


def derive_threshold(rows: list[OOFRow], source_files: list[dict[str, Any]], model_sha256: str) -> dict[str, Any]:
    candidates = sorted({0.0, 1.0, *(row.max_softmax for row in rows)})
    evaluations = [metrics(rows, candidate) for candidate in candidates]
    selected = max(
        evaluations,
        key=lambda result: (
            result["f1"],
            result["recall"],
            result["threshold"],
        ),
    )
    return {
        "artifact": "CaneGuard Model V1 confidence caution threshold",
        "model_sha256": model_sha256,
        "class_order": list(CLASS_ORDER),
        "threshold": selected["threshold"],
        "f1": selected["f1"],
        "precision": selected["precision"],
        "recall": selected["recall"],
        "confusion_counts": selected["confusion_counts"],
        "warned_sample_count": selected["warned_sample_count"],
        "warned_sample_rate": selected["warned_sample_rate"],
        "source_row_count": len(rows),
        "selection_rule": {
            "positive_event": "predicted_index != true_index",
            "score": "max(prob_healthy, prob_mosaic, prob_rust, prob_smut)",
            "candidate_thresholds": "0.0, each distinct observed max-Softmax score, and 1.0",
            "warning_rule": "warn when max-Softmax score < threshold",
            "optimization": "maximize F1 for incorrect-prediction detection; ties prefer higher error recall, then higher threshold",
            "holdout_tuning": "not used",
        },
        "source_files": source_files,
    }


def verify_existing_source_files(
    path: Path, expected: list[dict[str, Any]]
) -> None:
    if not path.exists():
        return
    existing = read_json(path)
    if existing.get("source_files") != expected:
        raise ArtifactError(f"existing source identities differ: {path}")


def verify_existing_fixture_sources(
    path: Path, expected_fixtures: list[dict[str, Any]]
) -> None:
    if not path.exists():
        return
    existing = read_json(path)
    existing_fixtures = existing.get("fixtures")
    if not isinstance(existing_fixtures, list):
        raise ArtifactError(f"existing source identities differ: {path}")
    expected = [
        {
            "fixture_id": fixture["fixture_id"],
            "file": fixture["file"],
            "source_sha256": fixture["source_sha256"],
        }
        for fixture in expected_fixtures
    ]
    actual = [
        {
            "fixture_id": fixture.get("fixture_id"),
            "file": fixture.get("file"),
            "source_sha256": fixture.get("source_sha256"),
        }
        for fixture in existing_fixtures
        if isinstance(fixture, dict)
    ]
    if actual != expected or len(actual) != len(existing_fixtures):
        raise ArtifactError(f"existing source identities differ: {path}")


def preprocessing_contract(contract: dict[str, Any]) -> dict[str, Any]:
    input_contract = contract["input"]
    return {
        "input_shape": input_contract["shape"],
        "dtype": input_contract["dtype"],
        "channel_order": input_contract["channel_order"],
        "pixel_range_before_model": input_contract["pixel_range_before_model"],
        "resize": input_contract["resize"],
        "resize_interpolation": input_contract["resize_interpolation"],
        "letterbox_value": input_contract["letterbox_value"],
        "normalization": input_contract["normalization"],
    }


def run_qa_fixtures(
    handoff: Path,
    model_path: Path,
    contract: dict[str, Any],
    model_sha256: str,
) -> dict[str, Any]:
    """Run the accepted Float32 model on the four fixed handoff fixtures."""

    try:
        import numpy as np
        from PIL import Image, ImageOps
        from tflite_runtime.interpreter import Interpreter
    except ImportError as error:
        raise ArtifactError(
            "QA inference requires tflite-runtime, Pillow, and NumPy; "
            "use the documented uv command"
        ) from error

    try:
        interpreter = Interpreter(model_path=str(model_path))
        interpreter.allocate_tensors()
    except (OSError, RuntimeError, ValueError) as error:
        raise ArtifactError(f"cannot run accepted Float32 TFLite model: {error}") from error

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()
    if len(input_details) != 1 or len(output_details) != 1:
        raise ArtifactError(
            f"expected one input and one output tensor, got {len(input_details)} and {len(output_details)}"
        )
    input_detail = input_details[0]
    output_detail = output_details[0]
    if input_detail["dtype"] is not np.float32 or tuple(input_detail["shape"]) != (1, 224, 224, 3):
        raise ArtifactError(
            f"unexpected runtime input tensor: dtype={input_detail['dtype']!r}, shape={input_detail['shape']!r}"
        )
    if output_detail["dtype"] is not np.float32 or tuple(output_detail["shape"]) != (1, 4):
        raise ArtifactError(
            f"unexpected runtime output tensor: dtype={output_detail['dtype']!r}, shape={output_detail['shape']!r}"
        )

    fixtures: list[dict[str, Any]] = []
    for filename in QA_FILENAMES:
        path = handoff / "qa" / filename
        require_file(path)
        try:
            with Image.open(path) as source:
                image = ImageOps.exif_transpose(source).convert("RGB")
                scale = min(224 / image.width, 224 / image.height)
                resized_size = (
                    round(image.width * scale),
                    round(image.height * scale),
                )
                resized = image.resize(resized_size, Image.Resampling.BILINEAR)
                resized_array = np.asarray(resized, dtype=np.float32)
                tensor = np.full((224, 224, 3), 127.5, dtype=np.float32)
                left = (224 - resized_size[0]) // 2
                top = (224 - resized_size[1]) // 2
                tensor[
                    top : top + resized_size[1],
                    left : left + resized_size[0],
                    :,
                ] = resized_array
        except (OSError, ValueError) as error:
            raise ArtifactError(f"cannot read QA fixture {path}: {error}") from error

        try:
            interpreter.set_tensor(input_detail["index"], tensor[None, ...])
            interpreter.invoke()
            probabilities = interpreter.get_tensor(output_detail["index"])[0].astype(float).tolist()
        except (RuntimeError, ValueError) as error:
            raise ArtifactError(f"inference failed for QA fixture {path}: {error}") from error
        validate_probability_vector(probabilities, str(path))
        top_index = max(range(len(probabilities)), key=probabilities.__getitem__)
        fixtures.append(
            {
                "fixture_id": path.stem,
                "file": relative_to_handoff(path, handoff),
                "source_sha256": sha256_file(path),
                "expected_top1_class": CLASS_ORDER[top_index],
                "probabilities": dict(zip(CLASS_ORDER, probabilities)),
            }
        )

    return {
        "artifact": "CaneGuard Model V1 QA expected outputs",
        "model_sha256": model_sha256,
        "model": {
            "file": relative_to_handoff(model_path, handoff),
            "sha256": model_sha256,
            "precision": "float32",
        },
        "class_order": list(CLASS_ORDER),
        "preprocessing_contract": preprocessing_contract(contract),
        "qa_runner": {
            "interpreter": "tflite_runtime.interpreter.Interpreter",
            "image_decoder": "Pillow",
            "resize_implementation": "Pillow Image.Resampling.BILINEAR with centered letterbox",
            "exif_orientation": "Pillow ImageOps.exif_transpose",
            "letterbox_array_value": 127.5,
        },
        "fixtures": fixtures,
    }


def write_json(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        path.write_text(
            json.dumps(value, indent=2, sort_keys=False, ensure_ascii=True) + "\n",
            encoding="utf-8",
        )
    except OSError as error:
        raise ArtifactError(f"cannot write generated artifact {path}: {error}") from error


def print_summary(threshold: dict[str, Any], qa: dict[str, Any]) -> None:
    print(
        "threshold: "
        f"{threshold['threshold']:.7f} "
        f"F1={threshold['f1']:.6f} "
        f"precision={threshold['precision']:.6f} "
        f"recall={threshold['recall']:.6f} "
        f"warned={threshold['warned_sample_count']}/{threshold['source_row_count']} "
        f"({threshold['warned_sample_rate']:.6%})"
    )
    print("confusion: " + json.dumps(threshold["confusion_counts"], sort_keys=True))
    print("qa_expected_outputs:")
    print("fixture_id | top1 | healthy | mosaic | rust | smut")
    for fixture in qa["fixtures"]:
        scores = fixture["probabilities"]
        print(
            f"{fixture['fixture_id']} | {fixture['expected_top1_class']} | "
            + " | ".join(f"{scores[label]:.9f}" for label in CLASS_ORDER)
        )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--handoff",
        type=Path,
        default=Path.home() / "projects" / "CaneGuard-V1-Integration-Handoff",
        help="read-only Model V1 handoff directory",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="repository directory receiving threshold/ and qa/ artifacts",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    handoff = args.handoff.expanduser().resolve()
    output_dir = args.output_dir.resolve()
    if not handoff.is_dir():
        print(f"blocked: handoff directory is missing: {handoff}", file=sys.stderr)
        return 2
    try:
        if output_dir == handoff or output_dir.is_relative_to(handoff):
            raise ArtifactError("output directory must not be the read-only handoff directory")
        model_path, contract, model_sha256 = verify_model_and_contract(handoff)
        threshold_path = output_dir / "threshold" / "v1-confidence-caution-threshold.json"
        qa_path = output_dir / "qa" / "expected-v1-outputs.json"
        rows, source_files = read_oof_rows(handoff)
        verify_existing_source_files(threshold_path, source_files)
        threshold = derive_threshold(rows, source_files, model_sha256)
        qa = run_qa_fixtures(handoff, model_path, contract, model_sha256)
        verify_existing_fixture_sources(qa_path, qa["fixtures"])
        write_json(threshold_path, threshold)
        write_json(qa_path, qa)
    except ArtifactError as error:
        print(f"blocked: {error}", file=sys.stderr)
        return 2

    print_summary(threshold, qa)
    print(f"wrote: {output_dir / 'threshold' / 'v1-confidence-caution-threshold.json'}")
    print(f"wrote: {output_dir / 'qa' / 'expected-v1-outputs.json'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
