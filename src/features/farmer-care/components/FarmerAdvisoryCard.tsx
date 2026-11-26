import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/ui/AppButton';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useFarmerCare, useHomeBarangay } from '@/features/farmer-care/hooks/useFarmerCare';
import { useTheme } from '@/hooks/use-theme';
import { FARMER_COPY } from '@/constants/copy';
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
  const { advisories, isFarmer } = useFarmerCare();
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

  return (
    <View
      testID="farmer-care.advisories"
      style={[styles.card, { backgroundColor: theme.warningBg, borderColor: theme.border }]}>
      <Text accessibilityRole="header" style={[styles.heading, { color: theme.text }]}>
        {copy.heading}
        {home.barangay ? ` · ${home.barangay}` : ''}
      </Text>
      {advisories.map((item) => {
        const headline = language === 'tl' ? item.headlineTl : item.headlineEn;
        const body = language === 'tl' ? item.bodyTl : item.bodyEn;
        const open = openId === item.remoteId;
        return (
          <View key={item.remoteId} style={styles.item}>
            <Pressable
              testID={`farmer-care.advisory.${item.remoteId}`}
              accessibilityRole="button"
              accessibilityState={{ expanded: open }}
              onPress={() => setOpenId(open ? null : item.remoteId)}>
              <Text style={[styles.headline, { color: theme.text }]}>{headline}</Text>
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
  heading: { ...Typography.subheading },
  item: { gap: Spacing.xs },
  headline: { ...Typography.body, fontWeight: '600' },
  toggle: { ...Typography.label },
  body: { ...Typography.body },
});
