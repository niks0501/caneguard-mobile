import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ComponentTokens, Layout, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ScanScreen() {
  const theme = useTheme();
  const openPreview = () => router.push('/image-preview');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Scan Sugarcane" />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text style={[styles.intro, { color: theme.textSecondary }]}>Add a clear photo of the affected leaf, stalk, or central shoot.</Text>
            <View style={[styles.uploadCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <View style={[styles.dropZone, { backgroundColor: theme.backgroundElement, borderColor: theme.primaryLight }]}>
                <ExpoImage accessible={false} contentFit="contain" pointerEvents="none" source={require('../../assets/svg/scan-empty-state.svg')} style={styles.emptyArtwork} />
                <Text style={[styles.uploadTitle, { color: theme.primaryDark }]}>No image added yet</Text>
                <Text style={[styles.uploadText, { color: theme.textSecondary }]}>Use a well-lit, focused photo for a more helpful result.</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <AppButton onPress={openPreview} leadingIcon="upload" trailingIcon="arrow-right" accessibilityLabel="Upload image from gallery">Upload Image</AppButton>
              <AppButton variant="secondary" onPress={openPreview} leadingIcon="camera" trailingIcon="arrow-right" accessibilityLabel="Capture photo with camera">Capture Photo</AppButton>
            </View>
            <View style={[styles.guide, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
              <View style={styles.guideHeading}><View style={[styles.guideIcon, { backgroundColor: theme.warningBg }]}><Feather name="feather" size={18} color={theme.accentDark} /></View><Text style={[styles.guideTitle, { color: theme.primaryDark }]}>Photo quality guide</Text></View>
              {['Keep the symptom clear and focused', 'Avoid dark, blurry, or distant images', 'Capture the affected leaf, stalk, or shoot'].map((item) => <View key={item} style={styles.guideRow}><View style={[styles.bullet, { backgroundColor: theme.accentDark }]} /><Text style={[styles.guideText, { color: theme.textSecondary }]}>{item}</Text></View>)}
            </View>
            <View style={[styles.disclaimer, { backgroundColor: theme.warningBg, borderColor: theme.accent }]}><ExpoImage accessible={false} contentFit="contain" pointerEvents="none" source={require('../../assets/svg/gold-leaf-corner.svg')} style={styles.disclaimerLeaf} /><Feather name="info" size={18} color={theme.accentDark} style={styles.disclaimerContent} /><Text style={[styles.disclaimerText, styles.disclaimerContent, { color: theme.text }]}>This result is for decision support only and should not replace expert validation.</Text></View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, root: { flex: 1 }, scrollContent: { alignItems: 'center' },
  content: { width: '100%', maxWidth: Layout.mobileMaxWidth, paddingHorizontal: ComponentTokens.screen.horizontalPadding, paddingVertical: Spacing.xl, gap: Spacing.lg },
  intro: { ...Typography.bodySmall },
  uploadCard: { padding: Spacing.md, borderWidth: 1, borderRadius: Radius.xl, ...Shadows.sm },
  dropZone: { minHeight: 245, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  emptyArtwork: { width: 116, height: 116 },
  uploadTitle: { ...Typography.subheading }, uploadText: { ...Typography.bodySmall, textAlign: 'center', maxWidth: 220 },
  actions: { gap: Spacing.md },
  guide: { borderWidth: 1, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md, ...Shadows.sm }, guideHeading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  guideIcon: { width: 34, height: 34, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' }, guideTitle: { ...Typography.body, fontWeight: '800' },
  guideRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }, bullet: { width: 6, height: 6, borderRadius: Radius.full }, guideText: { ...Typography.bodySmall, flex: 1 },
  disclaimer: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.md, flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', overflow: 'hidden', position: 'relative' }, disclaimerLeaf: { position: 'absolute', width: 92, height: 92, right: -18, bottom: -24, opacity: 0.22 }, disclaimerContent: { zIndex: 1 }, disclaimerText: { ...Typography.caption, flex: 1, lineHeight: 18 },
});
