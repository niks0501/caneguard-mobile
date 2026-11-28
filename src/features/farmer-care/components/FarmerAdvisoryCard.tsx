import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import { FARMER_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useFarmerCare, useHomeBarangay } from '@/features/farmer-care/hooks/useFarmerCare';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatDateTime } from '@/lib/formatters';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

/**
 * Home, farmer only: guidance the office published for the farmer's barangay,
 * readable offline, or a gentle prompt to set the barangay. Shows nothing
 * when there is nothing to say, so an empty office never nags.
 */
export function FarmerAdvisoryCard() {
  const theme = useTheme();
  const { language } = useLanguagePreference();
  const copy = FARMER_COPY[language].care.advisories;
  const { advisories, isFarmer, lastAdvisoryRefreshedAt, refreshingAdvisories, syncNow } = useFarmerCare();
  const home = useHomeBarangay();
  const [openId, setOpenId] = useState<string | null>(null);
  if (!isFarmer || !home.loaded) return null;

  if (advisories.length === 0) {
    return home.barangay ? null : (
      <View
        testID="farmer-care.advisories.set-barangay"
        style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
        <Text style={[styles.body, { color: theme.textSecondary }]}>{copy.setBarangay}</Text>
        <AppButton variant="secondary" onPress={() => router.push('/settings')}>
          {copy.setBarangayAction}
        </AppButton>
      </View>
    );
  }

  const freshnessText = lastAdvisoryRefreshedAt
    ? copy.updatedAt(formatDateTime(lastAdvisoryRefreshedAt))
    : null;

  return (
    <View
      testID="farmer-care.advisories"
      style={[styles.card, { backgroundColor: theme.warningBg, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>
            {copy.heading}
            {home.barangay ? ` · ${home.barangay}` : ''}
          </Text>
          {freshnessText ? (
            <Text
              testID="farmer-care.advisories.freshness"
              style={[styles.meta, { color: theme.textSecondary }]}>
              {freshnessText}
            </Text>
          ) : null}
        </View>
        {typeof syncNow === 'function' ? (
          <Pressable
            testID="farmer-care.advisories.refresh"
            accessibilityRole="button"
            accessibilityState={{ disabled: refreshingAdvisories }}
            disabled={refreshingAdvisories}
            onPress={() => void syncNow({ refreshAdvisories: true, forceAdvisories: true })}
            style={({ pressed }) => [
              styles.refreshButton,
              {
                borderColor: theme.border,
                backgroundColor: theme.surfaceElevated,
                opacity: refreshingAdvisories ? 0.6 : pressed ? 0.8 : 1,
              },
            ]}>
            <Text style={[styles.refreshText, { color: theme.primaryDark }]}>
              {refreshingAdvisories ? copy.refreshing : copy.refresh}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {advisories.map((item) => {
        const headline = language === 'tl' ? item.headlineTl : item.headlineEn;
        const body = language === 'tl' ? item.bodyTl : item.bodyEn;
        const open = openId === item.remoteId;
        const publishedLabel = formatDate(item.publishedAt);
        const expiresLabel = formatDate(item.expiresAt);
        const datesText = publishedLabel && expiresLabel ? copy.dates(publishedLabel, expiresLabel) : null;
        return (
          <View key={item.remoteId} style={styles.item}>
            <Pressable
              testID={`farmer-care.advisory.${item.remoteId}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpenId(open ? null : item.remoteId)}>
              <Text style={[styles.headline, { color: theme.text }]}>{headline}</Text>
              {datesText ? (
                <Text
                  testID={`farmer-care.advisory.${item.remoteId}.dates`}
                  style={[styles.meta, { color: theme.textSecondary }]}>
                  {datesText}
                </Text>
              ) : null}
              <Text style={[styles.toggle, { color: theme.primaryDark }]}>{open ? copy.close : copy.open}</Text>
            </Pressable>
            {open ? <Text style={[styles.body, { color: theme.text }]}>{body}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  headerText: { flex: 1, gap: 2 },
  heading: { ...Typography.subheading },
  refreshButton: {
    minHeight: 36,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshText: { ...Typography.label },
  item: { gap: Spacing.xs },
  headline: { ...Typography.body, fontWeight: '600' },
  meta: { ...Typography.caption },
  toggle: { ...Typography.label },
  body: { ...Typography.body },
});
