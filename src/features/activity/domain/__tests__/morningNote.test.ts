import { buildMorningNote } from '@/features/activity/domain/morningNote';
import type { NeedsAttentionItem } from '@/features/activity/domain/needsAttention';

function visit(bucket: 'overdue' | 'today' | 'upcoming' | 'none', id: string = bucket): NeedsAttentionItem {
  return {
    bucket,
    destination: { kind: 'assignment', assignmentId: id },
    id: `assignment-${id}`,
    kind: 'assignment',
    message: 'Mabini',
    meta: 'Visit',
    place: 'Mabini',
    title: 'Field visit',
  };
}

const UPDATE: NeedsAttentionItem = {
  destination: { kind: 'unavailable' },
  id: 'notification-1',
  kind: 'notification',
  message: 'Reviewed',
  meta: 'CG-1',
  title: 'Update',
};

const UPLOAD: NeedsAttentionItem = {
  destination: null,
  id: 'upload-pending',
  kind: 'upload',
  message: 'Reports saved on this device are waiting to be uploaded.',
  meta: 'Waiting to upload',
  title: '1 report synchronization',
};

const READABLE_UPDATE: NeedsAttentionItem = {
  ...UPDATE,
  destination: { kind: 'field_report', scanRecordId: 'scan-1' },
  id: 'notification-2',
};

