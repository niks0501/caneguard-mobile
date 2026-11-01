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

describe('buildMorningNote', () => {
  it('says all clear and offers a scan when nothing is waiting', () => {
    expect(buildMorningNote([], null)).toEqual({
      action: 'scan',
      actionLabel: 'Start a scan',
      headline: 'All clear.',
      syncLine: null,
    });
  });

  it('uses the send state as the headline when there is no work', () => {
    expect(buildMorningNote([], 'Working offline.')).toMatchObject({
      headline: 'Working offline.',
      syncLine: null,
    });
  });

  it('counts visits due today and overdue separately', () => {
    const note = buildMorningNote(
      [visit('overdue'), visit('today', 'a'), visit('today', 'b')],
      null,
    );
    expect(note.headline).toBe('Two visits today. One is overdue.');
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
      syncLine: 'Working offline.',
    });
  });

  it('offers to read an office update when it is the first item', () => {
    const note = buildMorningNote([UPDATE], null);
    expect(note).toMatchObject({
      action: 'update',
      actionLabel: 'Read office update',
      headline: 'One office update to read.',
    });
  });

  it('falls back to digits beyond ten', () => {
    const many = Array.from({ length: 11 }, (_, index) => visit('today', String(index)));
    expect(buildMorningNote(many, null).headline).toBe('11 visits today.');
  });
});
