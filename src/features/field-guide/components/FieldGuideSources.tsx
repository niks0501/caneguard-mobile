import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  FIELD_GUIDE_SOURCE_AWAITING_SUPPLY,
  FIELD_GUIDE_SOURCE_AWAITING_SUPPLY_NOTE,
  FIELD_GUIDE_SOURCE_INTERNET_REQUIRED,
  FIELD_GUIDE_SOURCE_OPEN_FAILED,
  FIELD_GUIDE_SOURCE_OPEN_LABEL,
} from '@/constants/copy';
import { Spacing, Typography } from '@/constants/theme';
import type {
  FieldGuideSource,
  FieldGuideSourceId,
} from '@/features/field-guide/domain/fieldGuideTypes';
import { sourcesForEntry } from '@/features/field-guide/constants/fieldGuideSources';
import { useTheme } from '@/hooks/use-theme';

export type FieldGuideSourcesProps = {
  sourceIds: readonly FieldGuideSourceId[];
  testID?: string;
};

function sourceMeta(source: FieldGuideSource): string {
  return [source.publisher, source.publishedDate, source.passage]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
}

/**
 * Read-only citation list for one entry or one guide chapter.
 *
 * A published source keeps its URL as readable text so the citation still
 * works with no internet; opening the browser is optional and reports failure
 * inline. A document the office has not supplied yet is shown as such — the
 * gallery never invents a page reference or a dead link to fill the gap.
 */
export function FieldGuideSources({ sourceIds, testID }: FieldGuideSourcesProps) {
  const theme = useTheme();
  const [failedId, setFailedId] = useState<FieldGuideSourceId | null>(null);

  const sources = sourcesForEntry(sourceIds);

  if (sources.length === 0) {
    return null;
  }

  return (
    <View style={styles.list} testID={testID}>
      {sources.map((source) => (
        <View
          key={source.id}
          style={[styles.item, { borderColor: theme.border }]}
          testID={testID ? `${testID}.${source.id}` : undefined}>
          <Text style={[styles.title, { color: theme.text }]}>{source.title}</Text>
          <Text style={[styles.meta, { color: theme.textSecondary }]}>{sourceMeta(source)}</Text>
          <Text style={[styles.supports, { color: theme.text }]}>{source.supports}</Text>

          {source.availability === 'awaiting-supply' ? (
            <View style={styles.missingRow}>
              <Feather name="clock" size={14} color={theme.warning} />
              <Text style={[styles.missingLabel, { color: theme.warning }]}>
                {FIELD_GUIDE_SOURCE_AWAITING_SUPPLY}
              </Text>
            </View>
          ) : source.url ? (
            <>
              <Text selectable style={[styles.url, { color: theme.textSecondary }]}>
                {source.url}
              </Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`${FIELD_GUIDE_SOURCE_OPEN_LABEL}. ${FIELD_GUIDE_SOURCE_INTERNET_REQUIRED}`}
                hitSlop={8}
                onPress={() => {
                  setFailedId(null);
                  void Linking.openURL(source.url as string).catch(() => setFailedId(source.id));
                }}
                style={({ pressed }) => [styles.openRow, pressed && styles.pressed]}>
                <Feather name="external-link" size={14} color={theme.primary} />
                <Text style={[styles.openLabel, { color: theme.primary }]}>
                  {FIELD_GUIDE_SOURCE_OPEN_LABEL}
                </Text>
              </Pressable>
              <Text style={[styles.meta, { color: theme.textSecondary }]}>
                {FIELD_GUIDE_SOURCE_INTERNET_REQUIRED}
              </Text>
            </>
          ) : null}

          {source.availability === 'awaiting-supply' ? (
            <Text style={[styles.meta, { color: theme.textSecondary }]}>
              {FIELD_GUIDE_SOURCE_AWAITING_SUPPLY_NOTE}
            </Text>
          ) : null}

          {failedId === source.id ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.failed, { color: theme.danger }]}
              testID={testID ? `${testID}.${source.id}.open-failed` : undefined}>
              {FIELD_GUIDE_SOURCE_OPEN_FAILED}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
  item: {
    borderTopWidth: 1,
    paddingTop: Spacing.md,
    gap: Spacing.xs,
  },
  title: { ...Typography.bodySmall, fontWeight: '800' },
  meta: { ...Typography.caption },
  supports: { ...Typography.caption },
  url: { ...Typography.caption },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  missingLabel: { ...Typography.caption, fontWeight: '800' },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 44,
  },
  openLabel: { ...Typography.caption, fontWeight: '800' },
  failed: { ...Typography.caption },
  pressed: { opacity: 0.7 },
});