describe('buildMorningNote', () => {
  it('says all clear and offers a scan when nothing is waiting', () => {
    expect(buildMorningNote([], null)).toEqual({
      action: 'scan',
      actionLabel: 'Start a scan',
      headline: 'All clear.',
      headlineOpensActivity: false,
      syncLine: null,
      visitsLine: null,
    });
  });

  it('uses the send state as the headline when there is no work', () => {
    expect(buildMorningNote([], 'Working offline.')).toMatchObject({
      headline: 'Working offline.',
      headlineOpensActivity: true,
      syncLine: null,
    });
  });

  it('counts visits due today and overdue separately', () => {
    const note = buildMorningNote(
      [visit('overdue'), visit('today', 'a'), visit('today', 'b')],
      null,
    );
    expect(note.headline).toBe('Two visits today. One is overdue.');
    // A visit headline already states the counts, so they are never said twice.
    expect(note.visitsLine).toBeNull();
    expect(note.action).toBe('visit');
    expect(note.actionLabel).toBe('Open next visit');
  });

  it('names overdue visits when none are due today', () => {
    expect(buildMorningNote([visit('overdue')], null).headline).toBe('One visit is overdue.');
    expect(
      buildMorningNote([visit('overdue', 'a'), visit('overdue', 'b')], null).headline,
    ).toBe('Two visits are overdue.');
  });

  it('says nothing is due when only later or undated visits remain', () => {
    expect(buildMorningNote([visit('upcoming')], null).headline).toBe('Nothing due today.');
  });

  it('keeps the send state quiet under a work headline', () => {
    expect(buildMorningNote([visit('today')], 'Working offline.')).toMatchObject({
      headline: 'One visit today.',
      headlineOpensActivity: false,
      syncLine: 'Working offline.',
    });
  });

  it.each([
    ['Finish your field report', { kind: 'field_report' as const, scanRecordId: 'report-1' }],
    ['Finish your visit for CG-1', { kind: 'assignment' as const, assignmentId: 'visit-1' }],
    ['Finish your plot boundary', { kind: 'field_survey' as const, surveyId: 'plot-1' }],
  ])('offers to resume the draft described by %s', (title, destination) => {
    const draft: NeedsAttentionItem = {
      destination, id: 'draft-1', kind: 'draft', message: 'Not finished', meta: 'Saved', title,
    };
    expect(buildMorningNote([draft, visit('today')], 'Working offline.')).toEqual({
      action: 'draft', actionLabel: 'Resume', headline: title, headlineOpensActivity: false, syncLine: 'Working offline.', visitsLine: 'One visit today.',
    });
  });

  it('offers to read an office update when an actionable update comes first', () => {
    const note = buildMorningNote([READABLE_UPDATE], null);
    expect(note).toMatchObject({
      action: 'update',
      actionLabel: 'Read office update',
      headline: 'One office update to read.',
    });
  });

  it('offers a scan and says nothing when every update is unopenable', () => {
    const note = buildMorningNote([UPDATE], null);
    expect(note).toMatchObject({
      action: 'scan',
      actionLabel: 'Start a scan',
      headline: 'All clear.',
    });
  });

  it('acts on the first item that can actually be opened', () => {
    const note = buildMorningNote([UPDATE, UPLOAD, visit('today', 'a')], null);
    expect(note).toMatchObject({
      action: 'visit',
      actionLabel: 'Open next visit',
      headline: 'One visit today.',
    });
    expect(buildMorningNote([UPDATE, READABLE_UPDATE], null).action).toBe('update');
    expect(buildMorningNote([UPLOAD], null).action).toBe('scan');
  });

  it('leads with the office update the button will open', () => {
    const note = buildMorningNote([READABLE_UPDATE, visit('today', 'a')], null);
    expect(note).toMatchObject({
      action: 'update',
      actionLabel: 'Read office update',
      headline: 'One office update to read.',
    });
  });

  it('still states the visit counts once when an office update leads', () => {
    const note = buildMorningNote(
      [READABLE_UPDATE, visit('today', 'a'), visit('overdue', 'b')],
      null,
    );
    expect(note.headline).toBe('One office update to read.');
    expect(note.visitsLine).toBe('One visit today. One is overdue.');
  });

  it('states the overdue counts once under a leading office update', () => {
    const note = buildMorningNote([READABLE_UPDATE, visit('overdue', 'b')], null);
    expect(note.headline).toBe('One office update to read.');
    expect(note.visitsLine).toBe('One visit is overdue.');
  });

  it('adds no visit line when the update leads and no visit is due or overdue', () => {
    expect(buildMorningNote([READABLE_UPDATE], null).visitsLine).toBeNull();
  });

  it('leads with the visit the button will open when updates cannot be opened', () => {
    const note = buildMorningNote([UPDATE, visit('overdue', 'a')], null);
    expect(note).toMatchObject({
      action: 'visit',
      actionLabel: 'Open next visit',
      headline: 'One visit is overdue.',
    });
  });

  it('counts only the office updates that can be opened', () => {
    expect(
      buildMorningNote([READABLE_UPDATE, UPDATE, { ...READABLE_UPDATE, id: 'notification-3' }], null)
        .headline,
    ).toBe('Two office updates to read.');
  });

  it('falls back to digits beyond ten', () => {
    const many = Array.from({ length: 11 }, (_, index) => visit('today', String(index)));
    expect(buildMorningNote(many, null).headline).toBe('11 visits today.');
  });

  it('says the visit check failed instead of a false "All clear."', () => {
    expect(buildMorningNote([], null, true)).toMatchObject({
      action: 'scan',
      headline: "Couldn't check your visits.",
      headlineOpensActivity: false,
      syncLine: null,
      visitsLine: 'Nothing is lost — they will appear when the check succeeds.',
    });
  });

  it('keeps the send state under the failed visit check', () => {
    expect(buildMorningNote([], 'One report is waiting to send.', true)).toMatchObject({
      headline: "Couldn't check your visits.",
      syncLine: 'One report is waiting to send.',
    });
  });

  it('lets other work lead and notes the failed visit check quietly', () => {
    expect(buildMorningNote([READABLE_UPDATE], null, true)).toMatchObject({
      headline: 'One office update to read.',
      visitsLine: "Couldn't check your visits.",
    });
  });

  it('still says "All clear." when the visit check succeeded', () => {
    expect(buildMorningNote([], null, false).headline).toBe('All clear.');
  });
});
