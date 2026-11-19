import { act, render, waitFor } from '@testing-library/react-native';
import { manipulateAsync } from 'expo-image-manipulator';
import { encode } from 'jpeg-js';
import { useCallback, useEffect, useReducer, useRef, useState, type Dispatch } from 'react';

import { GUARD_COPY } from '@/constants/copy';
import { GUARD_V1 } from '@/features/detection/constants/guardContract';
import {
  ScanDraftContext,
  ScanSessionContext,
  type ScanDraftContextValue,
} from '@/features/detection/context/ScanSessionProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import { clearScanAnalysisWork } from '@/features/detection/analysis/scanAnalysisWork';
import { useScanSession } from '@/features/detection/context/useScanSession';
import { useScanAnalysis } from '@/features/detection/analysis/useScanAnalysis';
import { GuardError } from '@/features/detection/model/guardInference';
import { preprocessGuardImage } from '@/features/detection/preprocessing/guardPreprocess';
import type {
  DetectionResult,
  ScanSessionAction,
  ScanSessionState,
  ScanSourceType,
} from '@/features/detection/types';

jest.mock('expo-file-system', () => ({
  Directory: function Directory() {
    return { exists: true, list: () => [] };
  },
  File: function File() {
    return { delete: jest.fn() };
  },
  Paths: { cache: 'file:///cache' },
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(),
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
}));
jest.mock('@/features/detection/preprocessing/guardPreprocess', () => ({
  preprocessGuardImage: jest.fn(async () => new ArrayBuffer(602_112)),
}));

type Controller = Record<string, unknown> & { run: jest.Mock };
let mockV2: Controller;
let mockGuard: Controller;

jest.mock('@/features/detection/model/useCaneGuardModel', () => ({
  useCaneGuardModel: () => mockV2,
}));
jest.mock('@/features/detection/model/useGuardModel', () => ({
  useGuardModel: () => mockGuard,
}));

