import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ImagePreviewScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <ScreenHeader title="Image Preview" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.content}>
            <AppCard style={styles.imageCard}>
              <View style={[styles.imagePlaceholder, { backgroundColor: theme.surfaceMuted, borderColor: theme.border }]}>
                <Feather name="image" size={48} color={theme.textSecondary} />
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
  statusText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  actions: {
    gap: Spacing.md,
  },
});
