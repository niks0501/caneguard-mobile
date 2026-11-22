import { deriveScanCheckState } from '@/features/detection/context/scanCheckState';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import type { DetectionResult, ScanSessionState } from '@/features/detection/types';

const base: ScanSessionState = {
  ...initialScanSessionState,
  sourceUri: 'file:///a.jpg',
  sourceType: 'camera',
  status: 'image-selected',
  qualityAssessment: { warnings: [], meanLuminance: 100, luminanceStandardDeviation: 40 },
};
const result = { predictedLabel: 'rust', confidence: 0.6 } as unknown as DetectionResult;

describe('guard failures in the session reducer', () => {
  // Proves: a guard rejection or fault is an error state with no completed result, and is named not-sugarcane only for a rejection.
  it('keeps a rejection out of completed results', () => {
    const rejected = scanSessionReducer(
      { ...base, result },
      { type: 'SET_ERROR', payload: 'no', guardFailure: 'rejected' },
    );
    expect(rejected.status).toBe('error');
    expect(rejected.result).toBeNull();
    expect(rejected.guardFailure).toBe('rejected');
    expect(
      deriveScanCheckState({
        session: rejected,
        modelState: 'loaded',
        photoFailedCheck: false,
        replacing: false,
      }),
    ).toBe('not-sugarcane');

    const fault = scanSessionReducer(base, {
      type: 'SET_ERROR',
      payload: 'fault',
      guardFailure: 'error',
    });
    expect(fault.result).toBeNull();
    expect(
      deriveScanCheckState({
        session: fault,
        modelState: 'loaded',
        photoFailedCheck: false,
        replacing: false,
      }),
    ).toBe('model-failed');
  });

  // Proves: retry and replacement clear the failure so it cannot leak onto the next attempt.
  it('clears the failure on retry, inference start and a new photo', () => {
    const failed = scanSessionReducer(base, {
      type: 'SET_ERROR',
      payload: 'no',
      guardFailure: 'rejected',
    });
    expect(scanSessionReducer(failed, { type: 'CLEAR_ERROR' })).toMatchObject({
      status: 'image-selected',
      guardFailure: null,
    });
    expect(scanSessionReducer(failed, { type: 'START_INFERENCE' }).guardFailure).toBeNull();
    expect(
      scanSessionReducer(failed, {
        type: 'SELECT_IMAGE',
        payload: { sourceUri: 'file:///b.jpg', sourceWidth: 1, sourceHeight: 1, sourceType: 'gallery' },
      }).guardFailure,
    ).toBeUndefined();
  });

});

describe('guard override', () => {
  // Proves: only a rejection can be overridden; it returns to image-selected, and a new photo drops the override.
  it('overrides a rejection only, and a new photo clears it', () => {
    const rejected = scanSessionReducer(base, {
      type: 'SET_ERROR',
      payload: 'no',
      guardFailure: 'rejected',
    });
    const overridden = scanSessionReducer(rejected, { type: 'OVERRIDE_GUARD' });
    expect(overridden).toMatchObject({
      status: 'image-selected',
      guardOverride: true,
      guardFailure: null,
      errorMessage: null,
    });
    expect(scanSessionReducer(base, { type: 'OVERRIDE_GUARD' })).toBe(base);
    const fault = scanSessionReducer(base, {
      type: 'SET_ERROR',
      payload: 'fault',
      guardFailure: 'error',
    });
    expect(scanSessionReducer(fault, { type: 'OVERRIDE_GUARD' })).toBe(fault);
    expect(
      scanSessionReducer(overridden, {
        type: 'SELECT_IMAGE',
        payload: { sourceUri: 'file:///b.jpg', sourceType: 'camera' } as never,
      }).guardOverride,
    ).toBeUndefined();
  });
});
