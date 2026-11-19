import { validateGuardContract } from '@/features/detection/model/validateGuardContract';

const input = { name: 'whatever_input:0', dataType: 'float32', shape: [1, 224, 224, 3] };
const output = { name: 'whatever_output:0', dataType: 'float32', shape: [1, 1] };

describe('validateGuardContract', () => {
  // Proves: real tensor metadata matching the contract passes, with names read from the model (not pinned to V2's).
  it('accepts the contract tensors under any tensor name', () => {
    expect(validateGuardContract({ inputs: [input], outputs: [output] })).toBeNull();
  });

  // Proves: wrong input/output shape, dtype or arity is a contract mismatch (fail closed; also rejects V2's [1,5] output).
  it.each([
    ['letterbox-incompatible input shape', { inputs: [{ ...input, shape: [1, 224, 224, 1] }], outputs: [output] }],
    ['int8 input', { inputs: [{ ...input, dataType: 'uint8' }], outputs: [output] }],
    ['two inputs', { inputs: [input, input], outputs: [output] }],
    ['V2 five-class output', { inputs: [input], outputs: [{ ...output, shape: [1, 5] }] }],
    ['softmax-style [1,2] output', { inputs: [input], outputs: [{ ...output, shape: [1, 2] }] }],
    ['no outputs', { inputs: [input], outputs: [] }],
  ])('rejects %s', (_name, metadata) => {
    expect(validateGuardContract(metadata)).toMatchObject({ code: 'GUARD_CONTRACT_MISMATCH' });
  });
});
