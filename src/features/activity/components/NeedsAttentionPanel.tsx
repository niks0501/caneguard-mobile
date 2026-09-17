import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  NEEDS_ATTENTION_ROW_LIMIT,
  type NeedsAttentionItem,
  type NeedsAttentionSummary,
} from '@/features/activity/domain/needsAttention';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const KIND_ICONS: Record<
  NeedsAttentionSummary['items'][number]['kind'],
  keyof typeof Feather.glyphMap
> = {
  assignment: 'clipboard',
  notification: 'bell',
  upload: 'upload-cloud',
};

export function NeedsAttentionPanel({
  expanded,
  onOpenItem,
  onToggleExpanded,
  summary,
}: {
  expanded: boolean;
  onOpenItem: (item: NeedsAttentionItem) => void;
  onToggleExpanded: () => void;
  summary: NeedsAttentionSummary;
}) {
  const theme = useTheme();
  const visible = expanded
    ? summary.items
    : summary.items.slice(0, NEEDS_ATTENTION_ROW_LIMIT);

  return (
    <View testID="activity.needs-attention" style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primaryDark }]}>Needs attention</Text>
        {summary.total > 0 ? (
          <View style={[styles.count, { backgroundColor: theme.primary }]}>
            <Text
              accessibilityLabel={`${summary.total} attention ${summary.total === 1 ? 'item' : 'items'}`}
              style={[styles.countText, { color: theme.background }]}>
              {summary.total}
            </Text>
          </View>
        ) : null}
      </View>

      {summary.total === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>
          Nothing needs your attention right now. New assignments, office updates,
          and report uploads appear here.
        </Text>
      ) : (
        <View>
          {visible.map((item, index) => {
            const actionable = Boolean(item.destination && item.destination.kind !== 'unavailable');
            const content = (
              <>
                <View style={[styles.icon, { backgroundColor: theme.surfaceMuted }]}>
                  <Feather name={KIND_ICONS[item.kind]} size={17} color={theme.primary} />
                </View>
                <View style={styles.copy}>
                  <Text style={[styles.itemTitle, { color: theme.primaryDark }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.itemMessage, { color: theme.textSecondary }]} numberOfLines={2}>
                    {item.message}
                  </Text>
                  <Text style={[styles.itemMeta, { color: theme.textSecondary }]}>{item.meta}</Text>
                </View>
                {actionable ? (
                  <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                ) : null}
              </>
            );

            return (
              <Pressable
                key={item.id}
                testID={`activity.attention.${item.id}`}
                accessibilityRole={actionable ? 'button' : 'text'}
                accessibilityLabel={item.title}
                disabled={!actionable}
                onPress={() => onOpenItem(item)}
                style={({ pressed }) => [
                  styles.row,
                  {
                    borderTopColor: theme.divider,
                    borderTopWidth: index === 0 ? 0 : 1,
                  },
                  pressed && actionable ? styles.pressed : null,
                ]}>
                {content}
              </Pressable>
            );
          })}

          {expanded && summary.total > NEEDS_ATTENTION_ROW_LIMIT ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show fewer attention items"
              onPress={onToggleExpanded}
              style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
              <Text style={[styles.moreText, { color: theme.primary }]}>Show fewer</Text>
              <Feather name="chevron-up" size={16} color={theme.primary} />
            </Pressable>
          ) : null}
          {!expanded && summary.total > NEEDS_ATTENTION_ROW_LIMIT ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Show all ${summary.total} attention items`}
              onPress={onToggleExpanded}
              style={({ pressed }) => [styles.more, pressed && styles.pressed]}>
              <Text style={[styles.moreText, { color: theme.primary }]}>
                Show all {summary.total}
              </Text>
              <Feather name="chevron-down" size={16} color={theme.primary} />
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.subheading, flex: 1 },
  count: {
    minWidth: 24,
    height: 24,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  countText: { ...Typography.caption, fontWeight: '800' },
  empty: { ...Typography.bodySmall },
  row: {
    minHeight: 56,
    paddingVertical: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: Spacing.xs },
  itemTitle: { ...Typography.bodySmall, fontWeight: '800' },
  itemMessage: { ...Typography.caption },
  itemMeta: { ...Typography.caption, fontWeight: '700' },
  more: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  moreText: { ...Typography.caption, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
