import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ComponentTokens, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ScanScreen() {
  const theme = useTheme();

  return (
    <ScreenContainer contentStyle={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Scan Sugarcane</Text>
        <Text style={[styles.instruction, { color: theme.textSecondary }]}>
          Capture or upload a clear image of the affected sugarcane part.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton onPress={() => router.push('/image-preview')} accessibilityLabel="Upload image from gallery">
          Upload Image
        </AppButton>
        <AppButton
          variant="secondary"
          onPress={() => router.push('/image-preview')}
          accessibilityLabel="Capture photo with camera">
          Capture Photo
        </AppButton>
      </View>

      <AppCard>
        <Text style={[styles.guideTitle, { color: theme.text }]}>Photo quality guide</Text>
        <View style={styles.guideList}>
          <Text style={[styles.guideItem, { color: theme.textSecondary }]}>
            {'\u2022'} Keep the symptom clear and focused
          </Text>
          <Text style={[styles.guideItem, { color: theme.textSecondary }]}>
            {'\u2022'} Avoid dark or blurry images
          </Text>
          <Text style={[styles.guideItem, { color: theme.textSecondary }]}>
            {'\u2022'} Capture the affected leaf, stalk, or central shoot
          </Text>
        </View>
      </AppCard>

      <View style={[styles.reminderBox, { backgroundColor: theme.warningBg, borderColor: theme.warning }]}>
        <Text style={[styles.reminderText, { color: theme.text }]}>
          CaneGuard provides possible disease detection only and does not replace expert validation.
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: ComponentTokens.screen.sectionGap,
  },
  header: {
    gap: Spacing.sm,
    paddingTop: Spacing.lg,
  },
  title: {
    ...Typography.heading,
  },
  instruction: {
    ...Typography.body,
  },
  actions: {
    gap: Spacing.md,
  },
  guideTitle: {
    ...Typography.subheading,
    marginBottom: Spacing.sm,
  },
  guideList: {
    gap: Spacing.xs,
  },
  guideItem: {
    ...Typography.bodySmall,
  },
  reminderBox: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  reminderText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
