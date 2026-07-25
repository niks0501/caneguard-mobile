import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import SymptomChecklistScreen from '@/app/symptom-checklist';
import { CHECKLIST_OBSERVATIONS } from '@/features/detection/checklist/checklistConsistency';
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

async function renderChecklist(state: ScanSessionState = completedState) {
  return render(
    <ScanSessionContext.Provider value={{ state, dispatch: mockDispatch }}>
      <SymptomChecklistScreen />
    </ScanSessionContext.Provider>,
  );
}

describe('SymptomChecklistScreen', () => {
  it('shows only Model v0-aligned observations and truthful severity wording', async () => {
    await renderChecklist();

    for (const observation of CHECKLIST_OBSERVATIONS) {
      expect(screen.getByText(observation.label)).toBeOnTheScreen();
    }

    expect(screen.getByText('Reported severity (optional)')).toBeOnTheScreen();
    expect(
      screen.getByText('This is your observation, not a model-estimated severity.'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('Black whip-like growth')).not.toBeOnTheScreen();
    expect(screen.queryByText('Drying young shoot')).not.toBeOnTheScreen();
  });

  it('stores observations and optional reported severity in the scan session', async () => {
    await renderChecklist();

    await fireEvent.press(
      screen.getByText('Mosaic-like irregular discoloration or mottling'),
    );
    await fireEvent.press(screen.getByLabelText('Reported severity: Mild'));
    await fireEvent.press(screen.getByLabelText('Continue to analysis result'));

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'SET_SYMPTOMS',
      payload: ['mosaic'],
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'SET_REPORTED_SEVERITY',
      payload: 'Mild',
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/analysis-result');
  });

  it('allows continuing without checklist information or severity', async () => {
    await renderChecklist();

    await fireEvent.press(screen.getByLabelText('Continue to analysis result'));

    expect(mockDispatch).toHaveBeenNthCalledWith(1, {
      type: 'SET_SYMPTOMS',
      payload: [],
    });
    expect(mockDispatch).toHaveBeenNthCalledWith(2, {
      type: 'SET_REPORTED_SEVERITY',
      payload: null,
    });
    expect(mockRouterPush).toHaveBeenCalledWith('/analysis-result');
  });

  it('keeps unable-to-tell and no-visible-symptom mutually exclusive', async () => {
    await renderChecklist();

    await fireEvent.press(
      screen.getByText('Mosaic-like irregular discoloration or mottling'),
    );
    await fireEvent.press(
      screen.getByText('Unable to tell from the image or plant'),
    );
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
