#!/usr/bin/env python3
"""Check the checked-in TFLite tensor ABI without a device or native runtime.

The standard-library FlatBuffer reader below extracts only Model -> SubGraph ->
Tensor fields. It lets this host fixture guard the actual packaged model even on
machines without tflite-runtime installed; it does not run inference.
"""

from __future__ import annotations

import os
import struct
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = Path(
    os.environ.get(
        "CANEGUARD_TEST_TFLITE_MODEL",
        ROOT / "assets/models/caneguard_v1_mobilenetv2_float32.tflite",
    )
)
EXPECTED_INPUT = ("serving_default_image:0", (1, 224, 224, 3), 0)
EXPECTED_OUTPUT = ("StatefulPartitionedCall_1:0", (1, 4), 0)


class FlatbufferError(ValueError):
    """The model is not a well-formed FlatBuffer for the fields we consume."""


def _unpack(data: bytes, fmt: str, offset: int) -> tuple[object, ...]:
    size = struct.calcsize(fmt)
    if offset < 0 or offset + size > len(data):
        raise FlatbufferError(f"truncated FlatBuffer at byte {offset}")
    return struct.unpack_from(fmt, data, offset)


def _table_field(data: bytes, table_position: int, field_index: int) -> int | None:
    (vtable_offset,) = _unpack(data, "<i", table_position)
    vtable_position = table_position - vtable_offset
    (vtable_size,) = _unpack(data, "<H", vtable_position)
    entry_position = 4 + field_index * 2
    if entry_position + 2 > vtable_size:
        return None
    (field_offset,) = _unpack(data, "<H", vtable_position + entry_position)
    return table_position + field_offset if field_offset else None


def _indirect(data: bytes, position: int) -> int:
    (offset,) = _unpack(data, "<I", position)
    target = position + offset
    if target >= len(data):
        raise FlatbufferError(f"invalid FlatBuffer offset at byte {position}")
    return target


def _vector(data: bytes, position: int | None, item_format: str) -> list[object]:
    if position is None:
        return []
    vector_position = _indirect(data, position)
    (length,) = _unpack(data, "<I", vector_position)
    item_size = struct.calcsize(item_format)
    end = vector_position + 4 + length * item_size
    if end > len(data):
        raise FlatbufferError(f"truncated FlatBuffer vector at byte {vector_position}")
    return [
        _unpack(data, item_format, vector_position + 4 + index * item_size)[0]
        for index in range(length)
    ]


def _table_vector(data: bytes, position: int | None) -> list[int]:
    if position is None:
        return []
    vector_position = _indirect(data, position)
    (length,) = _unpack(data, "<I", vector_position)
    end = vector_position + 4 + length * 4
    if end > len(data):
        raise FlatbufferError(f"truncated FlatBuffer table vector at byte {vector_position}")
    return [
        _indirect(data, vector_position + 4 + index * 4)
        for index in range(length)
    ]


def _string(data: bytes, position: int | None) -> str:
    if position is None:
        return ""
    string_position = _indirect(data, position)
    (length,) = _unpack(data, "<I", string_position)
    start = string_position + 4
    end = start + length
    if end > len(data):
        raise FlatbufferError(f"truncated FlatBuffer string at byte {string_position}")
    try:
        return data[start:end].decode("utf-8")
    except UnicodeDecodeError as error:
        raise FlatbufferError(f"invalid UTF-8 in FlatBuffer string: {error}") from error


def _tensor_contract(data: bytes, tensor: int) -> tuple[str, tuple[int, ...], int]:
    shape = tuple(_vector(data, _table_field(data, tensor, 0), "<i"))
    type_position = _table_field(data, tensor, 1)
    tensor_type = 0 if type_position is None else _unpack(data, "<b", type_position)[0]
    name = _string(data, _table_field(data, tensor, 3))
    return name, shape, int(tensor_type)


def model_tensor_contracts(model_path: Path) -> tuple[tuple[str, tuple[int, ...], int], ...]:
    data = model_path.read_bytes()
    if len(data) < 8 or data[4:8] != b"TFL3":
        raise FlatbufferError(f"{model_path} is not a TFLite FlatBuffer")

    (root_position,) = _unpack(data, "<I", 0)
    subgraphs = _table_vector(data, _table_field(data, root_position, 2))
    if len(subgraphs) != 1:
        raise FlatbufferError(f"expected one TFLite subgraph, got {len(subgraphs)}")

    subgraph = subgraphs[0]
    tensors = _table_vector(data, _table_field(data, subgraph, 0))
    input_indices = _vector(data, _table_field(data, subgraph, 1), "<i")
    output_indices = _vector(data, _table_field(data, subgraph, 2), "<i")
    if len(input_indices) != 1 or len(output_indices) != 1:
        raise FlatbufferError(
            f"expected one input and one output, got {len(input_indices)} and {len(output_indices)}"
        )

    contracts = []
    for index in (input_indices[0], output_indices[0]):
        if not isinstance(index, int) or index < 0 or index >= len(tensors):
            raise FlatbufferError(f"invalid tensor index {index!r}")
        contracts.append(_tensor_contract(data, tensors[index]))
    return tuple(contracts)


class TfliteModelShapeContractTests(unittest.TestCase):
    def test_checked_in_model_matches_the_v1_input_and_output_shape_fixtures(self) -> None:
        input_contract, output_contract = model_tensor_contracts(MODEL_PATH)

        self.assertEqual(input_contract, EXPECTED_INPUT)
        self.assertEqual(output_contract, EXPECTED_OUTPUT)


if __name__ == "__main__":
    unittest.main()
