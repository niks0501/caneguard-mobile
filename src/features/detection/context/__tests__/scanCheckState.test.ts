import {
  clearedStatus,
  deriveScanCheckState,
  isPhotoNotUsable,
  type ScanCheckInputs,
} from '@/features/detection/context/scanCheckState';
import { initialScanSessionState, scanSessionReducer } from '@/features/detection/context/scanSessionReducer';
import { SCAN_CHECK_COPY, SCAN_STATE_COPY } from '@/constants/copy';
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

describe('SCAN_STATE_COPY', () => {
  // Proves: "Photo checked" heads only the two result states.
  it('uses the checked heading only for result states', () => {
    for (const [state, copy] of Object.entries(SCAN_STATE_COPY)) {
      const isResult = state === 'result' || state === 'result-doubtful';
      expect(copy.title === SCAN_CHECK_COPY.checkedTitle).toBe(isResult);
    }
  });
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

  it('keeps a settled photo rejection ahead of model availability', () => {
    expect(
      deriveScanCheckState(
        inputs(
          { status: 'image-selected', qualityAssessment: assessment(['too-dark']) },
          { modelState: 'error', photoFailedCheck: true },
        ),
      ),
    ).toBe('photo-rejected');
  });

  // Proves: Analysing covers running and finalizing.
  it('names the guard step checking-sugarcane and the V2 step analysing', () => {
    const running = { status: 'running', qualityAssessment: assessment([]) } as const;
    expect(deriveScanCheckState(inputs({ ...running, guardPassed: false }))).toBe(
      'checking-sugarcane',
    );
    expect(deriveScanCheckState(inputs({ ...running, guardPassed: true }))).toBe('analysing');
    expect(
      deriveScanCheckState(
        inputs({ status: 'finalizing', guardPassed: true, qualityAssessment: assessment([]) }),
      ),
    ).toBe('analysing');
  });

  // Proves: a guard input fault is photo-unusable; a rejection, a runtime fault and a
  // quality-preparation fault keep their own states.
  it('splits guard input faults from rejection, runtime faults and preparation faults', () => {
    expect(
      deriveScanCheckState(
        inputs(
          { status: 'error', guardFailure: 'error', photoPreparationFailed: true },
          { photoFailedCheck: true },
        ),
      ),
    ).toBe('photo-unusable');
    expect(
      deriveScanCheckState(inputs({ status: 'error', guardFailure: 'error' })),
    ).toBe('model-failed');
    expect(deriveScanCheckState(inputs({ status: 'error', guardFailure: 'rejected' }))).toBe(
      'not-sugarcane',
    );
  });

  // Proves: every section 6 transition, walked through the real reducer.
  it('walks the section 6 transitions through the reducer', () => {
    const q = assessment([]);
    const step = (s: typeof initialScanSessionState, modelState = 'loaded') =>
      deriveScanCheckState({ session: s, modelState, photoFailedCheck: false, replacing: false });
    let s = scanSessionReducer(initialScanSessionState, {
      type: 'SELECT_IMAGE',
      payload: { sourceUri: 'file:///a.jpg', sourceWidth: 1, sourceHeight: 1, sourceType: 'camera' },
    });
    expect(step(s)).toBe('checking-photo');
    s = scanSessionReducer(s, { type: 'START_PREPROCESSING' });
    expect(step(s)).toBe('checking-photo');
    s = scanSessionReducer(s, {
      type: 'COMPLETE_PREPROCESSING',
      payload: { processedUri: 'file:///p.jpg', preprocessMs: 1, qualityAssessment: q },
    });
    expect(step(s, 'loading')).toBe('waiting-model');
    s = scanSessionReducer(s, { type: 'START_INFERENCE' });
    expect(step(s)).toBe('checking-sugarcane');
    // reject
    const rejected = scanSessionReducer(s, {
      type: 'SET_ERROR',
      payload: 'no',
      guardFailure: 'rejected',
    });
    expect(step(rejected)).toBe('not-sugarcane');
    // input fault
    const unusable = scanSessionReducer(s, {
      type: 'SET_ERROR',
      payload: 'big',
      guardFailure: 'error',
      photoPreparationFailed: true,
    });
    expect(step(unusable)).toBe('photo-unusable');
    // runtime fault, then Try again returns to the step that failed
    const faulted = scanSessionReducer(s, {
      type: 'SET_ERROR',
      payload: 'oops',
      guardFailure: 'error',
    });
    expect(step(faulted)).toBe('model-failed');
    expect(step(scanSessionReducer(faulted, { type: 'CLEAR_ERROR' }))).toBe('waiting-model');
    // accept, then V2 finishes or faults
    s = scanSessionReducer(s, { type: 'GUARD_ACCEPTED' });
    expect(s.guardPassed).toBe(true);
    expect(step(s)).toBe('analysing');
    expect(
      step(scanSessionReducer(s, { type: 'SET_ERROR', payload: 'v2 failed' })),
    ).toBe('model-failed');
    expect(step(scanSessionReducer(s, { type: 'COMPLETE_INFERENCE', payload: result }))).toBe(
      'result',
    );
    // guardPassed clears on every restart path
    for (const action of [
      { type: 'START_PREPROCESSING' },
      { type: 'START_INFERENCE' },
      { type: 'RESET_SCAN' },
      {
        type: 'SELECT_IMAGE',
        payload: { sourceUri: 'file:///b.jpg', sourceWidth: 1, sourceHeight: 1, sourceType: 'camera' },
      },
    ] as const) {
      expect(scanSessionReducer(s, action).guardPassed).toBeFalsy();
    }
    // a new photo from any state goes back to checking-photo
    expect(
      deriveScanCheckState({ session: s, modelState: 'loaded', photoFailedCheck: false, replacing: true }),
    ).toBe('checking-photo');
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
    expect(
      deriveScanCheckState(
        inputs(
          { status: 'error', qualityAssessment: assessment(['too-dark']) },
          { modelState: 'error', photoFailedCheck: true },
        ),
      ),
    ).toBe('photo-rejected');
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

describe('isPhotoNotUsable', () => {
  // Proves: the one predicate is true only for an error status with a rejection or a
  // preparation failure, and deriveScanCheckState's error branch agrees with it.
  it('is true for rejected and preparation failures, false for other errors', () => {
    const cases: [Partial<ScanCheckInputs['session']>, boolean][] = [
      [{ status: 'error', guardFailure: 'rejected' }, true],
      [{ status: 'error', photoPreparationFailed: true }, true],
      [{ status: 'error', guardFailure: 'error', photoPreparationFailed: true }, true],
      [{ status: 'error', guardFailure: 'error' }, false],
      [{ status: 'error' }, false],
      [{ status: 'image-selected', guardFailure: 'rejected', photoPreparationFailed: true }, false],
    ];
    for (const [session, expected] of cases) {
      const full = inputs(session).session;
      expect(isPhotoNotUsable(full)).toBe(expected);
      const state = deriveScanCheckState(inputs(session));
      expect(['not-sugarcane', 'photo-unusable', 'check-failed'].includes(state)).toBe(
        expected && session.status === 'error',
      );
    }
  });
});
