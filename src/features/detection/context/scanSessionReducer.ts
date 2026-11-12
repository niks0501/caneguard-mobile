import { clearedStatus } from '@/features/detection/context/scanCheckState';
import type { ScanSessionAction, ScanSessionState } from '@/features/detection/types';

export const initialScanSessionState: ScanSessionState = {
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

/**
 * A session-scoped reset only clears the session that still shows `sessionUri`.
 * A screen that resets after it lost the session must never clear a newer one.
 */
export function resetAppliesToSession(
  state: Pick<ScanSessionState, 'sourceUri'>,
  payload: { sessionUri: string | null } | undefined,
): boolean {
  return !payload || payload.sessionUri === state.sourceUri;
}

export function scanSessionReducer(
  state: ScanSessionState,
  action: ScanSessionAction,
): ScanSessionState {
  switch (action.type) {
    case 'SELECT_IMAGE':
      return {
        ...initialScanSessionState,
        ...action.payload,
        // A Check Again keeps its link when the farmer picks or retakes the photo.
        ...(state.followUpOf ? { followUpOf: state.followUpOf } : {}),
        status: 'image-selected',
      };
    case 'RESET_SCAN':
      return resetAppliesToSession(state, action.payload)
        ? { ...initialScanSessionState }
        : state;
    case 'START_FOLLOW_UP':
      return { ...initialScanSessionState, followUpOf: action.payload.scanId };
    case 'SET_PERSONAL_NOTE':
      return { ...state, personalNote: action.payload };
    case 'SET_PERSONAL_PLACE':
      return { ...state, personalPlace: action.payload };
    case 'START_PREPROCESSING':
      return {
        ...state,
        processedUri: null,
        preprocessMs: null,
        result: null,
        qualityAssessment: null,
        photoPreparationFailed: false,
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
    case 'SET_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: action.payload,
        photoPreparationFailed: action.photoPreparationFailed ?? false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        status: clearedStatus(state),
        errorMessage: null,
        photoPreparationFailed: false,
      };
  }
}
