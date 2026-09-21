import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import AnalysisResultScreen from '@/app/analysis-result';
import { ToastProvider } from '@/components/ui/Toast';
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
const mockSaveRecord = jest.fn();
let mockSaveRecordState = {
  status: 'ready' as 'ready' | 'saving' | 'saved' | 'failed',
  error: null,
  errorMessage: null as string | null,
  recordId: null as string | null,
  save: mockSaveRecord,
};
const mockRouterBack = router.back as jest.Mock;
const mockRouterPush = router.push as jest.Mock;
const mockRouterReplace = router.replace as jest.Mock;

jest.mock('@/features/records/hooks/useSaveCompletedScan', () => ({
  useSaveCompletedScan: () => mockSaveRecordState,
}));

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
  ['smut', 'consistent', ['smut']],
  ['smut', 'inconsistent', ['rust']],
  ['smut', 'not-applicable', ['smut', 'rust']],
  ['smut', 'not-enough-information', []],
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
      { label: 'smut', score: predictedLabel === 'smut' ? confidence : 0.02 },
    ],
    timings: {
      preprocessMs: 40,
      inferenceMs: 20,
      totalMs: 60,
    },
    modelVersion: 'v1.0-mobilenetv2',
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
    <ToastProvider>
      <ScanSessionContext.Provider value={{ state, dispatch: mockDispatch }}>
        <AnalysisResultScreen />
      </ScanSessionContext.Provider>
    </ToastProvider>,
  );
}


function collectTestIds(node: unknown, collected: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((child) => collectTestIds(child, collected));
    return collected;
  }
  if (!node || typeof node !== 'object') return collected;
  const record = node as { props?: Record<string, unknown>; children?: unknown };
  const testID = record.props?.testID;
  if (typeof testID === 'string') collected.push(testID);
  collectTestIds(record.children, collected);
  return collected;
}

