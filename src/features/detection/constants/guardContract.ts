/**
 * Guard V1: a frozen binary sugarcane-presence gate that always runs before the
 * five-class V2 disease classifier. It is NOT a diagnostic model: its output is
 * never a disease score and never becomes a `ModelLabel`. The pinned values mirror
 * `assets/models/caneguard_guard_v1_contract.json`; a test keeps them equal.
 */
export const GUARD_V1 = {
  modelId: 'caneguard_guard_v1',
  sha256: '36c514184aaa4f96ee762dcbc0ca32eb26df40acec919f6c4264e8ee44fe6d60',
  input: {
    shape: [1, 224, 224, 3],
    dataType: 'float32',
  },
  output: {
    shape: [1, 1],
    dataType: 'float32',
  },
  acceptThreshold: 0.75,
  inputByteLength: 224 * 224 * 3 * Float32Array.BYTES_PER_ELEMENT,
} as const;

export function isGuardedResult(
  result: { guardModelId?: unknown } | null | undefined,
): result is { guardModelId: typeof GUARD_V1.modelId } {
  return result?.guardModelId === GUARD_V1.modelId;
}
