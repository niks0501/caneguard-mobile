import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ComponentTokens, Radius, Spacing, Typography } from '@/constants/theme';
import { findFieldGuideEntry } from '@/features/field-guide/constants/fieldGuideEntries';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

interface WhatNowCardProps {
  /** Predicted label; it is also the Field Guide entry id. */
  label: string;
  saved: boolean;
  saving?: boolean;
  /** Needed while the scan is unsaved; a saved scan shows "Saved" instead. */
  onSave?: () => void;
  /** Shown only once the scan is saved. */
  onCheckAgain?: () => void;
}

/**
 * Farmer-only "What now?" card. Links only: no treatment text lives here, and
 * management advice stays behind the Field Guide link.
 */
export function WhatNowCard({ label, saved, saving, onSave, onCheckAgain }: WhatNowCardProps) {
  const theme = useTheme();
  const copy = useFarmerCopy().whatNow;
  const entry = findFieldGuideEntry(label as Parameters<typeof findFieldGuideEntry>[0]);
  const hasPhotos = Boolean(entry?.images.some((image) => typeof image.source !== 'string'));

  return (
    <View
      testID="scan.what-now"
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <Text accessibilityRole="header" style={[styles.title, { color: theme.primaryDark }]}>
        {copy.title}
      </Text>
      <AppButton
        testID="scan.what-now.check-signs"
        variant="secondary"
        leadingIcon="book-open"
        onPress={() => router.push(`/field-guide/${label}`)}>
        {copy.checkSigns}
      </AppButton>
      <AppButton
        testID="scan.what-now.compare-photos"
        variant="secondary"
        leadingIcon="image"
        onPress={() =>
          router.push(hasPhotos ? `/field-guide/${label}/photo?index=0` : `/field-guide/${label}`)
        }>
        {copy.comparePhotos}
      </AppButton>
      {saved ? (
        <>
          <View testID="scan.what-now.saved" style={styles.savedRow}>
            <Text style={[styles.savedText, { color: theme.success }]}>{copy.saved}</Text>
          </View>
          {onCheckAgain ? (
            <AppButton
              testID="records.check-again"
              variant="secondary"
              leadingIcon="camera"
              onPress={onCheckAgain}>
              {copy.checkAgain}
            </AppButton>
          ) : null}
        </>
      ) : (
        <AppButton
          testID="scan.what-now.save"
          leadingIcon="save"
          busy={saving}
          disabled={saving || !onSave}
          onPress={() => onSave?.()}>
          {saving ? copy.saving : copy.saveScan}
        </AppButton>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: ComponentTokens.screen.horizontalPadding,
    gap: Spacing.sm,
  },
  title: { ...Typography.subheading },
  savedRow: { paddingVertical: Spacing.xs },
  savedText: { ...Typography.bodySmall, fontWeight: '600' },
});
