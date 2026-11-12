import type {
  FieldReport,
  FieldReportSubmissionRequirement,
} from '@/features/reports/domain/fieldReportTypes';

/**
 * REP-1: the one answer to "where is the field report flow?". The report hook
 * owns a single state of this shape and every screen reads it instead of
 * guessing from local flags or copy. Phases run from nothing opened (`empty`)
 * to a finished report (`complete`); `FIELD_REPORT_FLOW_TRANSITIONS` is the
 * only place that says which event is legal from which phase.
 */
export type FieldReportFlowPhase =
  | 'empty'
  | 'loading'
  | 'load-failed'
  | 'draft'
  | 'needs-fixes'
  | 'saving'
  | 'saving-location'
  | 'confirming'
  | 'finalizing'
  | 'sending'
  | 'complete';

export const FIELD_REPORT_FLOW_PHASES: readonly FieldReportFlowPhase[] = [
  'empty',
  'loading',
  'load-failed',
  'draft',
  'needs-fixes',
  'saving',
  'saving-location',
  'confirming',
  'finalizing',
  'sending',
  'complete',
];

/** Why the finalize dialog is still open after an attempt. */
export type FinalizeNotice =
  | { kind: 'busy' }
  | { kind: 'failed'; message: string | null };

export interface FieldReportFlowState {
  confirmNotice: FinalizeNotice | null;
  data: FieldReport | null;
  errorMessage: string | null;
  locationPermissionDenied: boolean;
  locationServicesDisabled: boolean;
  phase: FieldReportFlowPhase;
  /** A foreground GPS reading is running. It overlaps editing, never finalizing. */
  reading: boolean;
  saved: boolean;
  submissionIssues: FieldReportSubmissionRequirement[];
}

export type FieldReportFlowEvent =
  | { type: 'LOAD_STARTED' }
  | { type: 'LOADED'; data: FieldReport }
  | { type: 'LOAD_FAILED'; message: string }
  | { type: 'SAVE_STARTED' }
  | { type: 'SAVE_SUCCEEDED'; data: FieldReport }
  | { type: 'SAVE_FAILED'; message: string }
  | { type: 'SAVE_ENDED' }
  | { type: 'LOCATE_STARTED' }
  | {
      type: 'LOCATE_NOTICES';
      permissionDenied: boolean;
      servicesDisabled: boolean;
    }
  | { type: 'LOCATE_SUCCEEDED'; data: FieldReport }
  | { type: 'LOCATE_FAILED'; message: string }
  | { type: 'LOCATE_ENDED' }
  | { type: 'PLACE_STARTED' }
  | { type: 'PLACE_SUCCEEDED'; data: FieldReport }
  | { type: 'PLACE_FAILED'; message: string }
  | { type: 'PLACE_ENDED' }
  | { type: 'CONFIRM_OPENED' }
  | { type: 'CONFIRM_DISMISSED' }
  | { type: 'FINALIZE_STARTED' }
  | { type: 'FINALIZE_SUCCEEDED'; data: FieldReport }
  | {
      type: 'FINALIZE_INVALID';
      data: FieldReport;
      issues: FieldReportSubmissionRequirement[];
    }
  | { type: 'FINALIZE_FAILED'; message: string | null }
  | { type: 'FINALIZE_REFUSED_BUSY' }
  | { type: 'FINALIZE_ENDED' }
  | { type: 'SEND_ENDED' }
  | { type: 'DISCARDED' };

export type FieldReportFlowEventType = FieldReportFlowEvent['type'];

/**
 * A fixed phase, `same` for events that only touch data beside the phase (a
 * GPS reading overlaps editing), or `resolved` when the loaded report decides
 * between `draft` and `complete`.
 */
type Target = FieldReportFlowPhase | 'same' | 'resolved' | 'dismissed';

/** A reading can end (or be superseded) in any phase, so it never sticks on. */
const ALWAYS = { LOCATE_ENDED: 'same' } as const;

