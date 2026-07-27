import type { ScanSessionAction, ScanSessionState } from '@/features/detection/types';

export const initialScanSessionState: ScanSessionState = {
  barangay: '',
  sourceUri: null,
  processedUri: null,
  preprocessMs: null,
  sourceWidth: null,
  sourceHeight: null,
  sourceType: null,
  status: 'idle',
  result: null,
  qualityAssessment: null,
  selectedSymptoms: [],
  reportedSeverity: null,
  errorMessage: null,
};

export function scanSessionReducer(
  state: ScanSessionState,
  action: ScanSessionAction,
): ScanSessionState {
  switch (action.type) {
    case 'SELECT_IMAGE':
      return {
        ...initialScanSessionState,
        ...action.payload,
        status: 'image-selected',
      };
    case 'RESET_SCAN':
      return { ...initialScanSessionState };
    case 'START_PREPROCESSING':
      return {
        ...state,
        processedUri: null,
        preprocessMs: null,
        result: null,
        qualityAssessment: null,
        status: 'preprocessing',
        errorMessage: null,
      };
    case 'COMPLETE_PREPROCESSING':
      return {
        ...state,
        ...action.payload,
        status: 'image-selected',
        errorMessage: null,
      };
    case 'START_INFERENCE':
      return {
        ...state,
        result: null,
        status: 'running',
        errorMessage: null,
      };
    case 'START_RESULT_PREPARATION':
      return {
        ...state,
        status: 'finalizing',
        errorMessage: null,
      };
    case 'COMPLETE_INFERENCE':
      return {
        ...state,
        result: action.payload,
        status: 'completed',
        errorMessage: null,
      };
    case 'SET_SYMPTOMS':
      return {
        ...state,
        selectedSymptoms: [...action.payload],
      };
    case 'SET_REPORTED_SEVERITY':
      return {
        ...state,
        reportedSeverity: action.payload,
      };
    case 'SET_BARANGAY':
      return {
        ...state,
        barangay: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: action.payload,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        status: state.sourceUri ? 'image-selected' : 'idle',
        errorMessage: null,
      };
  }
}