// ---- self-created fixtures (no licensed or private imagery) ----------------
function fixtureRgba(width: number, height: number, dark: boolean): Uint8Array {
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      const left = x < width / 2;
      const top = y < height / 2;
      rgba[i] = dark ? 2 : top ? (left ? 220 : 30) : left ? 30 : 230;
      rgba[i + 1] = dark ? 2 : top ? (left ? 30 : 200) : left ? 40 : 220;
      rgba[i + 2] = dark ? 2 : top ? (left ? 30 : 40) : left ? 210 : 30;
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

function fixturePng(width: number, height: number, dark: boolean): string {
  const { PNG } = require('pngjs') as {
    PNG: { sync: { write(value: { data: Uint8Array; width: number; height: number }): Buffer } };
  };
  return PNG.sync.write({ data: fixtureRgba(width, height, dark), width, height }).toString('base64');
}

function fixtureJpeg(width: number, height: number, dark: boolean): string {
  return Buffer.from(
    encode({ data: fixtureRgba(width, height, dark), width, height }, 100).data,
  ).toString('base64');
}

const mockManipulate = manipulateAsync as jest.MockedFunction<typeof manipulateAsync>;

const V2_SCORES = [0.05, 0.1, 0.6, 0.05, 0.2]; // healthy, mosaic, rust, smut, rssi
const v2Output = () => [Float32Array.from(V2_SCORES).buffer as ArrayBuffer];
const guardOutput = (...values: number[]) => [Float32Array.from(values).buffer as ArrayBuffer];

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// ---- harness ----------------------------------------------------------------
type Latest = {
  analysis: ReturnType<typeof useScanAnalysis>;
  state: ScanSessionState;
  dispatch: (action: ScanSessionAction) => void;
};
let latest: Latest;
// The signed-in owner as the app sees it right now; a test changes it to simulate a switch.
let activeOwner = 'owner-a';

function Probe() {
  const analysis = useScanAnalysis(false);
  const { state, dispatch } = useScanSession();
  useEffect(() => {
    latest = { analysis, state, dispatch };
  });
  return null;
}

function Harness({
  initial,
  showProbe = true,
}: {
  initial: ScanSessionState;
  showProbe?: boolean;
}) {
  const [state, reducerDispatch] = useReducer(scanSessionReducer, initial);
  const [sessionGeneration, setSessionGeneration] = useState(0);
  const stateRef = useRef(state);
  const generationRef = useRef(sessionGeneration);
  stateRef.current = state;
  generationRef.current = sessionGeneration;
  const sessionIdentity = 'guard-test-session';
  const dispatch = useCallback<Dispatch<ScanSessionAction>>((action) => {
    if (
      action.type === 'SELECT_IMAGE' ||
      action.type === 'RESET_SCAN' ||
      action.type === 'START_FOLLOW_UP'
    ) {
      clearScanAnalysisWork(sessionIdentity);
      setSessionGeneration((current) => current + 1);
    }
    reducerDispatch(action);
  }, []);
  const draft: ScanDraftContextValue = {
    discardSavedDraft: async () => false,
    draftSavedAt: null,
    draftStatus: 'idle',
    finalizeSavedDraft: () => undefined,
    flushSavedDraft: async () => false,
    isOwnerCurrent: (owner) => owner === activeOwner,
    isSessionCurrent: (sourceUri, generation) =>
      stateRef.current.sourceUri === sourceUri && generationRef.current === generation,
    ownerIdentity: 'owner-a',
    sessionGeneration,
    sessionIdentity,
  };
  return (
    <ScanSessionContext.Provider value={{ state, dispatch }}>
      <ScanDraftContext.Provider value={draft}>
        {showProbe ? <Probe /> : null}
      </ScanDraftContext.Provider>
    </ScanSessionContext.Provider>
  );
}

async function mount(initial: ScanSessionState = initialScanSessionState) {
  activeOwner = 'owner-a';
  return render(<Harness initial={initial} />);
}

async function select(uri: string, sourceType: ScanSourceType = 'camera') {
  await act(async () => {
    latest.dispatch({
      type: 'SELECT_IMAGE',
      payload: { sourceUri: uri, sourceWidth: 1600, sourceHeight: 900, sourceType },
    });
  });
}

const guardController = (run: jest.Mock): Controller => ({
  state: 'loaded',
  error: null,
  errorKind: null,
  start: jest.fn(),
  retry: jest.fn(),
  run,
});

beforeEach(() => {
  mockManipulate.mockImplementation(async (uri, actions) => {
    const resize = ((actions ?? [])[0] as { resize: { width: number; height: number } }).resize;
    return {
      uri: String(uri).replace('.jpg', '-processed.jpg'),
      width: resize.width,
      height: resize.height,
      base64:
        resize.width === 224 && resize.height === 224
          ? fixturePng(resize.width, resize.height, String(uri).includes('dark'))
          : fixtureJpeg(resize.width, resize.height, String(uri).includes('dark')),
    } as Awaited<ReturnType<typeof manipulateAsync>>;
  });
  mockV2 = {
    state: 'loaded',
    model: undefined,
    error: null,
    errorKind: null,
    start: jest.fn(),
    retry: jest.fn(),
    run: jest.fn().mockImplementation(async () => v2Output()),
  };
  mockGuard = guardController(jest.fn().mockResolvedValue(guardOutput(0.95)));
});

afterEach(() => jest.restoreAllMocks());

const settled = () =>
  waitFor(() => expect(['completed', 'error']).toContain(latest.state.status));

describe('guarded scan: accepted photo', () => {
  // Proves: captured and uploaded photos both pass the guard gate, then V2 runs exactly once with its five labels incl. RSSI.
  it.each<ScanSourceType>(['camera', 'gallery'])(
    'runs the guard once then V2 once for a %s photo',
    async (sourceType) => {
      await mount();
      await select('file:///leaf.jpg', sourceType);
      await waitFor(() => expect(latest.state.status).toBe('completed'));

      expect(mockGuard.run).toHaveBeenCalledTimes(1);
      expect(mockV2.run).toHaveBeenCalledTimes(1);
      const guardInput = mockGuard.run.mock.calls[0][0][0] as ArrayBuffer;
      expect(guardInput.byteLength).toBe(GUARD_V1.inputByteLength);
      // The V2 letterbox tensor is its own buffer, never handed to the guard.
      expect(mockV2.run.mock.calls[0][0][0]).not.toBe(guardInput);

      const result = latest.state.result as DetectionResult;
      expect(result.scores.map((s) => s.label).sort()).toEqual([
        'healthy',
        'mosaic',
        'rssi',
        'rust',
        'smut',
      ]);
      expect(result.scores.find((s) => s.label === 'rssi')?.score).toBeCloseTo(0.2, 5);
      expect(result.predictedLabel).toBe('rust');
      expect(result.guardModelId).toBe('caneguard_guard_v1');
      expect(latest.analysis.isReady).toBe(true);
      // Guard preprocessing is isolated from the V2 manipulator path.
      expect(mockManipulate).not.toHaveBeenCalledWith(
        'file:///leaf.jpg',
        [{ resize: { width: 224, height: 224 } }],
        expect.anything(),
      );
    },
  );

  // Proves: the exact threshold value 0.75 is accepted end to end.
  it('accepts p_sugarcane of exactly 0.75', async () => {
    mockGuard = guardController(jest.fn().mockResolvedValue(guardOutput(0.75)));
    await mount();
    await select('file:///leaf.jpg');
    await waitFor(() => expect(latest.state.status).toBe('completed'));
    expect(mockV2.run).toHaveBeenCalledTimes(1);
  });
});

describe('guarded scan: rejection and faults produce no result', () => {
  // Proves: a rejected photo (p 0 or 0.749999) yields zero V2 invocations, no completed scan, and the retake message (photo rejection, not model error).
  it.each([[0], [0.749999]])('rejects p_sugarcane %p without running V2', async (p) => {
    mockGuard = guardController(jest.fn().mockResolvedValue(guardOutput(p)));
    await mount();
    await select('file:///table.jpg');
    await settled();

    expect(mockV2.run).not.toHaveBeenCalled();
    expect(latest.state.status).toBe('error');
    expect(latest.state.result).toBeNull();
    expect(latest.state.guardFailure).toBe('rejected');
    expect(latest.state.errorMessage).toBe(GUARD_COPY.rejectedStatus);
    expect(latest.analysis.checkState).toBe('not-sugarcane');
    expect(latest.analysis.guardRejected).toBe(true);
    expect(latest.analysis.isReady).toBe(false);
  });

  // Proves: every guard fault (NaN, infinities, out of range, wrong shape, runtime error) fails closed: zero V2, no result, and it reads as a model error, not a photo rejection.
  it.each<[string, () => Promise<unknown>]>([
    ['NaN', async () => guardOutput(NaN)],
    ['Infinity', async () => guardOutput(Infinity)],
    ['-Infinity', async () => guardOutput(-Infinity)],
    ['above 1', async () => guardOutput(1.2)],
    ['below 0', async () => guardOutput(-0.2)],
    ['wrong shape', async () => guardOutput(0.9, 0.1)],
    ['no output', async () => []],
    ['runtime error', async () => Promise.reject(new Error('delegate crashed'))],
    ['guard error', async () => Promise.reject(new GuardError('GUARD_RUN_FAILED', 'x'))],
  ])('fails closed on %s', async (_name, behaviour) => {
    mockGuard = guardController(jest.fn().mockImplementation(behaviour));
    await mount();
    await select('file:///leaf.jpg');
    await settled();

    expect(mockV2.run).not.toHaveBeenCalled();
    expect(latest.state.status).toBe('error');
    expect(latest.state.result).toBeNull();
    expect(latest.state.guardFailure).toBe('error');
    expect(latest.state.errorMessage).toBe(GUARD_COPY.failed);
    expect(latest.analysis.checkState).toBe('model-failed');
    expect(latest.analysis.guardRejected).toBe(false);
  });

  // Proves: a guard failure to prepare its tensor is a fault that never reaches V2.
  it('fails closed when the guard cannot prepare its tensor', async () => {
    jest
      .mocked(preprocessGuardImage)
      .mockRejectedValueOnce(new GuardError('GUARD_INPUT_INVALID', 'decoder failed'));
    await mount();
    await select('file:///leaf.jpg');
    await settled();
    expect(mockGuard.run).not.toHaveBeenCalled();
    expect(mockV2.run).not.toHaveBeenCalled();
    expect(latest.state.guardFailure).toBe('error');
  });

  // Proves: a guard that cannot be used (wrong artifact, bad contract, failed load) holds the scan: no silent unguarded V2.
  it.each(['integrity', 'contract', 'load'])('holds the scan when the guard is unusable (%s)', async (kind) => {
    mockGuard = {
      ...guardController(jest.fn()),
      state: 'error',
      error: new GuardError('GUARD_ARTIFACT_MISMATCH', 'wrong binary'),
      errorKind: kind,
    };
    await mount();
    await select('file:///leaf.jpg');
    await waitFor(() => expect(latest.analysis.checkState).toBe('model-failed'));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    expect(mockGuard.run).not.toHaveBeenCalled();
    expect(mockV2.run).not.toHaveBeenCalled();
    expect(latest.state.result).toBeNull();
    expect(latest.state.status).not.toBe('completed');
    expect(latest.analysis.guardError).toBe(GUARD_COPY.unavailable);
  });

  // Proves: the basic image-quality gate still runs first; a flagged photo reaches neither guard nor V2.
  it('keeps the quality gate ahead of the guard', async () => {
    await mount();
    await select('file:///dark.jpg');
    await waitFor(() => expect(latest.analysis.checkState).toBe('photo-rejected'));
    expect(mockGuard.run).not.toHaveBeenCalled();
    expect(mockV2.run).not.toHaveBeenCalled();
  });

  // Proves: retry distinguishes the two outcomes: a guard fault retries the same photo and can then complete; a rejection retries to the same verdict.
  it('retries a guard fault on the same photo and then completes', async () => {
    const run = jest
      .fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue(guardOutput(0.9));
    mockGuard = guardController(run);
    await mount();
    await select('file:///leaf.jpg');
    await waitFor(() => expect(latest.state.guardFailure).toBe('error'));
    expect(mockV2.run).not.toHaveBeenCalled();

    await act(async () => latest.dispatch({ type: 'CLEAR_ERROR' }));
    await waitFor(() => expect(latest.state.status).toBe('completed'));
    expect(run).toHaveBeenCalledTimes(2);
    expect(mockV2.run).toHaveBeenCalledTimes(1);
  });

  // Proves: a rejected photo is not silently re-run; only a new photo clears it, and the new photo is judged on its own.
  it('does not loop on a rejection and accepts a replacement photo', async () => {
    const run = jest
      .fn()
      .mockResolvedValueOnce(guardOutput(0.1))
      .mockResolvedValue(guardOutput(0.9));
    mockGuard = guardController(run);
    await mount();
    await select('file:///table.jpg');
    await waitFor(() => expect(latest.state.guardFailure).toBe('rejected'));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });
    expect(run).toHaveBeenCalledTimes(1);
    expect(mockV2.run).not.toHaveBeenCalled();

    await select('file:///cane.jpg');
    await waitFor(() => expect(latest.state.status).toBe('completed'));
    expect(latest.state.sourceUri).toBe('file:///cane.jpg');
    expect(latest.state.guardFailure).toBeNull();
    expect(run).toHaveBeenCalledTimes(2);
    expect(mockV2.run).toHaveBeenCalledTimes(1);
  });
});