const LOAD_EVENTS = {
  LOAD_STARTED: 'loading',
  LOAD_FAILED: 'load-failed',
} as const;

const LOCATE_EVENTS = {
  LOCATE_FAILED: 'same',
  LOCATE_NOTICES: 'same',
  LOCATE_SUCCEEDED: 'same',
} as const;

const EDITING_EVENTS = {
  ...LOAD_EVENTS,
  ...LOCATE_EVENTS,
  CONFIRM_OPENED: 'confirming',
  DISCARDED: 'empty',
  FINALIZE_STARTED: 'finalizing',
  LOCATE_STARTED: 'same',
  PLACE_STARTED: 'saving-location',
  SAVE_STARTED: 'saving',
} as const;

/**
 * Every legal move. An event missing from a phase's row is refused: the
 * reducer returns the same state and `canTransition` says false, so a save
 * cannot start during a finalize, a refresh cannot wipe a report mid-save, and
 * a second finalize cannot start while one is running.
 */
export const FIELD_REPORT_FLOW_TRANSITIONS: Record<
  FieldReportFlowPhase,
  Partial<Record<FieldReportFlowEventType, Target>>
> = {
  empty: { ...ALWAYS, ...LOAD_EVENTS },
  loading: {
    ...ALWAYS,
    ...LOCATE_EVENTS,
    LOAD_FAILED: 'load-failed',
    LOAD_STARTED: 'loading',
    LOADED: 'resolved',
  },
  'load-failed': { ...ALWAYS, ...LOAD_EVENTS },
  draft: { ...ALWAYS, ...EDITING_EVENTS },
  'needs-fixes': { ...ALWAYS, ...EDITING_EVENTS },
  saving: {
    ...ALWAYS,
    ...LOCATE_EVENTS,
    LOCATE_STARTED: 'same',
    SAVE_ENDED: 'draft',
    SAVE_FAILED: 'draft',
    SAVE_SUCCEEDED: 'draft',
  },
  'saving-location': {
    ...ALWAYS,
    PLACE_ENDED: 'draft',
    PLACE_FAILED: 'draft',
    PLACE_SUCCEEDED: 'draft',
  },
  confirming: {
    ...ALWAYS,
    ...LOCATE_EVENTS,
    CONFIRM_DISMISSED: 'dismissed',
    FINALIZE_REFUSED_BUSY: 'confirming',
    FINALIZE_STARTED: 'finalizing',
    LOCATE_STARTED: 'same',
  },
  finalizing: {
    ...ALWAYS,
    FINALIZE_ENDED: 'draft',
    FINALIZE_FAILED: 'confirming',
    FINALIZE_INVALID: 'confirming',
    FINALIZE_SUCCEEDED: 'sending',
  },
  sending: { ...ALWAYS, SEND_ENDED: 'complete' },
  complete: { ...ALWAYS, ...LOAD_EVENTS },
};

export function createFieldReportFlowState(
  phase: FieldReportFlowPhase = 'loading',
): FieldReportFlowState {
  return {
    confirmNotice: null,
    data: null,
    errorMessage: null,
    locationPermissionDenied: false,
    locationServicesDisabled: false,
    phase,
    reading: false,
    saved: false,
    submissionIssues: [],
  };
}

export function canTransition(
  phase: FieldReportFlowPhase,
  event: FieldReportFlowEventType,
): boolean {
  return FIELD_REPORT_FLOW_TRANSITIONS[phase][event] !== undefined;
}

function targetPhase(
  state: FieldReportFlowState,
  target: Target,
  data: FieldReport | null,
): FieldReportFlowPhase {
  if (target === 'same') {
    return state.phase;
  }
  if (target === 'resolved') {
    return data?.authoringState === 'finalized' ? 'complete' : 'draft';
  }
  if (target === 'dismissed') {
    return 'draft';
  }
  return target;
}

