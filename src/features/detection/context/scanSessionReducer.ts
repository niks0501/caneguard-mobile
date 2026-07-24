import type { ScanSessionAction, ScanSessionState } from '@/features/detection/types';

export const initialScanSessionState: ScanSessionState = {
  sourceUri: null,
  processedUri: null,
  sourceWidth: null,
  sourceHeight: null,
  sourceType: null,
  status: 'idle',
  result: null,
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
        result: null,
        status: 'preprocessing',
        errorMessage: null,
      };
    case 'START_INFERENCE':
      return {
        ...state,
        result: null,
        status: 'running',
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
