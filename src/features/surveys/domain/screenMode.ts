import type { FieldSurveyRow } from '@/database/schema';
import { FIELD_SURVEY_MODE_COPY } from '@/constants/copy';
import type { SyncTone } from '@/features/sync/utils/syncStatusCopy';
import { boundaryCanSubmit, boundaryState, type BoundaryState, type BoundaryStateInput } from './boundaryState';

/**
 * The nine things the boundary screen can be. One value replaces nine
 * booleans; the status strip, the locks and the buttons all read it.
 */
export const SCREEN_MODES = [
  'loading',
  'waiting_to_start',
  'drawing_new',
  'drawing_resumed',
  'fixing',
  'sending',
  'waiting_to_send',
  'sent',
  'identity_rejected',
] as const;
export type ScreenMode = (typeof SCREEN_MODES)[number];

/** The mode plus the stored boundary state that picked it (null when it did not come from a stored row). */
export interface ScreenState {
  mode: ScreenMode;
  boundary: BoundaryState | null;
}

export const LOADING_SCREEN: ScreenState = { mode: 'loading', boundary: null };
export const NEW_BOUNDARY_SCREEN: ScreenState = { mode: 'drawing_new', boundary: null };
export const WAITING_TO_SEND_SCREEN: ScreenState = { mode: 'waiting_to_send', boundary: 'waiting_to_send' };

type RowInput = BoundaryStateInput & Pick<FieldSurveyRow, 'waypointsJson' | 'affectedAreaPolygonsJson' | 'activeAffectedWaypointsJson'>;

function jsonListLength(value: string | null | undefined): number {
  if (!value) return 0;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

/** A stored draft with nothing drawn is not "a boundary you resumed". */
function hasDrawing(row: RowInput): boolean {
  return jsonListLength(row.waypointsJson) + jsonListLength(row.affectedAreaPolygonsJson) + jsonListLength(row.activeAffectedWaypointsJson) > 0;
}

/** The single place a stored row becomes a screen mode. */
export function screenStateForRow(row: RowInput): ScreenState {
  const boundary = boundaryState(row);
  switch (boundary) {
    case 'draft':
      return { mode: hasDrawing(row) ? 'drawing_resumed' : 'drawing_new', boundary };
    case 'needs_fix':
      return { mode: 'fixing', boundary };
    case 'sending':
      return { mode: 'sending', boundary };
    case 'sent':
      return { mode: 'sent', boundary };
    case 'identity_rejected':
    case 'damaged':
      return { mode: 'identity_rejected', boundary };
    case 'waiting_to_send':
    case 'will_retry':
    case 'refused':
      return { mode: 'waiting_to_send', boundary };
  }
}

/** Points can be drawn, moved and removed. */
export function screenCanEdit(mode: ScreenMode): boolean {
  return mode === 'drawing_new' || mode === 'drawing_resumed' || mode === 'fixing';
}

/** The row on screen came from storage, so the "start a new boundary" escape is on offer. */
export function screenIsStoredOrMissing(mode: ScreenMode): boolean {
  return mode !== 'loading' && mode !== 'drawing_new';
}

/** "Save and sync" is never offered once the office has it, or while sending, or for a boundary that cannot be sent again. */
export function screenCanSubmit(state: ScreenState): boolean {
  if (screenCanEdit(state.mode)) return true;
  return state.mode === 'waiting_to_send' && (state.boundary === null || boundaryCanSubmit(state.boundary));
}

/** Modes that can only be left by starting a fresh boundary. */
export function screenNeedsFreshIdentity(mode: ScreenMode): boolean {
  return mode === 'identity_rejected';
}

export interface StatusStrip {
  text: string;
  tone: SyncTone;
}

const MODE_TONE: Record<ScreenMode, SyncTone> = {
  loading: 'whisper',
  waiting_to_start: 'note',
  drawing_new: 'whisper',
  drawing_resumed: 'whisper',
  fixing: 'stop',
  sending: 'note',
  waiting_to_send: 'note',
  sent: 'whisper',
  identity_rejected: 'stop',
};

/** The one status strip: its words and its colour both come from the mode. */
export function statusStripFor(mode: ScreenMode): StatusStrip {
  return { text: FIELD_SURVEY_MODE_COPY[mode], tone: MODE_TONE[mode] };
}