/** Fields the event changes besides the phase. */
function applyEvent(
  event: FieldReportFlowEvent,
): Partial<FieldReportFlowState> {
  switch (event.type) {
    case 'LOAD_STARTED':
      return {
        confirmNotice: null,
        data: null,
        errorMessage: null,
        saved: false,
        submissionIssues: [],
      };
    case 'LOADED':
      return { data: event.data, errorMessage: null, submissionIssues: [] };
    case 'LOAD_FAILED':
      return { data: null, errorMessage: event.message };
    case 'SAVE_STARTED':
      return { errorMessage: null, saved: false, submissionIssues: [] };
    case 'SAVE_SUCCEEDED':
    case 'PLACE_SUCCEEDED':
      return { data: event.data, errorMessage: null, saved: true };
    case 'SAVE_FAILED':
    case 'PLACE_FAILED':
    case 'LOCATE_FAILED':
      return { errorMessage: event.message };
    case 'LOCATE_STARTED':
      return {
        errorMessage: null,
        locationPermissionDenied: false,
        locationServicesDisabled: false,
        reading: true,
        saved: false,
        submissionIssues: [],
      };
    case 'LOCATE_NOTICES':
      return {
        locationPermissionDenied: event.permissionDenied,
        locationServicesDisabled: event.servicesDisabled,
      };
    case 'LOCATE_SUCCEEDED':
      return { data: event.data, errorMessage: null };
    case 'LOCATE_ENDED':
      return { reading: false };
    case 'PLACE_STARTED':
      // Saving a place supersedes any reading still running.
      return {
        errorMessage: null,
        reading: false,
        saved: false,
        submissionIssues: [],
      };
    case 'CONFIRM_OPENED':
      return { confirmNotice: null };
    case 'CONFIRM_DISMISSED':
      return { confirmNotice: null };
    case 'FINALIZE_STARTED':
      return {
        confirmNotice: null,
        errorMessage: null,
        saved: false,
        submissionIssues: [],
      };
    case 'FINALIZE_SUCCEEDED':
      return { confirmNotice: null, data: event.data, errorMessage: null };
    case 'FINALIZE_INVALID':
      return {
        confirmNotice: { kind: 'failed', message: null },
        data: event.data,
        errorMessage: null,
        saved: true,
        submissionIssues: event.issues,
      };
    case 'FINALIZE_FAILED':
      return {
        confirmNotice: { kind: 'failed', message: event.message },
        errorMessage: event.message,
      };
    case 'FINALIZE_REFUSED_BUSY':
      return { confirmNotice: { kind: 'busy' } };
    case 'DISCARDED':
      return {
        confirmNotice: null,
        data: null,
        errorMessage: null,
        saved: false,
        submissionIssues: [],
      };
    default:
      return {};
  }
}

/**
 * Pure transition. An event the table does not allow from the current phase
 * returns the very same state object, so callers can detect a refusal with
 * `next === state` (or ask `canTransition` first).
 */
export function reduceFieldReportFlow(
  state: FieldReportFlowState,
  event: FieldReportFlowEvent,
): FieldReportFlowState {
  const target = FIELD_REPORT_FLOW_TRANSITIONS[state.phase][event.type];
  if (target === undefined) {
    return state;
  }
  // One foreground reading at a time.
  if (event.type === 'LOCATE_STARTED' && state.reading) {
    return state;
  }
  const patch = applyEvent(event);
  const data = 'data' in patch ? (patch.data ?? null) : state.data;
  let phase = targetPhase(state, target, data);
  // A dismissed dialog falls back to the fix list when one is showing.
  if (target === 'dismissed' && state.submissionIssues.length > 0) {
    phase = 'needs-fixes';
  }
  return { ...state, ...patch, phase };
}

/** Phases in which another save, place or finalize must report "busy". */
export function isFlowBusy(state: FieldReportFlowState): boolean {
  return (
    state.reading ||
    state.phase === 'saving' ||
    state.phase === 'saving-location' ||
    state.phase === 'finalizing' ||
    state.phase === 'sending'
  );
}
