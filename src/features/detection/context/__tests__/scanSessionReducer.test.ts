import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import type {
  DetectionResult,
  ScanSessionState,
} from '@/features/detection/types';

const completedResult: DetectionResult = {
  predictedLabel: 'rust',
  confidence: 0.82,
  scores: [
    { label: 'healthy', score: 0.08 },
    { label: 'mosaic', score: 0.1 },
    { label: 'rust', score: 0.82 },
  ],
  timings: {
    preprocessMs: 10,
    inferenceMs: 20,
    totalMs: 30,
  },
  modelVersion: 'v0.1-baseline',
};

describe('scanSessionReducer', () => {
  it('starts with an empty temporary scan', () => {
    expect(initialScanSessionState).toEqual({
      sourceUri: null,
      processedUri: null,
      preprocessMs: null,
      sourceWidth: null,
      sourceHeight: null,
      sourceType: null,
      status: 'idle',
      result: null,
      selectedSymptoms: [],
      reportedSeverity: null,
      errorMessage: null,
    });
  });

  it('selects an image and clears data from the previous scan', () => {
    const previousState: ScanSessionState = {
      sourceUri: 'file:///old.jpg',
      processedUri: 'file:///old-processed.jpg',
      preprocessMs: 12,
      sourceWidth: 100,
      sourceHeight: 100,
      sourceType: 'camera',
      status: 'completed',
      result: completedResult,
      selectedSymptoms: ['rust'],
      reportedSeverity: 'Severe',
      errorMessage: 'old error',
    };

    const nextState = scanSessionReducer(previousState, {
      type: 'SELECT_IMAGE',
      payload: {
        sourceUri: 'content://new-leaf',
        sourceWidth: 1920,
        sourceHeight: 1080,
        sourceType: 'gallery',
      },
    });

    expect(nextState).toEqual({
      ...initialScanSessionState,
      sourceUri: 'content://new-leaf',
      sourceWidth: 1920,
      sourceHeight: 1080,
      sourceType: 'gallery',
      status: 'image-selected',
    });
  });

  it('moves through preprocessing, inference, and completion states', () => {
    const selected = scanSessionReducer(initialScanSessionState, {
      type: 'SELECT_IMAGE',
      payload: {
        sourceUri: 'file:///leaf.jpg',
        sourceWidth: null,
        sourceHeight: null,
        sourceType: 'camera',
      },
    });
    const preprocessing = scanSessionReducer(
      {
        ...selected,
        processedUri: 'file:///stale.jpg',
        preprocessMs: 5,
        result: completedResult,
      },
      { type: 'START_PREPROCESSING' },
    );
    const preprocessed = scanSessionReducer(preprocessing, {
      type: 'COMPLETE_PREPROCESSING',
      payload: {
        processedUri: 'file:///processed.jpg',
        preprocessMs: 10,
      },
    });
    const running = scanSessionReducer(preprocessed, { type: 'START_INFERENCE' });
    const completed = scanSessionReducer(running, {
      type: 'COMPLETE_INFERENCE',
      payload: completedResult,
    });

    expect(preprocessing).toMatchObject({
      processedUri: null,
      preprocessMs: null,
      result: null,
      status: 'preprocessing',
      errorMessage: null,
    });
    expect(preprocessed).toMatchObject({
      processedUri: 'file:///processed.jpg',
      preprocessMs: 10,
      status: 'image-selected',
      errorMessage: null,
    });
    expect(running).toMatchObject({ result: null, status: 'running', errorMessage: null });
    expect(completed).toMatchObject({
      result: completedResult,
      status: 'completed',
      errorMessage: null,
    });
  });

  it('updates questionnaire data without mutating the supplied symptoms', () => {
    const symptoms = ['mosaic'] as const;
    const withSymptoms = scanSessionReducer(initialScanSessionState, {
      type: 'SET_SYMPTOMS',
      payload: [...symptoms],
    });
    const withSeverity = scanSessionReducer(withSymptoms, {
      type: 'SET_REPORTED_SEVERITY',
      payload: 'Moderate',
    });

    expect(withSymptoms.selectedSymptoms).toEqual([...symptoms]);
    expect(withSymptoms.selectedSymptoms).not.toBe(symptoms);
    expect(withSeverity.reportedSeverity).toBe('Moderate');
  });

  it('recovers from errors according to whether an image is selected', () => {
    const idleError = scanSessionReducer(initialScanSessionState, {
      type: 'SET_ERROR',
      payload: 'Picker failed',
    });
    const clearedIdleError = scanSessionReducer(idleError, { type: 'CLEAR_ERROR' });
    const selectedError = scanSessionReducer(
      {
        ...initialScanSessionState,
        sourceUri: 'file:///leaf.jpg',
        sourceType: 'gallery',
      },
      { type: 'SET_ERROR', payload: 'Preview failed' },
    );
    const clearedSelectedError = scanSessionReducer(selectedError, { type: 'CLEAR_ERROR' });

    expect(idleError).toMatchObject({ status: 'error', errorMessage: 'Picker failed' });
    expect(clearedIdleError).toMatchObject({ status: 'idle', errorMessage: null });
    expect(clearedSelectedError).toMatchObject({
      status: 'image-selected',
      errorMessage: null,
    });
  });

  it('resets every scan-specific field', () => {
    const populated: ScanSessionState = {
      ...initialScanSessionState,
      sourceUri: 'file:///leaf.jpg',
      processedUri: 'file:///processed.jpg',
      preprocessMs: 10,
      sourceType: 'camera',
      status: 'completed',
      result: completedResult,
      selectedSymptoms: ['rust'],
      reportedSeverity: 'Mild',
      errorMessage: 'ignored',
    };

    expect(scanSessionReducer(populated, { type: 'RESET_SCAN' })).toEqual(
      initialScanSessionState,
    );
  });
});