describe('AnalysisResultScreen', () => {
  beforeEach(() => {
    mockSaveRecord.mockReset();
    mockSaveRecordState = {
      status: 'ready',
      error: null,
      errorMessage: null,
      recordId: null,
      save: mockSaveRecord,
    };
  });

  it.each(MATRIX)(
    'renders the %s result with %s checklist status',
    async (predictedLabel, expectedStatus, selectedSymptoms) => {
      await renderResult(createCompletedState(predictedLabel, selectedSymptoms));

      await fireEvent.press(screen.getByLabelText('Show Why this result?'));

      expect(screen.getByText(STATUS_TITLES[expectedStatus])).toBeOnTheScreen();
      expect(
        screen.getByText(
          `Possible Condition: ${predictedLabel === 'healthy' ? 'No supported disease detected' : predictedLabel === 'mosaic' ? 'Mosaic' : predictedLabel === 'rust' ? 'Rust' : 'Smut'}`
        ),
      ).toBeOnTheScreen();
    },
  );

  it('renders the selected image, raw model scores, and metadata without scan severity controls', async () => {
    const result = createResult('rust');
    const state = createCompletedState('rust', ['rust'], {
      result,
      reportedSeverity: 'Moderate',
    });

    await renderResult(state);

    expect(screen.getByTestId('scan.result-screen')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.result-title')).toHaveTextContent(
      'Possible Condition: Rust',
    );
    expect(screen.queryByTestId('scan.barangay-input')).not.toBeOnTheScreen();
    expect(screen.getByTestId('scan.report-to-office')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.keep-as-scan-only')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.new-scan')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Selected sugarcane image used for analysis'),
    ).toHaveProp('source', { uri: 'file:///result-leaf.jpg' });
    expect(screen.getByText('Possible Condition: Rust')).toBeOnTheScreen();
    expect(screen.queryByLabelText('AI confidence 78%')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Show Why this result?'));
    expect(screen.getByLabelText('AI confidence 78%')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Show Model details'));
    expect(screen.getByLabelText('Healthy score 8%')).toBeOnTheScreen();
    expect(screen.getByLabelText('Mosaic score 14%')).toBeOnTheScreen();
    expect(screen.getByLabelText('Rust score 78%')).toBeOnTheScreen();
    expect(screen.getByLabelText('Smut score 2%')).toBeOnTheScreen();
    expect(screen.queryByText('Reported severity')).not.toBeOnTheScreen();
    expect(screen.queryByText('Mild')).not.toBeOnTheScreen();
    expect(screen.queryByText('Moderate')).not.toBeOnTheScreen();
    expect(screen.queryByText('Severe')).not.toBeOnTheScreen();
    expect(screen.getAllByText('v1.0-mobilenetv2').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('60 ms')).toBeOnTheScreen();
    expect(result.confidence).toBe(0.78);
    expect(screen.queryByText('Downy Mildew')).not.toBeOnTheScreen();
  });

  it('uses the frozen V1 low-confidence caution without blocking outcomes', async () => {
    await renderResult(
      createCompletedState('mosaic', ['mosaic'], {
        result: createResult('mosaic', 0.42),
      }),
    );

    expect(
      screen.getByText(
        'This result is not conclusive. You can still report it, keep it as a scan, or scan again for a clearer image.',
      ),
    ).toBeOnTheScreen();
    expect(
      screen.queryByText(/55\.2%/),
    ).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Show Model details'));
    expect(screen.getByText('55.2%')).toBeOnTheScreen();
  });

  it('shows image quality warnings without changing model confidence', async () => {
    const result = createResult('rust', 0.78);

    await renderResult(
      createCompletedState('rust', ['rust'], {
        result,
        qualityAssessment: {
          warnings: ['low-resolution', 'too-dark'],
          meanLuminance: 30,
          luminanceStandardDeviation: 28,
        },
      }),
    );

    expect(screen.queryByText('Image quality notice')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Show Why this result?'));

    expect(screen.getByText('Image quality notice')).toBeOnTheScreen();
    expect(
      screen.getByText('These input warnings did not change the model scores.'),
    ).toBeOnTheScreen();
    expect(
      screen.getByText(
        'The image resolution is low. Move closer and keep the affected area in focus.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('AI confidence 78%')).toBeOnTheScreen();
    expect(result.confidence).toBe(0.78);
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
      screen.getByLabelText('Scan again with a new image'),
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

  it('offers separate report and scan-only outcomes while preserving local evidence', async () => {
    await renderResult(createCompletedState('rust', ['rust']));

    expect(
      screen.getByText(
        'Report to Office saves this scan and opens a short Field Report Draft. Keep as Scan Only stores the scan without sending a report.',
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Keep this scan only on the device'));
    expect(mockSaveRecord).toHaveBeenCalledTimes(1);
  });

  it('saves before opening the existing Field Report flow', async () => {
    mockSaveRecord.mockResolvedValue({ id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2' });

    await renderResult(createCompletedState('rust', ['rust']));
    await fireEvent.press(screen.getByLabelText('Report this scan to the office'));

    expect(mockSaveRecord).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/field-report',
      params: { scanRecordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2' },
    });
  });

  it('opens the report from an already preserved scan without saving it again', async () => {
    mockSaveRecordState = {
      ...mockSaveRecordState,
      status: 'saved',
      recordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
    };

    await renderResult(createCompletedState('rust', ['rust']));
    await fireEvent.press(screen.getByLabelText('Report this scan to the office'));

    expect(mockSaveRecord).not.toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/field-report',
      params: { scanRecordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2' },
    });
  });

  it('shows direct report progress while the scan is being preserved', async () => {
    let resolveSave!: (value: { id: string }) => void;
    mockSaveRecord.mockReturnValue(
      new Promise<{ id: string }>((resolve) => {
        resolveSave = resolve;
      }),
    );

    await renderResult(createCompletedState('rust', ['rust']));
    await fireEvent.press(screen.getByLabelText('Report this scan to the office'));

    expect(screen.getByLabelText('Opening Field Report')).toBeDisabled();
    expect(mockRouterPush).not.toHaveBeenCalled();

    resolveSave({ id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2' });
    await waitFor(() =>
      expect(mockRouterPush).toHaveBeenCalledWith({
        pathname: '/field-report',
        params: { scanRecordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2' },
      }),
    );
  });

  it('allows completed scan evidence to remain scan-only without a barangay', async () => {
    await renderResult(
      createCompletedState('rust', ['rust']),
    );

    expect(screen.getByLabelText('Keep this scan only on the device')).toBeEnabled();
  });

  it('disables report, scan-only, and new-scan actions while saving', async () => {
    mockSaveRecordState = {
      ...mockSaveRecordState,
      status: 'saving',
      recordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
    };

    await renderResult(createCompletedState('rust', ['rust']));

    expect(screen.getByLabelText('Report this scan to the office')).toBeDisabled();
    expect(screen.getByLabelText('Keep this scan only on the device')).toBeDisabled();
    expect(
      screen.getByLabelText('Scan again with a new image'),
    ).toBeDisabled();
  });

  it('shows saved confirmation without another save action', async () => {
    mockSaveRecordState = {
      ...mockSaveRecordState,
      status: 'saved',
      recordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
    };

    await renderResult(createCompletedState('rust', ['rust']));

    expect(screen.getByTestId('scan.record-saved')).toBeOnTheScreen();
    expect(screen.queryByTestId('scan.open-saved-record')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Show More actions'));
    expect(screen.getByTestId('scan.open-saved-record')).toBeOnTheScreen();
    expect(screen.getByText('Scan saved on this device')).toBeOnTheScreen();
    expect(screen.getByLabelText('Report this scan to the office')).toBeOnTheScreen();
    expect(screen.getByLabelText('Keep this scan only on the device')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Open the saved local scan'));
    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/record-details',
      params: {
        id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
      },
    });
  });

  it('keeps the result visible and offers retry after a save failure', async () => {
    mockSaveRecordState = {
      ...mockSaveRecordState,
      status: 'failed',
      errorMessage:
        'The record could not be saved. Your scan result is still available.',
      recordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
    };

    await renderResult(createCompletedState('rust', ['rust']));

    expect(screen.getByText('Possible Condition: Rust')).toBeOnTheScreen();
    expect(screen.getByText('Choose another action')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByLabelText('Retry and keep this scan only'),
    );
    expect(mockSaveRecord).toHaveBeenCalledTimes(1);
  });

  it('keeps an AI/checklist mismatch visible while reporting remains available', async () => {
    mockSaveRecord.mockResolvedValue({ id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2' });

    await renderResult(createCompletedState('mosaic', ['something-else']));

    expect(screen.queryByTestId('scan.checklist-consistency')).not.toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Show Why this result?'));

    expect(screen.getByTestId('scan.checklist-consistency')).toBeOnTheScreen();
    expect(screen.getByText('Checklist inconsistent')).toBeOnTheScreen();
    expect(
      screen.getByText(
        'The selected observation differs from the Possible Condition. Both remain separate evidence, and this scan can still be reported to the office.',
      ),
    ).toBeOnTheScreen();
    expect(screen.getByLabelText('Report this scan to the office')).toBeEnabled();

    await fireEvent.press(screen.getByLabelText('Report this scan to the office'));

    expect(mockRouterPush).toHaveBeenCalledWith({
      pathname: '/field-report',
      params: { scanRecordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2' },
    });
  });
  it('keeps three actions in the first view with the rest behind More actions', async () => {
    mockSaveRecordState = {
      ...mockSaveRecordState,
      status: 'saved',
      recordId: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2',
    };
    await renderResult(createCompletedState('rust', ['rust']));

    expect(screen.getByTestId('scan.report-to-office')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.keep-as-scan-only')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.new-scan')).toBeOnTheScreen();
    expect(screen.queryByTestId('scan.view-disease-reference')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('analysis-result.cancel')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('scan.open-saved-record')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Show More actions'));

    expect(screen.getByTestId('scan.view-disease-reference')).toBeOnTheScreen();
    expect(screen.getByTestId('analysis-result.cancel')).toBeOnTheScreen();
    expect(screen.getByTestId('scan.open-saved-record')).toBeOnTheScreen();
  });

  it('places the three decisions before every explanation disclosure', async () => {
    await renderResult(createCompletedState('rust', ['rust'], {
      qualityAssessment: {
        warnings: ['low-resolution'],
        meanLuminance: 30,
        luminanceStandardDeviation: 28,
      },
      result: createResult('rust', 0.42),
    }));

    const order = collectTestIds(screen.toJSON());
    const reportIndex = order.indexOf('scan.report-to-office');
    const keepIndex = order.indexOf('scan.keep-as-scan-only');
    const scanAgainIndex = order.indexOf('scan.new-scan');
    const whyIndex = order.indexOf('scan.why-this-result');
    const technicalIndex = order.indexOf('scan.technical-details');

    expect(reportIndex).toBeGreaterThan(-1);
    expect(keepIndex).toBeGreaterThan(reportIndex);
    expect(scanAgainIndex).toBeGreaterThan(keepIndex);
    expect(whyIndex).toBeGreaterThan(scanAgainIndex);
    expect(technicalIndex).toBeGreaterThan(whyIndex);

    expect(screen.queryByText('Image quality notice')).not.toBeOnTheScreen();
    expect(screen.queryByText('v1.0-mobilenetv2')).not.toBeOnTheScreen();
    expect(screen.queryByText('55.2%')).not.toBeOnTheScreen();
    expect(screen.getByLabelText('Report this scan to the office')).toBeEnabled();
    expect(screen.getByLabelText('Keep this scan only on the device')).toBeEnabled();
  });

  describe('cancel and return home', () => {
    beforeEach(() => {
      mockRouterReplace.mockReset();
      mockDispatch.mockReset();
    });

    it('opens cancel dialog from header close button', async () => {
      await renderResult(createCompletedState('rust', ['rust']));

      expect(screen.queryByTestId('analysis-result.cancel-dialog')).not.toBeOnTheScreen();
      await fireEvent.press(screen.getByTestId('analysis-result.header-close'));

      expect(screen.getByTestId('analysis-result.cancel-dialog')).toBeOnTheScreen();
      expect(screen.getByText('Cancel scan?')).toBeOnTheScreen();
      expect(screen.getByText('Keep draft')).toBeOnTheScreen();
      expect(screen.getByText('Discard draft')).toBeOnTheScreen();
    });

    it('opens cancel dialog from on-screen Cancel button', async () => {
      await renderResult(createCompletedState('rust', ['rust']));

      expect(screen.queryByTestId('analysis-result.cancel-dialog')).not.toBeOnTheScreen();
      await fireEvent.press(screen.getByLabelText('Show More actions'));
      await fireEvent.press(screen.getByTestId('analysis-result.cancel'));

      expect(screen.getByTestId('analysis-result.cancel-dialog')).toBeOnTheScreen();
    });

    it('persists scan and routes home when Keep draft is chosen', async () => {
      mockSaveRecord.mockResolvedValue({ id: '2b4666c0-ad10-4d0d-a233-cf9f8ef73ed2' });
      await renderResult(createCompletedState('rust', ['rust']));

      await fireEvent.press(screen.getByLabelText('Show More actions'));
      await fireEvent.press(screen.getByTestId('analysis-result.cancel'));
      await fireEvent.press(screen.getByTestId('analysis-result.cancel-dialog.cancel'));

      expect(mockSaveRecord).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Scan saved');
      expect(mockRouterReplace).toHaveBeenCalledWith('/home');
      expect(mockDispatch).not.toHaveBeenCalledWith({ type: 'RESET_SCAN' });
    });

    it('resets scan session and routes home when Discard draft is chosen', async () => {
      await renderResult(createCompletedState('rust', ['rust']));

      await fireEvent.press(screen.getByLabelText('Show More actions'));
      await fireEvent.press(screen.getByTestId('analysis-result.cancel'));
      await fireEvent.press(screen.getByTestId('analysis-result.cancel-dialog.confirm'));

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
      expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
      expect(screen.getByTestId('app-toast')).toHaveTextContent('Scan discarded');
      expect(mockRouterReplace).toHaveBeenCalledWith('/home');
    });

    it('allows canceling from recovery screen when result is missing', async () => {
      await renderResult({
        ...initialScanSessionState,
        status: 'idle',
        result: null,
      });

      await fireEvent.press(screen.getByTestId('analysis-result.header-close'));
      expect(screen.getByTestId('analysis-result.cancel-dialog')).toBeOnTheScreen();

      await fireEvent.press(screen.getByTestId('analysis-result.cancel-dialog.confirm'));
      expect(mockDispatch).toHaveBeenCalledWith({ type: 'RESET_SCAN' });
      expect(mockRouterReplace).toHaveBeenCalledWith('/home');
    });
  });
});
