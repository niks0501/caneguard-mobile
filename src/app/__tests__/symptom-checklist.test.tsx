import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import { useReducer } from 'react';

import SymptomChecklistScreen from '@/app/symptom-checklist';
import {
  CHECKLIST_OBSERVATIONS,
  GUIDED_VALIDATION_QUESTIONS,
} from '@/features/detection/checklist/checklistConsistency';
import { FARMER_COPY } from '@/constants/copy';
import { ScanSessionContext } from '@/features/detection/context/ScanSessionProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import { InferenceError } from '@/features/detection/model/inferenceErrors';
import { runInference } from '@/features/detection/model/runInference';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { pickScanImage } from '@/features/detection/imagePicker/pickScanImage';
import { PreprocessingError } from '@/features/detection/preprocessing/preprocessingErrors';
import { preprocessImage } from '@/features/detection/preprocessing/preprocessImage';
import type {
  ScanSessionAction,
  ScanSessionState,
} from '@/features/detection/types';

jest.mock('@/features/detection/preprocessing/preprocessImage', () => ({
  preprocessImage: jest.fn(),
}));

jest.mock('@/features/detection/model/runInference', () => ({
  runInference: jest.fn(),
}));

jest.mock('@/features/detection/model/useCaneGuardModel', () => ({
  useCaneGuardModel: jest.fn(),
}));

jest.mock('@/features/detection/imagePicker/pickScanImage', () => ({
  getPermissionDeniedMessage: (canAskAgain: boolean) =>
    canAskAgain
      ? 'Camera access is needed to take a sugarcane photo. You can try the camera again.'
      : 'Camera access is turned off. Open device settings to allow CaneGuard to use the camera.',
  pickScanImage: jest.fn(),
}));

let mockRole: 'farmer' | 'field_reporter' = 'field_reporter';
let mockLanguage: 'en' | 'tl' = 'en';

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: mockRole, uuid: 'scan-check-test-user' } }),
}));
jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY[mockLanguage],
}));

const mockDispatch = jest.fn<void, [ScanSessionAction]>();
const mockRouterDismissTo = router.dismissTo as jest.Mock;
const mockRouterPush = router.push as jest.Mock;
const mockPreprocessImage = preprocessImage as jest.MockedFunction<typeof preprocessImage>;
const mockRunInference = runInference as jest.MockedFunction<typeof runInference>;
const mockUseCaneGuardModel = jest.mocked(useCaneGuardModel);
const mockPickScanImage = jest.mocked(pickScanImage);
const mockModelRun = jest.fn<Promise<ArrayBuffer[]>, [ArrayBuffer[]]>();
const successfulPreprocessingResult = {
  processedUri: 'file:///processed.jpg',
  inputBuffer: new ArrayBuffer(602_112),
  width: 224,
  height: 224,
  channels: 3,
  dataType: 'float32' as const,
  minValue: 0,
  maxValue: 255,
  meanValue: 116,
  letterbox: {
    resizedWidth: 224,
    resizedHeight: 126,
    paddingLeft: 0,
    paddingTop: 49,
  },
  qualityAssessment: {
    warnings: [],
    meanLuminance: 118,
    luminanceStandardDeviation: 42,
  },
  preprocessMs: 42,
};
const successfulInferenceResult = {
  predictedLabel: 'rust' as const,
  confidence: 0.8,
  scores: [
    { label: 'rust' as const, score: 0.8 },
    { label: 'mosaic' as const, score: 0.15 },
    { label: 'healthy' as const, score: 0.05 },
    { label: 'smut' as const, score: 0 },
  ],
  timings: {
    preprocessMs: 42,
    inferenceMs: 18,
    totalMs: 60,
  },
  modelVersion: 'v1.0-mobilenetv2',
};

const selectedState: ScanSessionState = {
  ...initialScanSessionState,
  sourceUri: 'content://sugarcane/selected-leaf',
  sourceWidth: 1920,
  sourceHeight: 1080,
  sourceType: 'gallery',
  status: 'image-selected',
};

async function renderScreen(initialState: ScanSessionState) {
  function Harness() {
    const [state, dispatch] = useReducer(
      (current: ScanSessionState, action: ScanSessionAction) => {
        mockDispatch(action);
        return scanSessionReducer(current, action);
      },
      initialState,
    );

    return (
      <ScanSessionContext.Provider value={{ state, dispatch }}>
        <SymptomChecklistScreen />
      </ScanSessionContext.Provider>
    );
  }

  return render(<Harness />);
}

const loadedModel = () => ({
  start: jest.fn(),
  retry: jest.fn(),
  state: 'loaded' as const,
  model: {} as never,
  run: mockModelRun,
  errorKind: null,
  error: null,
});

