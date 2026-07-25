import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import AnalysisResultScreen from '@/app/analysis-result';
import type {
  ChecklistConsistency,
  ChecklistObservationId,
} from '@/features/detection/checklist/checklistConsistency';
import type { ModelLabel } from '@/features/detection/constants/modelContract';
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
const mockRouterBack = router.back as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;

const STATUS_TITLES: Record<ChecklistConsistency, string> = {
  consistent: 'Checklist consistent',
  inconsistent: 'Checklist inconsistent',
  'not-applicable': 'Checklist cannot be compared',
  'not-enough-information': 'Not enough checklist information',
};

type MatrixCase = [
  ModelLabel,
  ChecklistConsistency,
  ChecklistObservationId[],
];

const MATRIX: MatrixCase[] = [
  ['healthy', 'consistent', ['none']],
  ['healthy', 'inconsistent', ['mosaic']],
  ['healthy', 'not-applicable', ['mosaic', 'rust']],
  ['healthy', 'not-enough-information', []],
  ['mosaic', 'consistent', ['mosaic']],
  ['mosaic', 'inconsistent', ['rust']],
  ['mosaic', 'not-applicable', ['mosaic', 'rust']],
  ['mosaic', 'not-enough-information', []],
  ['rust', 'consistent', ['rust']],
  ['rust', 'inconsistent', ['mosaic']],
  ['rust', 'not-applicable', ['mosaic', 'rust']],
  ['rust', 'not-enough-information', []],
];

function createResult(
  predictedLabel: ModelLabel,
  confidence = 0.78,
): DetectionResult {
  return {
    predictedLabel,
    confidence,
    scores: [
      { label: 'healthy', score: predictedLabel === 'healthy' ? confidence : 0.08 },
      { label: 'mosaic', score: predictedLabel === 'mosaic' ? confidence : 0.14 },
      { label: 'rust', score: predictedLabel === 'rust' ? confidence : 0.08 },
    ],
    timings: {
      preprocessMs: 40,
      inferenceMs: 20,
      totalMs: 60,
    },
    modelVersion: 'v0.1-baseline',
  };
}

function createCompletedState(
  predictedLabel: ModelLabel,
  selectedSymptoms: ChecklistObservationId[],
  overrides: Partial<ScanSessionState> = {},
): ScanSessionState {
  return {
    ...initialScanSessionState,
    sourceUri: 'file:///result-leaf.jpg',
    sourceType: 'gallery',
    status: 'completed',
    result: createResult(predictedLabel),
    selectedSymptoms,
    ...overrides,
  };
}

async function renderResult(state: ScanSessionState) {
  return render(
    <ScanSessionContext.Provider value={{ state, dispatch: mockDispatch }}>
      <AnalysisResultScreen />
    </ScanSessionContext.Provider>,
  );
}

describe('AnalysisResultScreen', () => {
  it.each(MATRIX)(
    'renders the %s result with %s checklist status',
    async (predictedLabel, expectedStatus, selectedSymptoms) => {
      await renderResult(createCompletedState(predictedLabel, selectedSymptoms));

      expect(screen.getByText(STATUS_TITLES[expectedStatus])).toBeOnTheScreen();
      expect(
        screen.getByText(
          predictedLabel === 'healthy'
            ? 'No supported disease detected'
            : `Possible result: ${predictedLabel === 'mosaic' ? 'Mosaic' : 'Rust'}`,
        ),
      ).toBeOnTheScreen();
    },
  );

  it('renders the selected image, raw model scores, metadata, and user severity', async () => {
    const result = createResult('rust');
    const state = createCompletedState('rust', ['rust'], {
      result,
      reportedSeverity: 'Moderate',
    });

    await renderResult(state);

    expect(
      screen.getByLabelText('Selected sugarcane image used for analysis'),
    ).toHaveProp('source', { uri: 'file:///result-leaf.jpg' });
    expect(screen.getByText('Possible result: Rust')).toBeOnTheScreen();
    expect(screen.getByLabelText('AI confidence 78%')).toBeOnTheScreen();
    expect(screen.getByLabelText('Healthy score 8%')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mosaic score 14%')).toBeOnTheScreen();
    expect(screen.getByLabelText('Rust score 78%')).toBeOnTheScreen();
    expect(screen.getByText('Reported severity')).toBeOnTheScreen();
    expect(screen.getByText('Moderate')).toBeOnTheScreen();
    expect(screen.getByText('v0.1-baseline')).toBeOnTheScreen();
    expect(screen.getByText('60 ms')).toBeOnTheScreen();
    expect(result.confidence).toBe(0.78);
    expect(screen.queryByText('Downy Mildew')).not.toBeOnTheScreen();
  });

  it('labels the uncalibrated low-score caution as a prototype rule', async () => {
    await renderResult(
      createCompletedState('mosaic', ['mosaic'], {
        result: createResult('mosaic', 0.42),
      }),
    );

    expect(
      screen.getByText(
        'Prototype caution: the highest class score is below 50%. This presentation rule is not a calibrated reliability threshold.',
      ),
    ).toBeOnTheScreen();
  });

  it.each([
    ['missing result', { result: null }],
    ['missing image', { sourceUri: null }],
    ['incomplete inference', { status: 'running' as const }],
  ])('shows a no-result state for %s', async (_name, overrides) => {
    await renderResult({
      ...createCompletedState('rust', ['rust']),
      ...overrides,
    });

    expect(screen.getByText('No completed scan result')).toBeOnTheScreen();
  });

  it('clears image, result, and checklist when starting a new scan', async () => {
    await renderResult(
      createCompletedState('rust', ['rust'], { reportedSeverity: 'Severe' }),
    );

    await fireEvent.press(
      screen.getByLabelText('Clear result and start a new scan'),
    );

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    expect(mockRouterReplace).toHaveBeenCalledWith('/scan');
  });

  it('returns to the checklist without clearing the completed session', async () => {
    await renderResult(createCompletedState('mosaic', ['mosaic']));

    await fireEvent.press(screen.getByLabelText('Go back'));

    expect(mockRouterBack).toHaveBeenCalledTimes(1);
    expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'RESET_SCAN' });
  });
});
