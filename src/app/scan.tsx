import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ScanScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <ScreenHeader title="Scan Sugarcane" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.content}>
            <Text style={[styles.instruction, { color: theme.textSecondary }]}>
              Capture or upload a clear image of the affected sugarcane part.
            </Text>

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
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.lg,
    gap: ComponentTokens.screen.sectionGap,
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
