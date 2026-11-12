import {
  clearedStatus,
  deriveScanCheckState,
  type ScanCheckInputs,
} from '@/features/detection/context/scanCheckState';
import { initialScanSessionState } from '@/features/detection/context/scanSessionReducer';
import type { DetectionResult } from '@/features/detection/types';

const assessment = (warnings: string[]) =>
  ({ warnings }) as unknown as NonNullable<ScanCheckInputs['session']['qualityAssessment']>;
const result = { predictedLabel: 'Healthy' } as unknown as DetectionResult;

const inputs = (
  session: Partial<ScanCheckInputs['session']>,
  rest: Partial<Omit<ScanCheckInputs, 'session'>> = {},
): ScanCheckInputs => ({
  session: { ...initialScanSessionState, sourceUri: 'file:///a.jpg', ...session },
  modelState: 'loaded',
  photoFailedCheck: false,
  replacing: false,
  ...rest,
});

describe('deriveScanCheckState', () => {
  // Proves: "No photo" is a named state of the one marker.
  it('names no photo', () => {
    expect(deriveScanCheckState(inputs({ sourceUri: null }))).toBe('no-photo');
  });

  // Proves: image-selected is no longer overloaded; not-yet-checked vs checked-waiting-model are distinct.
  it('tells a not-yet-checked photo from a checked one waiting for the model', () => {
    expect(deriveScanCheckState(inputs({ status: 'image-selected' }))).toBe('checking-photo');
    expect(deriveScanCheckState(inputs({ status: 'preprocessing' }))).toBe('checking-photo');
    expect(
      deriveScanCheckState(inputs({ status: 'image-selected', qualityAssessment: assessment([]) })),
    ).toBe('waiting-model');
  });

  // Proves: warnings name Photo rejected (model skipped), not an analysis state.
  it('names a warned photo as rejected', () => {
    expect(
      deriveScanCheckState(
        inputs(
          { status: 'image-selected', qualityAssessment: assessment(['blurry']) },
          { photoFailedCheck: true },
        ),
      ),
    ).toBe('photo-rejected');
  });

  // Proves: Analysing covers running and finalizing.
  it('names analysing', () => {
    expect(
      deriveScanCheckState(inputs({ status: 'running', qualityAssessment: assessment([]) })),
    ).toBe('analysing');
  });

  // Proves: result vs result-doubtful keeps PR #266 behavior (result stays, flagged doubtful).
  it('names result and doubtful result', () => {
    const done = { status: 'completed', result, qualityAssessment: assessment([]) } as const;
    expect(deriveScanCheckState(inputs(done))).toBe('result');
    expect(deriveScanCheckState(inputs(done, { photoFailedCheck: true }))).toBe('result-doubtful');
  });

  // Proves: error is split into photo (check-failed) vs model (model-failed) failure.
  it('splits error into check failed and model failed', () => {
    expect(
      deriveScanCheckState(
        inputs({ status: 'error', photoPreparationFailed: true }, { photoFailedCheck: true }),
      ),
    ).toBe('check-failed');
    expect(deriveScanCheckState(inputs({ status: 'error' }))).toBe('model-failed');
    expect(deriveScanCheckState(inputs({ status: 'image-selected' }, { modelState: 'error' }))).toBe(
      'model-failed',
    );
  });

  // Proves: the replacing source feeds the marker.
  it('shows checking while a photo is being replaced', () => {
    expect(
      deriveScanCheckState(inputs({ status: 'completed', result }, { replacing: true })),
    ).toBe('checking-photo');
  });
});

describe('clearedStatus', () => {
  // Proves: CLEAR_ERROR's return is named from state (photo retry, kept result, idle).
  it('retries from the photo, keeps a result, or goes idle', () => {
    expect(clearedStatus({ ...initialScanSessionState, sourceUri: 'x', status: 'error' })).toBe(
      'image-selected',
    );
    expect(
      clearedStatus({ ...initialScanSessionState, sourceUri: 'x', status: 'error', result }),
    ).toBe('completed');
    expect(clearedStatus({ ...initialScanSessionState, status: 'error' })).toBe('idle');
  });
});
