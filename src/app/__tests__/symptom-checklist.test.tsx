import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import SymptomChecklistScreen from '@/app/symptom-checklist';
import {
  CHECKLIST_OBSERVATIONS,
  GUIDED_VALIDATION_QUESTIONS,
} from '@/features/detection/checklist/checklistConsistency';
import { ScanSessionContext } from '@/features/detection/context/ScanSessionProvider';
import {
  initialScanSessionState,
} from '@/features/detection/context/scanSessionReducer';
import type {
  DetectionResult,
  ScanSessionAction,
  ScanSessionState,
} from '@/features/detection/types';

const mockDispatch = jest.fn<void, [ScanSessionAction]>();
const mockRouterPush = router.push as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;

const completedResult: DetectionResult = {
  predictedLabel: 'mosaic',
  confidence: 0.78,
  scores: [
    { label: 'healthy', score: 0.08 },
    { label: 'mosaic', score: 0.78 },
    { label: 'rust', score: 0.14 },
  ],
  timings: {
    preprocessMs: 40,
    inferenceMs: 20,
    totalMs: 60,
  },
  modelVersion: 'v0.1-baseline',
};

const completedState: ScanSessionState = {
  ...initialScanSessionState,
  sourceUri: 'file:///leaf.jpg',
  sourceType: 'gallery',
  status: 'completed',
  result: completedResult,
};

const smutState: ScanSessionState = {
  ...completedState,
  result: {
    ...completedResult,
    predictedLabel: 'smut',
    scores: [
      { label: 'healthy', score: 0.01 },
      { label: 'mosaic', score: 0.01 },
      { label: 'rust', score: 0.01 },
      { label: 'smut', score: 0.97 },
    ],
    modelVersion: 'v1.0-mobilenetv2',
  },
};

async function renderChecklist(state: ScanSessionState = completedState) {
  return render(
    <ScanSessionContext.Provider value={{ state, dispatch: mockDispatch }}>
      <SymptomChecklistScreen />
    </ScanSessionContext.Provider>,
  );
}

describe('SymptomChecklistScreen', () => {
  it('shows a short data-driven neutral differential with fallback answers', async () => {
    await renderChecklist();

    expect(screen.getByTestId('scan.symptom-checklist-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.guided-progress')).toHaveTextContent(
      'Observation 1 of 1',
    );
    expect(screen.getByTestId('scan.guided-question')).toHaveTextContent(
      'What visible pattern, if any, best describes the area you are checking?',
    );
    expect(screen.getByTestId('scan.symptom-rust')).toHaveProp(
      'accessibilityState',
      { selected: false },
    );
    expect(screen.getByTestId('scan.continue-to-result')).toBeOnTheScreen();
    for (const observation of CHECKLIST_OBSERVATIONS) {
      expect(screen.getByText(observation.label)).toBeOnTheScreen();
    }
    expect(GUIDED_VALIDATION_QUESTIONS[0].options).toHaveLength(6);
    expect(screen.getByText('Something else')).toBeOnTheScreen();
    expect(screen.getByText('Unable to tell')).toBeOnTheScreen();
    expect(screen.queryByText('Reported severity (optional)')).not.toBeOnTheScreen();
    expect(screen.queryByText('Mild')).not.toBeOnTheScreen();
    expect(screen.queryByText('Moderate')).not.toBeOnTheScreen();
    expect(screen.queryByText('Severe')).not.toBeOnTheScreen();
    expect(screen.queryByText('Black whip-like growth')).not.toBeOnTheScreen();
    expect(screen.queryByText('Drying young shoot')).not.toBeOnTheScreen();
  });

  it('bypasses the Model V0 checklist for a Model V1 smut result', async () => {
    await renderChecklist(smutState);

    expect(screen.getByText(/Guided observations are unavailable/)).toBeOnTheScreen();
    expect(screen.getByLabelText('Continue to analysis result')).not.toBeDisabled();

    await fireEvent.press(screen.getByLabelText('Continue to analysis result'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SYMPTOMS',
      payload: [],
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/analysis-result');
  });

  it('stores the selected observation without changing model evidence or severity', async () => {
    await renderChecklist();

    await fireEvent.press(
      screen.getByText(
        'Contrasting islands or streaks of normal green among paler green or yellowish leaf areas',
      ),
    );
    await fireEvent.press(screen.getByLabelText('Continue to analysis result'));

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SYMPTOMS',
      payload: ['mosaic'],
    });
    expect(mockDispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'SET_REPORTED_SEVERITY' }),
    );
    expect(mockRouterPush).toHaveBeenCalledWith('/analysis-result');
  });

  it('requires one guided observation before continuing', async () => {
    await renderChecklist();

    expect(screen.getByTestId('scan.continue-to-result')).toBeDisabled();
    expect(screen.getByText('Choose an observation')).toBeOnTheScreen();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it('keeps fallback answers mutually exclusive from supported patterns', async () => {
    await renderChecklist();

    await fireEvent.press(
      screen.getByText(
        'Contrasting islands or streaks of normal green among paler green or yellowish leaf areas',
      ),
    );
    await fireEvent.press(screen.getByText('Something else'));
    await fireEvent.press(screen.getByLabelText('Continue to analysis result'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SYMPTOMS',
      payload: ['something-else'],
    });
  });

  it('preserves Unable to tell as an independent answer', async () => {
    await renderChecklist();

    await fireEvent.press(screen.getByText('Unable to tell'));
    await fireEvent.press(screen.getByLabelText('Continue to analysis result'));

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SET_SYMPTOMS',
      payload: ['unable-to-tell'],
    });
  });

  it('shows a recovery action when inference is incomplete', async () => {
    await renderChecklist(initialScanSessionState);

    expect(screen.getByText('No completed scan')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Return to scan'));

    expect(mockRouterReplace).toHaveBeenCalledWith('/scan');
  });
});
