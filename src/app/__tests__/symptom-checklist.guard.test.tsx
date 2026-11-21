import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useReducer } from 'react';

import SymptomChecklistScreen from '@/app/symptom-checklist';
import { GUARD_COPY, SCAN_CHECK_COPY } from '@/constants/copy';
import { clearScanAnalysisWork } from '@/features/detection/analysis/scanAnalysisWork';
import {
  ScanDraftContext,
  ScanSessionContext,
} from '@/features/detection/context/ScanSessionProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import { GuardError } from '@/features/detection/model/guardInference';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { useGuardModel } from '@/features/detection/model/useGuardModel';
import { preprocessGuardImage } from '@/features/detection/preprocessing/guardPreprocess';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import type { ScanSessionAction, ScanSessionState } from '@/features/detection/types';

jest.mock('@/features/detection/preprocessing/preprocessImage', () => ({
  preprocessImage: jest.fn(),
}));
jest.mock('@/features/detection/preprocessing/guardPreprocess', () => ({
  preprocessGuardImage: jest.fn(),
}));
jest.mock('@/features/detection/model/runInference', () => ({ runInference: jest.fn() }));
jest.mock('@/features/detection/model/useCaneGuardModel', () => ({
  useCaneGuardModel: jest.fn(),
}));
jest.mock('@/features/detection/model/useGuardModel', () => ({ useGuardModel: jest.fn() }));
jest.mock('@/features/detection/imagePicker/pickScanImage', () => ({
  getPermissionDeniedMessage: () => 'denied',
  pickScanImage: jest.fn(),
}));
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'field_reporter', uuid: 'guard-screen-user' } }),
}));
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY.en,
}));

const mockPreprocessImage = jest.mocked(preprocessImage);
const mockPreprocessGuard = jest.mocked(preprocessGuardImage);
const mockRunInference = jest.mocked(runInference);
const mockUseV2 = jest.mocked(useCaneGuardModel);
const mockUseGuard = jest.mocked(useGuardModel);
const mockRouterPush = router.push as jest.Mock;
const guardRun = jest.fn();

const mockDiscardSavedDraft = jest.fn(async () => true);
const mockFlushSavedDraft = jest.fn(async () => false);
const mockRouterDismissTo = router.dismissTo as jest.Mock;

const scanDraft = {
  discardSavedDraft: () => mockDiscardSavedDraft(),
  draftSavedAt: null,
  draftStatus: 'idle' as const,
  finalizeSavedDraft: () => undefined,
  flushSavedDraft: () => mockFlushSavedDraft(),
  isOwnerCurrent: () => true,
  isSessionCurrent: () => true,
  ownerIdentity: 'guard-screen-user',
  sessionGeneration: 0,
  sessionIdentity: 'guard-screen-session',
};

const selectedState: ScanSessionState = {
  ...initialScanSessionState,
  sourceUri: 'content://sugarcane/selected-leaf',
  sourceWidth: 1920,
  sourceHeight: 1080,
  sourceType: 'gallery',
  status: 'image-selected',
};

const guardController = (over: Record<string, unknown> = {}) =>
  ({
    state: 'loaded',
    error: null,
    errorKind: null,
    start: jest.fn(),
    retry: jest.fn(),
    run: guardRun,
    ...over,
  }) as unknown as ReturnType<typeof useGuardModel>;

async function renderScreen() {
  function Harness() {
    const [state, dispatch] = useReducer(
      (s: ScanSessionState, a: ScanSessionAction) => scanSessionReducer(s, a),
      selectedState,
    );
    return (
      <ScanSessionContext.Provider value={{ state, dispatch }}>
        <ScanDraftContext.Provider value={scanDraft}>
          <SymptomChecklistScreen />
        </ScanDraftContext.Provider>
      </ScanSessionContext.Provider>
    );
  }
  return render(<Harness />);
}

const out = (...v: number[]) => [Float32Array.from(v).buffer];