describe('guarded scan: stale and duplicate protection', () => {
  // Proves: replacing the photo while the guard runs cannot commit the old photo's guard or disease result.
  it('drops a stale guard verdict when the photo is replaced', async () => {
    const first = deferred<ArrayBuffer[]>();
    const run = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(guardOutput(0.9));
    mockGuard = guardController(run);
    await mount();
    await select('file:///old.jpg');
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));

    await select('file:///new.jpg');
    await act(async () => {
      first.resolve(guardOutput(0.99));
    });
    await waitFor(() => expect(latest.state.status).toBe('completed'));

    expect(latest.state.sourceUri).toBe('file:///new.jpg');
    expect(run).toHaveBeenCalledTimes(2);
    // V2 ran for the replacement only; the old photo never reached it.
    expect(mockV2.run).toHaveBeenCalledTimes(1);
  });

  // Proves: a same-URI reselection still creates a new session generation.
  it('drops stale work when the same photo is selected again', async () => {
    const first = deferred<ArrayBuffer[]>();
    const run = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(guardOutput(0.9));
    mockGuard = guardController(run);
    await mount();
    await select('file:///same.jpg');
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));

    await select('file:///same.jpg');
    await act(async () => first.resolve(guardOutput(0.99)));
    await waitFor(() => expect(latest.state.status).toBe('completed'));

    expect(run).toHaveBeenCalledTimes(2);
    expect(mockV2.run).toHaveBeenCalledTimes(1);
  });

  // Proves: a stale guard rejection from the old photo cannot mark the new photo as an error.
  it('drops a stale rejection when the photo is replaced', async () => {
    const first = deferred<ArrayBuffer[]>();
    const run = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(guardOutput(0.9));
    mockGuard = guardController(run);
    await mount();
    await select('file:///old.jpg');
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    await select('file:///new.jpg');
    await act(async () => {
      first.resolve(guardOutput(0));
    });
    await waitFor(() => expect(latest.state.status).toBe('completed'));
    expect(latest.state.guardFailure).toBeNull();
  });

  // Proves: an owner change cannot commit a guard or disease result for the previous owner.
  it('does not commit a result after the owner changes', async () => {
    const pending = deferred<ArrayBuffer[]>();
    mockGuard = guardController(jest.fn().mockReturnValue(pending.promise));
    await mount();
    await select('file:///leaf.jpg');
    await waitFor(() => expect(mockGuard.run).toHaveBeenCalledTimes(1));

    activeOwner = 'owner-b'; // signed out / switched account
    await act(async () => {
      pending.resolve(guardOutput(0.99));
      await new Promise((r) => setTimeout(r, 250));
    });

    expect(mockV2.run).not.toHaveBeenCalled();
    expect(latest.state.result).toBeNull();
    expect(latest.state.status).not.toBe('completed');
  });

  // Proves: re-rendering while a guard run is pending never starts a duplicate guard or V2 inference.
  it('runs the guard and V2 once despite repeated renders', async () => {
    const pending = deferred<ArrayBuffer[]>();
    mockGuard = guardController(jest.fn().mockReturnValue(pending.promise));
    const view = await mount();
    await select('file:///leaf.jpg');
    await waitFor(() => expect(mockGuard.run).toHaveBeenCalledTimes(1));
    for (let i = 0; i < 4; i += 1) {
      await view.rerender(<Harness initial={initialScanSessionState} />);
    }
    await act(async () => {
      pending.resolve(guardOutput(0.9));
    });
    await waitFor(() => expect(latest.state.status).toBe('completed'));
    expect(mockGuard.run).toHaveBeenCalledTimes(1);
    expect(mockV2.run).toHaveBeenCalledTimes(1);
  });

  // Proves: a stale photo's pending native call is never overlapped by the next photo's call (exclusive native invocation), and only the current photo completes.
  it('does not invoke a queued native call after the current photo is discarded', async () => {
    const pendingV2 = deferred<ArrayBuffer[]>();
    mockGuard = guardController(jest.fn().mockResolvedValue(guardOutput(0.9)));
    mockV2 = {
      state: 'loaded',
      model: undefined,
      error: null,
      errorKind: null,
      start: jest.fn(),
      retry: jest.fn(),
      run: jest.fn().mockReturnValueOnce(pendingV2.promise),
    };
    await mount();
    await select('file:///old.jpg');
    await waitFor(() => expect(mockV2.run).toHaveBeenCalledTimes(1));

    await select('file:///new.jpg');
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 250));
    });
    expect(mockGuard.run).toHaveBeenCalledTimes(1);

    await act(async () => latest.dispatch({ type: 'RESET_SCAN' }));
    await act(async () => {
      pendingV2.resolve(v2Output());
    });
    await new Promise((resolve) => setTimeout(resolve, 250));
    expect(mockGuard.run).toHaveBeenCalledTimes(1);
    expect(mockV2.run).toHaveBeenCalledTimes(1);
  });

  it('does not overlap native guard calls across photos', async () => {
    const first = deferred<ArrayBuffer[]>();
    const run = jest
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(guardOutput(0.9));
    mockGuard = guardController(run);
    await mount();
    await select('file:///old.jpg');
    await waitFor(() => expect(run).toHaveBeenCalledTimes(1));
    await select('file:///new.jpg');
    await act(async () => {
      await new Promise((r) => setTimeout(r, 250));
    });
    expect(run).toHaveBeenCalledTimes(1); // the new photo waits for the pending call
    await act(async () => {
      first.resolve(guardOutput(0.99));
    });
    await waitFor(() => expect(latest.state.status).toBe('completed'));
    expect(run).toHaveBeenCalledTimes(2);
    expect(mockV2.run).toHaveBeenCalledTimes(1);
    expect(latest.state.sourceUri).toBe('file:///new.jpg');
  });

  // Proves: remounting while native work is pending does not repeat either model.
  it('keeps one accepted run across background transitions and a screen remount', async () => {
    const pending = deferred<ArrayBuffer[]>();
    mockGuard = guardController(jest.fn().mockReturnValue(pending.promise));
    const view = await mount();
    await select('file:///leaf.jpg');
    await waitFor(() => expect(mockGuard.run).toHaveBeenCalledTimes(1));

    await view.rerender(<Harness initial={initialScanSessionState} showProbe={false} />);
    await view.rerender(<Harness initial={initialScanSessionState} showProbe />);
    await act(async () => {
      pending.resolve(guardOutput(0.9));
    });

    await waitFor(() => expect(latest.state.status).toBe('completed'));
    expect(mockGuard.run).toHaveBeenCalledTimes(1);
    expect(mockV2.run).toHaveBeenCalledTimes(1);
  });
});