describe('SymptomChecklistScreen (photo check and picture grid)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRole = 'field_reporter';
    mockLanguage = 'en';
    mockPreprocessImage.mockResolvedValue(successfulPreprocessingResult);
    mockRunInference.mockResolvedValue(successfulInferenceResult);
    mockUseCaneGuardModel.mockReturnValue(loadedModel());
  });

  it('starts the photo check by itself and shows the picture grid, without a Preview step', async () => {
    await renderScreen(selectedState);

    expect(screen.getByTestId('scan.symptom-checklist-screen')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Analyze selected image')).not.toBeOnTheScreen();
    await waitFor(() => {
      expect(mockPreprocessImage).toHaveBeenCalledTimes(1);
    });
    expect(mockPreprocessImage).toHaveBeenCalledWith('content://sugarcane/selected-leaf', {
      width: 1920,
      height: 1080,
    });
    await waitFor(() => {
      expect(mockRunInference).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'COMPLETE_INFERENCE',
        payload: successfulInferenceResult,
      });
    });

    expect(screen.getByTestId('scan.guided-question')).toHaveTextContent(
      'Which picture looks most like what you see?',
    );
    for (const observation of CHECKLIST_OBSERVATIONS) {
      expect(screen.getByLabelText(observation.label)).toBeOnTheScreen();
    }
    expect(GUIDED_VALIDATION_QUESTIONS[0].options).toHaveLength(7);
    // Retake is offered only when the photo fails the check.
    expect(screen.queryByTestId('scan.photo-failed-check')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('scan.retake-camera')).not.toBeOnTheScreen();
    expect(screen.queryByText('Source')).not.toBeOnTheScreen();
  });

  it('checks the photo while the model loads and runs inference when it is ready', async () => {
    mockUseCaneGuardModel.mockReturnValue({ ...loadedModel(), state: 'loading' as const });
    await renderScreen(selectedState);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'COMPLETE_PREPROCESSING' }));
    });
    expect(mockPreprocessImage).toHaveBeenCalledTimes(1);
    expect(mockRunInference).not.toHaveBeenCalled();
    expect(screen.getByTestId('scan.continue-to-result')).toBeDisabled();

    mockUseCaneGuardModel.mockReturnValue(loadedModel());
    await fireEvent.press(screen.getByTestId('scan.symptom-rust'));
    await waitFor(() => {
      expect(mockRunInference).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'COMPLETE_INFERENCE' }));
    });
    expect(mockPreprocessImage).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('scan.continue-to-result')).toBeEnabled();
  });

  it('keeps Continue off until the check finishes and one picture is chosen, then stores the answer separately', async () => {
    await renderScreen(selectedState);
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'COMPLETE_INFERENCE' }),
      );
    });

    expect(screen.getByTestId('scan.continue-to-result')).toBeDisabled();
    expect(screen.getByText('Choose a picture')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('scan.symptom-mosaic'));
    expect(screen.getByTestId('scan.symptom-mosaic')).toHaveProp('accessibilityState', {
      selected: true,
    });
    await fireEvent.press(screen.getByLabelText('Continue to analysis result'));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SYMPTOMS', payload: ['mosaic'] });
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_REPORTED_SEVERITY' }),
    );
    expect(mockRouterPush).toHaveBeenCalledWith('/analysis-result');
  });

  it('keeps answers single-choice, including the fallback answers', async () => {
    await renderScreen(selectedState);
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'COMPLETE_INFERENCE' }),
      );
    });

    await fireEvent.press(screen.getByTestId('scan.symptom-mosaic'));
    await fireEvent.press(screen.getByTestId('scan.symptom-something-else'));
    await fireEvent.press(screen.getByLabelText('Continue to analysis result'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SYMPTOMS',
      payload: ['something-else'],
    });
  });

  it('shows a text tile for Yellow midrib, which has no reference photo yet', async () => {
    await renderScreen(selectedState);

    expect(screen.getByText('Yellow midrib')).toBeOnTheScreen();
    expect(screen.getByText('No photo yet')).toBeOnTheScreen();
  });

  it('offers a retake only when the photo fails the check, and a new photo restarts the check', async () => {
    mockPreprocessImage.mockResolvedValueOnce({
      ...successfulPreprocessingResult,
      qualityAssessment: {
        warnings: ['too-dark'],
        meanLuminance: 10,
        luminanceStandardDeviation: 40,
      },
    });
    mockPickScanImage.mockResolvedValueOnce({
      kind: 'selected',
      image: {
        sourceUri: 'content://sugarcane/second-leaf',
        sourceWidth: 1920,
        sourceHeight: 1080,
        sourceType: 'camera',
      },
    });
    await renderScreen(selectedState);

    await waitFor(() => {
      expect(screen.getByTestId('scan.photo-failed-check')).toBeOnTheScreen();
    });
    expect(
      screen.getByText(
        'The image may be too dark. Retake the photo in better lighting for a more reliable input.',
      ),
    ).toBeOnTheScreen();

    await waitFor(() => {
      expect(screen.getByTestId('scan.retake-camera')).toBeEnabled();
    });
    await fireEvent.press(screen.getByTestId('scan.retake-camera'));

    await waitFor(() => {
      expect(mockPreprocessImage).toHaveBeenCalledTimes(2);
    });
    expect(mockPreprocessImage).toHaveBeenLastCalledWith('content://sugarcane/second-leaf', {
      width: 1920,
      height: 1080,
    });
    await waitFor(() => {
      expect(screen.queryByTestId('scan.photo-failed-check')).not.toBeOnTheScreen();
    });
  });

  it('checks a replacement photo while the model is still loading', async () => {
    mockUseCaneGuardModel.mockReturnValue({ ...loadedModel(), state: 'loading' as const });
    mockPreprocessImage.mockResolvedValueOnce({
      ...successfulPreprocessingResult,
      qualityAssessment: { warnings: ['too-dark'], meanLuminance: 10, luminanceStandardDeviation: 40 },
    });
    mockPickScanImage.mockResolvedValueOnce({
      kind: 'selected',
      image: {
        sourceUri: 'content://sugarcane/selected-leaf',
        sourceWidth: 1920,
        sourceHeight: 1080,
        sourceType: 'gallery',
      },
    });
    await renderScreen(selectedState);

    await waitFor(() => expect(screen.getByTestId('scan.retake-gallery')).toBeEnabled());
    await fireEvent.press(screen.getByTestId('scan.retake-gallery'));
    await waitFor(() => {
      expect(mockPreprocessImage).toHaveBeenCalledTimes(2);
      expect(screen.queryByTestId('scan.photo-failed-check')).not.toBeOnTheScreen();
    });
    expect(mockRunInference).not.toHaveBeenCalled();
  });

  it('waits for an open replacement picker before starting inference', async () => {
    mockUseCaneGuardModel.mockReturnValue({ ...loadedModel(), state: 'loading' as const });
    mockPreprocessImage.mockResolvedValueOnce({
      ...successfulPreprocessingResult,
      qualityAssessment: { warnings: ['too-dark'], meanLuminance: 10, luminanceStandardDeviation: 40 },
    });
    let cancelPicker!: (value: Awaited<ReturnType<typeof pickScanImage>>) => void;
    mockPickScanImage.mockReturnValueOnce(new Promise((resolve) => { cancelPicker = resolve; }));
    await renderScreen(selectedState);

    await waitFor(() => expect(screen.getByTestId('scan.retake-camera')).toBeEnabled());
    await fireEvent.press(screen.getByTestId('scan.retake-camera'));
    mockUseCaneGuardModel.mockReturnValue(loadedModel());
    await fireEvent.press(screen.getByTestId('scan.symptom-rust'));
    expect(mockRunInference).not.toHaveBeenCalled();
    cancelPicker({ kind: 'canceled' });
    await waitFor(() => expect(mockRunInference).toHaveBeenCalledTimes(1));
  });

  it('shows a recoverable preprocessing failure and checks again on request', async () => {
    mockPreprocessImage.mockRejectedValueOnce(
      new PreprocessingError('jpeg-decode-failed', 'decode failed'),
    );
    await renderScreen(selectedState);

    await waitFor(() => {
      expect(
        screen.getAllByText(
          'The resized image could not be decoded correctly. Please replace it and try again.',
        ).length,
      ).toBeGreaterThan(0);
    });
    expect(mockRouterPush).not.toHaveBeenCalled();
    expect(screen.getByTestId('scan.retake-camera')).toBeEnabled();
    expect(screen.getByTestId('scan.retake-gallery')).toBeEnabled();

    await fireEvent.press(screen.getByTestId('scan.try-again'));
    await waitFor(() => {
      expect(mockPreprocessImage).toHaveBeenCalledTimes(2);
      expect(screen.queryByTestId('scan.photo-failed-check')).not.toBeOnTheScreen();
    });
  });

  it('shows a recoverable inference failure', async () => {
    mockRunInference.mockRejectedValueOnce(
      new InferenceError('MODEL_RUN_FAILED', 'native failure'),
    );
    await renderScreen(selectedState);

    await waitFor(() => {
      expect(
        screen.getAllByText('The on-device analysis could not finish. Please try again.').length,
      ).toBeGreaterThan(0);
    });
    expect(screen.getByTestId('scan.continue-to-result')).toBeDisabled();
    expect(screen.queryByTestId('scan.retake-camera')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('scan.retake-gallery')).not.toBeOnTheScreen();
  });

  it('offers an in-app retry after a recoverable model-load failure', async () => {
    const retry = jest.fn();
    mockUseCaneGuardModel.mockReturnValue({
      error: new InferenceError('MODEL_LOAD_FAILED', 'The native runtime could not load.'),
      errorKind: 'load',
      model: undefined,
      retry,
      run: mockModelRun,
      start: jest.fn(),
      state: 'error',
    } as unknown as ReturnType<typeof useCaneGuardModel>);
    await renderScreen(selectedState);

    await fireEvent.press(screen.getByLabelText('Retry analysis setup'));
    expect(retry).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockPreprocessImage).toHaveBeenCalledTimes(1));
    expect(mockRunInference).not.toHaveBeenCalled();
  });

  it('lets a restored completed scan answer and continue without re-running the check', async () => {
    await renderScreen({
      ...selectedState,
      result: successfulInferenceResult,
      status: 'completed',
    });

    await fireEvent.press(screen.getByTestId('scan.symptom-rust'));
    await fireEvent.press(screen.getByLabelText('Continue to analysis result'));

    expect(mockPreprocessImage).not.toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_SYMPTOMS', payload: ['rust'] });
    expect(mockRouterPush).toHaveBeenCalledWith('/analysis-result');
  });

  it('never shows sync wording on the scan check', async () => {
    await renderScreen(selectedState);

    expect(screen.queryByText(/not sent|not synced|sync/i)).not.toBeOnTheScreen();
  });

  it('keeps the reviewed Tagalog wording for a farmer on the cancel dialog and replace actions', async () => {
    mockRole = 'farmer';
    mockLanguage = 'tl';
    mockPreprocessImage.mockResolvedValueOnce({
      ...successfulPreprocessingResult,
      qualityAssessment: { warnings: ['too-dark'], meanLuminance: 10, luminanceStandardDeviation: 40 },
    });
    await renderScreen(selectedState);

    await waitFor(() => {
      expect(screen.getByTestId('scan.photo-failed-check')).toBeOnTheScreen();
    });
    expect(screen.getByText('Kumuha ng ibang litrato')).toBeOnTheScreen();
    expect(screen.getByText('Pumili ng ibang larawan')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('symptom-checklist.cancel'));
    expect(screen.getByText(FARMER_COPY.tl.imagePreview.cancelTitle)).toBeOnTheScreen();
    expect(screen.getByText(FARMER_COPY.tl.imagePreview.keepDraft)).toBeOnTheScreen();
  });

  it('shows a recovery action when there is no photo', async () => {
    await renderScreen(initialScanSessionState);

    expect(screen.getByText('No photo selected')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Return to scan'));

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    expect(mockRouterDismissTo).toHaveBeenCalledWith('/scan');
  });

  describe('cancel and return home', () => {
    it('opens the cancel dialog from the header close and the Cancel button', async () => {
      await renderScreen(selectedState);

      expect(screen.queryByTestId('symptom-checklist.cancel-dialog')).not.toBeOnTheScreen();
      await fireEvent.press(screen.getByTestId('symptom-checklist.header-close'));
      expect(screen.getByTestId('symptom-checklist.cancel-dialog')).toBeOnTheScreen();
      expect(screen.getByText('Keep draft')).toBeOnTheScreen();
      expect(screen.getByText('Discard draft')).toBeOnTheScreen();
    });

    it('routes home and keeps the session when Keep draft is chosen', async () => {
      await renderScreen(selectedState);

      await fireEvent.press(screen.getByTestId('symptom-checklist.cancel'));
      await fireEvent.press(screen.getByTestId('symptom-checklist.cancel-dialog.cancel'));

      await waitFor(() => {
        expect(mockRouterDismissTo).toHaveBeenCalledWith('/home');
      });
      expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    });

    it('resets the scan and routes home when Discard draft is chosen', async () => {
      await renderScreen(selectedState);

      await fireEvent.press(screen.getByTestId('symptom-checklist.cancel'));
      await fireEvent.press(screen.getByTestId('symptom-checklist.cancel-dialog.confirm'));

      await waitFor(() => {
        expect(mockRouterDismissTo).toHaveBeenCalledWith('/home');
      });
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    });
  });
});