describe('SymptomChecklistScreen with required Guard V1', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Prepared-photo and in-flight work caches are module-scoped; every case here
    // reuses the same session identity and source URI, so a previous case would
    // otherwise short-circuit this case's photo work.
    clearScanAnalysisWork(scanDraft.sessionIdentity);
    mockPreprocessImage.mockResolvedValue({
      processedUri: 'file:///processed.jpg',
      inputBuffer: new ArrayBuffer(602_112),
      width: 224,
      height: 224,
      channels: 3,
      dataType: 'float32',
      minValue: 0,
      maxValue: 255,
      meanValue: 116,
      letterbox: { resizedWidth: 224, resizedHeight: 126, paddingLeft: 0, paddingTop: 49 },
      qualityAssessment: { warnings: [], meanLuminance: 118, luminanceStandardDeviation: 42 },
      preprocessMs: 4,
    });
    mockPreprocessGuard.mockResolvedValue(new ArrayBuffer(602_112));
    mockRunInference.mockResolvedValue({
      predictedLabel: 'rust',
      confidence: 0.8,
      scores: [
        { label: 'rust', score: 0.8 },
        { label: 'mosaic', score: 0.1 },
        { label: 'healthy', score: 0.05 },
        { label: 'smut', score: 0.03 },
        { label: 'rssi', score: 0.02 },
      ],
      timings: { preprocessMs: 4, inferenceMs: 3, totalMs: 7 },
      modelVersion: 'v2.0-mobilenetv2',
    });
    mockUseV2.mockReturnValue({
      start: jest.fn(),
      retry: jest.fn(),
      state: 'loaded',
      model: {} as never,
      run: jest.fn(),
      errorKind: null,
      error: null,
    });
    mockUseGuard.mockReturnValue(guardController());
  });

  // Proves: a not-sugarcane photo shows the retake message and retake actions, never the V2 model, a result or a way to continue.
  it('blocks a rejected photo with a retake message and no continue', async () => {
    guardRun.mockResolvedValue(out(0.1));
    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('scan.guard-rejected')).toBeOnTheScreen());
    expect(screen.getByText(GUARD_COPY.rejectedTitle)).toBeOnTheScreen();
    expect(screen.getAllByText(GUARD_COPY.rejectedStatus).length).toBeGreaterThan(0);
    expect(screen.getByTestId('scan.check-state')).toHaveProp('accessibilityValue', {
      text: 'not-sugarcane',
    });
    expect(screen.getByTestId('scan.retake-camera')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.retake-gallery')).toBeOnTheScreen();
    expect(screen.queryByTestId('scan.try-again')).not.toBeOnTheScreen();
    expect(screen.getByTestId('scan.continue-to-result')).toBeDisabled();
    await fireEvent.press(screen.getByTestId('scan.continue-to-result'));
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(mockRunInference).not.toHaveBeenCalled();
  });

  // Proves: Go to Home on a rejected scan discards the photo like Cancel, saves no draft, and leads home.
  it('discards the rejected scan and goes home from Go to Home', async () => {
    guardRun.mockResolvedValue(out(0.1));
    await renderScreen();
    await waitFor(() => expect(screen.getByTestId('scan.guard-rejected')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('scan.go-home'));

    await waitFor(() => expect(mockRouterDismissTo).toHaveBeenCalledWith('/home'));
    expect(mockDiscardSavedDraft).toHaveBeenCalledTimes(1);
    expect(mockFlushSavedDraft).not.toHaveBeenCalled();
  });

  // Proves: Cancel on a rejected scan asks to discard, offers no Keep draft, Keep scanning stays, Discard goes home.
  it('opens a Discard this scan dialog without Keep draft for a rejected photo', async () => {
    guardRun.mockResolvedValue(out(0.1));
    await renderScreen();
    await waitFor(() => expect(screen.getByTestId('scan.guard-rejected')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('symptom-checklist.cancel'));
    expect(screen.getByText(GUARD_COPY.discardTitle)).toBeOnTheScreen();
    expect(screen.getByText(GUARD_COPY.keepScanning)).toBeOnTheScreen();
    expect(screen.queryByText('Keep draft')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('symptom-checklist.cancel-dialog.cancel'));
    expect(mockDiscardSavedDraft).not.toHaveBeenCalled();
    expect(mockFlushSavedDraft).not.toHaveBeenCalled();
    expect(mockRouterDismissTo).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('symptom-checklist.header-close'));
    await fireEvent.press(screen.getByTestId('symptom-checklist.cancel-dialog.confirm'));
    await waitFor(() => expect(mockRouterDismissTo).toHaveBeenCalledWith('/home'));
    expect(mockDiscardSavedDraft).toHaveBeenCalledTimes(1);
  });

  // Proves: Go to Home is only offered for a guard rejection, not a quality warning.
  it('does not show Go to Home when the guard accepted the photo', async () => {
    guardRun.mockResolvedValue(out(0.9));
    await renderScreen();
    await waitFor(() => expect(mockRunInference).toHaveBeenCalled());
    expect(screen.queryByTestId('scan.go-home')).not.toBeOnTheScreen();
  });

  // Proves: a guard fault reads as a model error (not a photo rejection), offers Try again, and the retry can complete.
  it('shows a fault with Try again and recovers on retry', async () => {
    guardRun.mockResolvedValueOnce(out(NaN)).mockResolvedValue(out(0.9));
    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('scan.try-again')).toBeOnTheScreen());
    expect(screen.queryByTestId('scan.guard-rejected')).not.toBeOnTheScreen();
    expect(screen.getAllByText(GUARD_COPY.failed).length).toBeGreaterThan(0);
    expect(mockRunInference).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('scan.try-again'));
    await waitFor(() => expect(mockRunInference).toHaveBeenCalledTimes(1));
    await fireEvent.press(screen.getByTestId('scan.symptom-rust'));
    await waitFor(() => expect(screen.getByTestId('scan.continue-to-result')).toBeEnabled());
    expect(guardRun).toHaveBeenCalledTimes(2);
  });

  it('shows photo guidance without Guard setup recovery for a rejected photo', async () => {
    const retry = jest.fn();
    mockPreprocessImage.mockResolvedValueOnce({
      processedUri: 'file:///processed.jpg',
      inputBuffer: new ArrayBuffer(602_112),
      width: 224,
      height: 224,
      channels: 3,
      dataType: 'float32',
      minValue: 0,
      maxValue: 255,
      meanValue: 8,
      letterbox: { resizedWidth: 224, resizedHeight: 126, paddingLeft: 0, paddingTop: 49 },
      qualityAssessment: { warnings: ['too-dark'], meanLuminance: 8, luminanceStandardDeviation: 1 },
      preprocessMs: 4,
    });
    mockUseGuard.mockReturnValue(
      guardController({
        state: 'error',
        error: new GuardError('GUARD_MODEL_LOAD_FAILED', 'runtime unavailable'),
        errorKind: 'load',
        retry,
      }),
    );
    await renderScreen();

    await waitFor(() =>
      expect(screen.getByTestId('scan.check-state')).toHaveProp('accessibilityValue', {
        text: 'photo-rejected',
      }),
    );
    expect(screen.getByText(SCAN_CHECK_COPY.notAnalysed)).toBeOnTheScreen();
    expect(screen.queryByText(GUARD_COPY.unavailable)).not.toBeOnTheScreen();
    expect(screen.queryByTestId('scan.retry-guard')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('scan.try-again')).not.toBeOnTheScreen();
    expect(screen.getByTestId('scan.retake-camera')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.retake-gallery')).toBeOnTheScreen();
    expect(retry).not.toHaveBeenCalled();
    expect(mockRunInference).not.toHaveBeenCalled();
  });

  it('offers retry when the native Guard loader fails', async () => {
    const retry = jest.fn();
    mockUseGuard.mockReturnValue(
      guardController({
        state: 'error',
        error: new GuardError('GUARD_MODEL_LOAD_FAILED', 'runtime unavailable'),
        errorKind: 'load',
        retry,
      }),
    );
    await renderScreen();

    await waitFor(() => expect(screen.getByTestId('scan.retry-guard')).toBeOnTheScreen());
    expect(screen.getByText(GUARD_COPY.failed)).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('scan.retry-guard'));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(mockRunInference).not.toHaveBeenCalled();
  });

  // Proves: an unusable guard (wrong artifact) holds the scan with an explicit message; V2 and the guard never run.
  it('holds the scan when the guard artifact is refused', async () => {
    mockUseGuard.mockReturnValue(
      guardController({
        state: 'error',
        error: new GuardError('GUARD_ARTIFACT_MISMATCH', 'wrong binary'),
        errorKind: 'integrity',
      }),
    );
    await renderScreen();

    await waitFor(() =>
      expect(screen.getAllByText(GUARD_COPY.unavailable).length).toBeGreaterThan(0),
    );
    await waitFor(() => expect(mockPreprocessImage).toHaveBeenCalled());
    expect(guardRun).not.toHaveBeenCalled();
    expect(mockRunInference).not.toHaveBeenCalled();
    expect(screen.getByTestId('scan.continue-to-result')).toBeDisabled();
    expect(screen.queryByTestId('scan.retry-guard')).not.toBeOnTheScreen();
  });
});
