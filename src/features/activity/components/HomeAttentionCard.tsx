import { Feather } from '@expo/vector-icons';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { HOME_NOTE_COPY, UNFINISHED_COPY } from '@/constants/copy';
import { Spacing, Typography } from '@/constants/theme';
import {
  HOME_ATTENTION_ROW_LIMIT,
  isActionableAttentionItem,
  type NeedsAttentionItem,
} from '@/features/activity/domain/needsAttention';
import { SYNC_TONE_COLOR } from '@/features/sync/utils/syncStatusCopy';
import { useTheme } from '@/hooks/use-theme';

export type HomeAttentionCardProps = {
  items: NeedsAttentionItem[];
  onOpenItem: (item: NeedsAttentionItem) => void;
  onSeeAll: () => void;
  total: number;
};

/**
 * Work-first Home list: what is owed today, under the Morning Note button.
 *
 * It renders nothing when there is no work waiting, so the list never becomes
 * ambient noise for a long-term inspector. Rows are plain, led by place, capped
 * well below the Activity list and hand off to Activity instead of expanding in
 * place.
 */
export function HomeAttentionCard({
  items,
  onOpenItem,
  onSeeAll,
  total,
}: HomeAttentionCardProps) {
  const theme = useTheme();

  if (total === 0) return null;

  const drafts = items.filter((item) => item.kind === 'draft');
  const upcoming = items.filter((item) => item.kind !== 'draft');
  const visible = upcoming.slice(0, HOME_ATTENTION_ROW_LIMIT);
  const upcomingTotal = total - drafts.length;

  return (
    <View accessibilityLiveRegion="polite" style={styles.list} testID="home.needs-attention">
      {drafts.length > 0 ? (
        <View testID="home.unfinished">
          <Text style={[styles.heading, { color: theme.textSecondary }]}>{UNFINISHED_COPY.heading}</Text>
          {drafts.map((item, index) => (
            <AttentionRow index={index} item={item} key={item.id} onOpen={onOpenItem} />
          ))}
        </View>
      ) : null}
      {upcoming.length > 0 ? (
        <View testID="home.up-next">
          <Text style={[styles.heading, { color: theme.textSecondary }]}>{HOME_NOTE_COPY.upNext}</Text>
          {visible.map((item, index) => (
            <AttentionRow index={index} item={item} key={item.id} onOpen={onOpenItem} />
          ))}
        </View>
      ) : null}

      {upcomingTotal > visible.length ? (
        <Pressable
          accessibilityLabel={`See all ${upcomingTotal} attention items in Activity`}
          accessibilityRole="button"
          onPress={onSeeAll}
          style={({ pressed }) => [
            styles.more,
            { borderTopColor: theme.divider },
            pressed && styles.pressed,
          ]}
          testID="home.needs-attention.see-all">
          <Text style={[styles.moreText, { color: theme.primary }]}>
            See all {upcomingTotal} in Activity
          </Text>
          <Feather name="chevron-right" size={16} color={theme.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * One attention row, led by the place for a visit. Memoized so a Home re-render
 * that does not change the prepared items or the open handler cannot re-render
 * every row: the item is a stable object from the memoized attention build, and
 * `onOpen` is the screen's memoized handler, which takes the item as an argument
 * instead of closing over it.
 */
const AttentionRow = memo(function AttentionRow({
  index,
  item,
  onOpen,
}: {
  index: number;
  item: NeedsAttentionItem;
  onOpen: (item: NeedsAttentionItem) => void;
}) {
  const theme = useTheme();
  const actionable = isActionableAttentionItem(item);
  const isDraft = item.kind === 'draft';
  const supporting = isDraft ? item.place : item.place ? item.referenceCode : item.meta;
  // The one meta line carries the tone: ordinary work whispers, an overdue visit
  // or an unsent report is a note.
  const metaColor = theme[SYNC_TONE_COLOR[item.tone ?? 'whisper']];

  return (
    <Pressable
      accessibilityLabel={isDraft ? `${item.title}. ${item.meta}` : `${item.title}. ${item.message}. ${item.meta}`}
      accessibilityRole={actionable ? 'button' : 'text'}
      accessibilityState={{ disabled: !actionable }}
      disabled={!actionable}
      onPress={() => onOpen(item)}
      testID={`home.attention.${item.id}`}
      style={({ pressed }) => [
        styles.row,
        index === 0 ? null : { borderTopColor: theme.divider, borderTopWidth: StyleSheet.hairlineWidth },
        pressed && actionable ? styles.pressed : null,
      ]}>
      <View style={styles.copy}>
        <Text numberOfLines={2} style={[styles.lead, { color: theme.text }]}>
          {isDraft ? item.title : item.place ?? item.title}
        </Text>
        <Text numberOfLines={2} style={[styles.detail, { color: item.place || isDraft ? metaColor : theme.textSecondary }]}>
          {isDraft ? item.meta : item.place ? item.meta : item.message}
        </Text>
        {supporting ? (
          <Text numberOfLines={2} style={[styles.supporting, { color: item.place || isDraft ? theme.textSecondary : metaColor }]}>
            {supporting}
          </Text>
        ) : null}
      </View>
      {actionable ? (
        <Feather name="chevron-right" size={18} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  list: { gap: Spacing.xs },
  heading: { ...Typography.label },
  row: {
    minHeight: 56,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  copy: { flex: 1, gap: Spacing.xs },
  lead: { ...Typography.body, fontWeight: '500' },
  detail: { ...Typography.bodySmall },
  supporting: { ...Typography.caption },
  more: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  moreText: { ...Typography.bodySmall, fontWeight: '500' },
  pressed: { opacity: 0.72 },
});
