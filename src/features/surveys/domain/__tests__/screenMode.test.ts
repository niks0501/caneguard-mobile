import { FIELD_SURVEY_MODE_COPY } from '@/constants/copy';
import { SCREEN_MODES, screenCanEdit, screenCanSubmit, screenStateForRow, statusStripFor, type ScreenMode } from '../screenMode';

const POINTS = JSON.stringify([{ latitude: 1, longitude: 1 }]);
function row(overrides: Record<string, unknown>) {
  return { status: 'draft', lastSyncErrorCode: null, remoteId: null, waypointsJson: POINTS, affectedAreaPolygonsJson: '[]', activeAffectedWaypointsJson: '[]', ...overrides } as Parameters<typeof screenStateForRow>[0];
}

// Intent: one mapper turns a stored row into exactly one screen mode, so no screen path re-derives it.
describe('screenStateForRow', () => {
  it.each<[string, Record<string, unknown>, ScreenMode]>([
    ['a draft with points', {}, 'drawing_resumed'],
    ['an empty draft', { waypointsJson: '[]' }, 'drawing_new'],
    ['a server correction', { status: 'failed', lastSyncErrorCode: 'API_VALIDATION_FAILED' }, 'fixing'],
    ['a sending row', { status: 'syncing' }, 'sending'],
    ['a pending row', { status: 'pending' }, 'waiting_to_send'],
    ['a network failure', { status: 'failed', lastSyncErrorCode: 'NETWORK_ERROR' }, 'waiting_to_send'],
    ['a synced row', { status: 'synced', remoteId: 'r1' }, 'sent'],
    ['a rejected identity', { status: 'failed', lastSyncErrorCode: 'CLIENT_UUID_CONFLICT' }, 'identity_rejected'],
  ])('maps %s', (_label, overrides, mode) => {
    expect(screenStateForRow(row(overrides)).mode).toBe(mode);
  });

  it('only drawing modes are editable', () => {
    expect(SCREEN_MODES.filter(screenCanEdit)).toEqual(['drawing_new', 'drawing_resumed', 'fixing']);
  });

  it('never offers Save and sync for a sent or rejected boundary', () => {
    expect(screenCanSubmit(screenStateForRow(row({ status: 'synced', remoteId: 'r1' })))).toBe(false);
    expect(screenCanSubmit(screenStateForRow(row({ status: 'failed', lastSyncErrorCode: 'CLIENT_UUID_CONFLICT' })))).toBe(false);
    expect(screenCanSubmit(screenStateForRow(row({ status: 'pending' })))).toBe(true);
  });
});

// Intent: each of the nine modes says something different in the status strip.
describe('statusStripFor', () => {
  it('gives every mode its own text', () => {
    const texts = SCREEN_MODES.map((mode) => statusStripFor({ mode, boundary: null }).text);
    expect(new Set(texts).size).toBe(SCREEN_MODES.length);
    expect(texts[0]).toBe(FIELD_SURVEY_MODE_COPY.loading);
  });
});
