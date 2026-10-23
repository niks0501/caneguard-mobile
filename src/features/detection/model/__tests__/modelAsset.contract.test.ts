import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  MODEL_FILENAME,
  MODEL_INPUT,
  MODEL_OUTPUT,
} from '@/features/detection/constants/modelContract';
import { validateModelContract } from '@/features/detection/model/validateModelContract';

/**
 * Host-level fixture: reads the bundled `.tflite` asset as a FlatBuffer and
 * asserts its declared input/output tensor metadata against the Model V1
 * contract. This is a static asset check on the host, not native inference.
 */
const TENSOR_TYPES: Record<number, string> = {
  0: 'float32',
  1: 'float16',
  2: 'int32',
  3: 'uint8',
  4: 'int64',
  5: 'string',
  6: 'bool',
  7: 'int16',
  8: 'complex64',
  9: 'int8',
  10: 'float64',
};

function readU32(buffer: Buffer, offset: number): number {
  return buffer.readUInt32LE(offset);
}

function readI32(buffer: Buffer, offset: number): number {
  return buffer.readInt32LE(offset);
}

function readU16(buffer: Buffer, offset: number): number {
  return buffer.readUInt16LE(offset);
}

function rootTable(buffer: Buffer): number {
  const offset = readU32(buffer, 0);
  return offset;
}

function fieldOffset(buffer: Buffer, table: number, fieldIndex: number): number {
  const vtable = table - readI32(buffer, table);
  const vtableSize = readU16(buffer, vtable);
  const fieldEntry = vtable + 4 + fieldIndex * 2;
  if (fieldEntry >= vtable + vtableSize) {
    return 0;
  }
  return readU16(buffer, fieldEntry);
}

function fieldPosition(
  buffer: Buffer,
  table: number,
  fieldIndex: number,
): number | null {
  const offset = fieldOffset(buffer, table, fieldIndex);
  return offset === 0 ? null : table + offset;
}

function vector(buffer: Buffer, table: number, fieldIndex: number): number[] {
  const position = fieldPosition(buffer, table, fieldIndex);
  if (position === null) {
    return [];
  }
  const vectorStart = position + readU32(buffer, position);
  const length = readU32(buffer, vectorStart);
  return Array.from({ length }, (_, index) =>
    readU32(buffer, vectorStart + 4 + index * 4),
  );
}

function tableVector(
  buffer: Buffer,
  table: number,
  fieldIndex: number,
): number[] {
  const position = fieldPosition(buffer, table, fieldIndex);
  if (position === null) {
    return [];
  }
  const vectorStart = position + readU32(buffer, position);
  const length = readU32(buffer, vectorStart);
  return Array.from({ length }, (_, index) => {
    const elementPosition = vectorStart + 4 + index * 4;
    return elementPosition + readU32(buffer, elementPosition);
  });
}

function stringField(
  buffer: Buffer,
  table: number,
  fieldIndex: number,
): string {
  const position = fieldPosition(buffer, table, fieldIndex);
  if (position === null) {
    return '';
  }
  const stringStart = position + readU32(buffer, position);
  const length = readU32(buffer, stringStart);
  return buffer
    .subarray(stringStart + 4, stringStart + 4 + length)
    .toString('utf8');
}

interface ParsedTensor {
  name: string;
  shape: number[];
  type: number;
}

function parseTfliteModel(asset: Buffer): {
  inputs: ParsedTensor[];
  outputs: ParsedTensor[];
  subgraphCount: number;
  version: number;
} {
  const model = rootTable(asset);
  const version = (() => {
    const position = fieldPosition(asset, model, 0);
    return position === null ? 0 : readU32(asset, position);
  })();
  const subgraphs = tableVector(asset, model, 2);
  const subgraphCount = subgraphs.length;
  if (subgraphCount === 0) {
    return { inputs: [], outputs: [], subgraphCount, version };
  }
  const subgraph = subgraphs[0];
  const tensors = tableVector(asset, subgraph, 0);
  const readTensor = (tensorIndex: number): ParsedTensor => {
    const tensor = tensors[tensorIndex];
    const shape = vector(asset, tensor, 0).map((value) =>
      // FlatBuffers int32 values are stored little-endian; the unsigned read
      // above is safe for positive dimensions, so reinterpret negative values.
      value > 0x7fffffff ? value - 0x100000000 : value,
    );
    const typePosition = fieldPosition(asset, tensor, 1);
    const type = typePosition === null ? 0 : readI32(asset, typePosition);
    return { name: stringField(asset, tensor, 3), shape, type };
  };
  const inputIndices = vector(asset, subgraph, 1);
  const outputIndices = vector(asset, subgraph, 2);
  return {
    inputs: inputIndices.map(readTensor),
    outputs: outputIndices.map(readTensor),
    subgraphCount,
    version,
  };
}

describe('bundled Model V1 TFLite asset (host fixture)', () => {
  const asset = readFileSync(
    join(process.cwd(), 'assets', 'models', MODEL_FILENAME),
  );
  const parsed = parseTfliteModel(asset);

  it('is a single-subgraph TensorFlow Lite flatbuffer', () => {
    expect(asset.length).toBeGreaterThan(1_000_000);
    expect(parsed.version).toBe(3);
    expect(parsed.subgraphCount).toBe(1);
  });

  it('declares exactly one float32 input with the contract shape', () => {
    expect(parsed.inputs).toHaveLength(1);
    expect(parsed.inputs[0]?.shape).toEqual([...MODEL_INPUT.shape]);
    expect(TENSOR_TYPES[parsed.inputs[0]?.type ?? -1]).toBe(MODEL_INPUT.dataType);
  });

  it('declares exactly one float32 output with one score per class', () => {
    expect(parsed.outputs).toHaveLength(1);
    expect(parsed.outputs[0]?.shape).toEqual([...MODEL_OUTPUT.shape]);
    expect(parsed.outputs[0]?.shape[1]).toBe(4);
    expect(TENSOR_TYPES[parsed.outputs[0]?.type ?? -1]).toBe(MODEL_OUTPUT.dataType);
  });

  it('feeds the runtime contract validator the asset’s own tensor metadata', () => {
    const metadata = {
      inputs: parsed.inputs.map((tensor) => ({
        dataType: TENSOR_TYPES[tensor.type] ?? 'unknown',
        name: tensor.name,
        shape: tensor.shape,
      })),
      outputs: parsed.outputs.map((tensor) => ({
        dataType: TENSOR_TYPES[tensor.type] ?? 'unknown',
        name: tensor.name,
        shape: tensor.shape,
      })),
    };
    // The asset names must match the frozen contract names for a loaded model.
    expect(metadata.inputs[0].name).toBe(MODEL_INPUT.name);
    expect(metadata.outputs[0].name).toBe(MODEL_OUTPUT.name);
    expect(validateModelContract(metadata)).toBeNull();
  });

  it('fails closed when the parsed metadata drifts from the contract', () => {
    const drifted = {
      inputs: parsed.inputs.map((tensor) => ({
        dataType: TENSOR_TYPES[tensor.type] ?? 'unknown',
        name: tensor.name,
        shape: [1, 256, 256, 3],
      })),
      outputs: parsed.outputs.map((tensor) => ({
        dataType: TENSOR_TYPES[tensor.type] ?? 'unknown',
        name: tensor.name,
        shape: tensor.shape,
      })),
    };
    expect(validateModelContract(drifted)?.code).toBe('MODEL_CONTRACT_MISMATCH');
  });
});
