import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ComponentTokens, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ImagePreviewScreen() {
  const theme = useTheme();

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Image Preview</Text>
      </View>

      <AppCard style={styles.imageCard}>
        <View style={[styles.imagePlaceholder, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
          <Text style={[styles.placeholderIcon, { color: theme.textSecondary }]}>{'[ Photo ]'}</Text>
        </View>
        <Text style={[styles.statusText, { color: theme.textSecondary }]}>
          Image ready for symptom checking
        </Text>
      </AppCard>

      <View style={styles.actions}>
        <AppButton
          variant="secondary"
          onPress={() => router.back()}
          accessibilityLabel="Retake or replace image">
          Retake / Replace Image
        </AppButton>
        <AppButton onPress={() => router.push('/symptom-checklist')} accessibilityLabel="Continue to symptom checklist">
          Continue
        </AppButton>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: ComponentTokens.screen.sectionGap,
  },
  header: {
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.heading,
  },
  imageCard: {
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    ...Typography.subheading,
  },
  statusText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.md,
  },
});
