import { HOME_NOTE_COPY } from '@/constants/copy';
import {
  isActionableAttentionItem,
  type NeedsAttentionItem,
} from '@/features/activity/domain/needsAttention';

export type MorningNoteAction = 'visit' | 'update' | 'scan';

export interface MorningNote {
  /** What the single Home button does and says. */
  action: MorningNoteAction;
  actionLabel: string;
  /** The one sentence (or two short ones) Home leads with. */
  headline: string;
  /** Send state shown quietly under a work headline; null when the headline already says it. */
  syncLine: string | null;
}

const COUNT_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

function countWord(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

/**
 * Chooses the Home sentence and button from the same work the old Home card
 * showed, in the same work-first order: visits, then office updates, then the
 * send state, then "All clear.". Only work that can be opened here counts, and
 * the first such item decides both the button and the sentence that leads, so
 * the two never disagree. Pure, so each state can be pinned in a test.
 */
export function buildMorningNote(
  items: readonly NeedsAttentionItem[],
  syncNote: string | null,
): MorningNote {
  const work = items.filter(isActionableAttentionItem);
  const primary = work[0];
  const visits = work.filter((item) => item.kind === 'assignment');
  const updates = work.filter((item) => item.kind === 'notification');
  const dueToday = visits.filter((item) => item.bucket === 'today').length;
  const overdue = visits.filter((item) => item.bucket === 'overdue').length;
  const action: MorningNoteAction = !primary
    ? 'scan'
    : primary.kind === 'notification'
      ? 'update'
      : 'visit';
  const actionLabel = {
    scan: HOME_NOTE_COPY.startScan,
    update: HOME_NOTE_COPY.readOfficeUpdate,
    visit: HOME_NOTE_COPY.openNextVisit,
  }[action];

  let headline: string | null = null;
  if (action === 'update') {
    headline = HOME_NOTE_COPY.officeUpdates(countWord(updates.length));
  } else if (action === 'visit') {
    if (dueToday > 0) {
      headline = [
        HOME_NOTE_COPY.visitsToday(countWord(dueToday)),
        overdue > 0 ? HOME_NOTE_COPY.alsoOverdue(countWord(overdue)) : null,
      ]
        .filter(Boolean)
        .join(' ');
    } else if (overdue > 0) {
      headline = HOME_NOTE_COPY.visitsOverdue(countWord(overdue));
    } else {
      headline = HOME_NOTE_COPY.nothingDueToday;
    }
  }

  if (headline) {
    return { action, actionLabel, headline, syncLine: syncNote };
  }
  return { action, actionLabel, headline: syncNote ?? HOME_NOTE_COPY.allClear, syncLine: null };
}
