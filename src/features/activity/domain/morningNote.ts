import { HOME_NOTE_COPY } from '@/constants/copy';
import {
  isActionableAttentionItem,
  type NeedsAttentionItem,
} from '@/features/activity/domain/needsAttention';

export type MorningNoteAction = 'draft' | 'visit' | 'update' | 'scan';

export interface MorningNote {
  /** What the single Home button does and says. */
  action: MorningNoteAction;
  actionLabel: string;
  /** The one sentence (or two short ones) Home leads with. */
  headline: string | null;
  /** True when the headline is the send state, so Home makes it the Activity shortcut. */
  headlineOpensActivity: boolean;
  /** Send state shown quietly under a work headline; null when the headline already says it. */
  syncLine: string | null;
  /** Visit counts shown quietly under the headline when it leads with other work; null otherwise. */
  visitsLine: string | null;
}

const COUNT_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];

function countWord(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

/**
 * The one sentence that states the visits due today and overdue, or null when
 * neither exists.
 */
function visitCountsSentence(items: readonly NeedsAttentionItem[]): string | null {
  const visits = items.filter(
    (item) => isActionableAttentionItem(item) && item.kind === 'assignment',
  );
  const dueToday = visits.filter((item) => item.bucket === 'today').length;
  const overdue = visits.filter((item) => item.bucket === 'overdue').length;
  if (dueToday > 0) {
    return [
      HOME_NOTE_COPY.visitsToday(countWord(dueToday)),
      overdue > 0 ? HOME_NOTE_COPY.alsoOverdue(countWord(overdue)) : null,
    ]
      .filter(Boolean)
      .join(' ');
  }
  return overdue > 0 ? HOME_NOTE_COPY.visitsOverdue(countWord(overdue)) : null;
}

/**
 * Chooses the Home sentence and button from the same work the attention list
 * shows, in the same work-first order: unfinished drafts, then visits, then
 * office updates, then the send state, then "All clear.". Only work that can be
 * opened here counts, and the first such item decides both the button and the
 * sentence that leads, so the two never disagree. Pure, so each state can be
 * pinned in a test.
 */
export function buildMorningNote(
  items: readonly NeedsAttentionItem[],
  syncNote: string | null,
  visitsCheckFailed = false,
  visitsCheckPending = false,
  visitsUnavailable = false,
): MorningNote {
  const work = items.filter(isActionableAttentionItem);
  const primary = work[0];
  const updates = work.filter((item) => item.kind === 'notification');
  const visitCounts = visitCountsSentence(items);
  const action: MorningNoteAction = !primary
    ? 'scan'
    : primary.kind === 'draft'
      ? 'draft'
      : primary.kind === 'notification'
        ? 'update'
        : 'visit';
  const actionLabel = {
    draft: HOME_NOTE_COPY.resumeDraft,
    scan: HOME_NOTE_COPY.startScan,
    update: HOME_NOTE_COPY.readOfficeUpdate,
    visit: HOME_NOTE_COPY.openNextVisit,
  }[action];

  let headline: string | null = null;
  if (action === 'draft' && primary) {
    headline = primary.title;
  } else if (action === 'update') {
    headline = HOME_NOTE_COPY.officeUpdates(countWord(updates.length));
  } else if (action === 'visit') {
    headline = visitCounts ?? HOME_NOTE_COPY.nothingDueToday;
  }
  if (visitsCheckFailed && !headline) {
    return {
      action,
      actionLabel,
      headline: HOME_NOTE_COPY.visitsCheckFailed,
      headlineOpensActivity: false,
      syncLine: syncNote,
      visitsLine: HOME_NOTE_COPY.visitsCheckFailedDetail,
    };
  }

  const visitsLine = action === 'visit' ? null : visitCounts;

  if (headline) {
    return {
      action,
      actionLabel,
      headline,
      headlineOpensActivity: false,
      syncLine: syncNote,
      visitsLine,
    };
  }
  if (syncNote) {
    return {
      action,
      actionLabel,
      headline: syncNote,
      headlineOpensActivity: true,
      syncLine: null,
      visitsLine,
    };
  }

  return {
    action,
    actionLabel,
    headline: visitsCheckPending
      ? HOME_NOTE_COPY.visitsCheckPending
      : visitsUnavailable
        ? null
        : HOME_NOTE_COPY.allClear,
    headlineOpensActivity: false,
    syncLine: null,
    visitsLine,
  };
}
