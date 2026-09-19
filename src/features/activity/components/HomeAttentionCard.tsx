import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  HOME_ATTENTION_ROW_LIMIT,
  type NeedsAttentionItem,
  type NeedsAttentionKind,
} from '@/features/activity/domain/needsAttention';
import { useTheme } from '@/hooks/use-theme';

const KIND_ICONS: Record<NeedsAttentionKind, keyof typeof Feather.glyphMap> = {
  assignment: 'clipboard',
  notification: 'bell',
  upload: 'upload-cloud',
};

export type HomeAttentionCardProps = {
  items: NeedsAttentionItem[];
  onOpenItem: (item: NeedsAttentionItem) => void;
  onSeeAll: () => void;
  total: number;
};

/**
 * Work-first Home card: what is owed today, above the capture action.
 *
 * It renders nothing when there is no work waiting, so the card never becomes
 * ambient noise for a long-term inspector. Rows are capped well below the
 * Activity panel and hand off to Activity instead of expanding in place.
 */
export function HomeAttentionCard({
  items,
  onOpenItem,
  onSeeAll,
  total,
}: HomeAttentionCardProps) {
  const theme = useTheme();

  if (total === 0) return null;

  const visible = items.slice(0, HOME_ATTENTION_ROW_LIMIT);

  return (
    <Card
      accessibilityLiveRegion="polite"
      style={styles.card}
      testID="home.needs-attention"
      variant="elevated">
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.primaryDark }]}>Needs attention</Text>
        <View style={[styles.count, { backgroundColor: theme.primary }]}>
          <Text
            accessibilityLabel={`${total} attention ${total === 1 ? 'item' : 'items'}`}
            style={[styles.countText, { color: theme.background }]}>
            {total}
          </Text>
        </View>
      </View>

      <View>
        {visible.map((item, index) => {
          const actionable = Boolean(
            item.destination && item.destination.kind !== 'unavailable',
          );
          return (
            <Pressable
              key={item.id}
              accessibilityLabel={`${item.title}. ${item.message}. ${item.meta}`}
              accessibilityRole={actionable ? 'button' : 'text'}
              accessibilityState={{ disabled: !actionable }}
              disabled={!actionable}
              onPress={() => onOpenItem(item)}
              testID={`home.attention.${item.id}`}
              style={({ pressed }) => [
                styles.row,
                index === 0
                  ? null
                  : { borderTopColor: theme.divider, borderTopWidth: 1 },
                pressed && actionable ? styles.pressed : null,
              ]}>
              <View style={[styles.icon, { backgroundColor: theme.surfaceMuted }]}>
                <Feather name={KIND_ICONS[item.kind]} size={16} color={theme.primary} />
              </View>
              <View style={styles.copy}>
                <Text
                  numberOfLines={2}
                  style={[styles.itemTitle, { color: theme.primaryDark }]}>
                  {item.title}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.itemMessage, { color: theme.textSecondary }]}>
                  {item.message}
                </Text>
                <Text style={[styles.itemMeta, { color: theme.warning }]}>{item.meta}</Text>
              </View>
              {actionable ? (
                <Feather name="chevron-right" size={18} color={theme.textSecondary} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {total > visible.length ? (
        <Pressable
          accessibilityLabel={`See all ${total} attention items in Activity`}
          accessibilityRole="button"
          onPress={onSeeAll}
          style={({ pressed }) => [
            styles.more,
            { borderTopColor: theme.divider },
            pressed && styles.pressed,
          ]}
          testID="home.needs-attention.see-all">
          <Text style={[styles.moreText, { color: theme.primary }]}>
            See all {total} in Activity
          </Text>
          <Feather name="chevron-right" size={16} color={theme.primary} />
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.sm },
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
  row: {
    minHeight: 48,
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
    borderTopWidth: 1,
  },
  moreText: { ...Typography.caption, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
