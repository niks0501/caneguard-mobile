import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ComponentTokens, Layout, Spacing, Typography } from '@/constants/theme';
import { OnlineMapPicker } from '@/features/reports/components/online-map-picker';
import {
  DEFAULT_MANUAL_MAP_CENTER,
  type MapCoordinate,
} from '@/features/reports/domain/manualMap';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';
import { useSync } from '@/features/sync/hooks/useSync';
import { useTheme } from '@/hooks/use-theme';

export default function ManualMapScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    reportId?: string | string[];
    scanRecordId?: string | string[];
  }>();
  const reportId = firstParam(params.reportId);
  const scanRecordId = firstParam(params.scanRecordId);
  const report = useFieldReportDraft(scanRecordId, false);
  const { isOnline } = useSync();
  const [selection, setSelection] = useState<MapCoordinate | null>(null);

  const reportMatches = report.data?.id === reportId;
  const initialCenter = getInitialCenter(report.data);

  async function confirmLocation() {
    if (!selection || !reportMatches) return;
    const saved = await report.saveManualLocation(
      selection.latitude,
      selection.longitude,
    );
    if (saved) router.back();
  }

  return (
    <SafeAreaView testID="manual-map.screen" style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Pin Report Location" />
        {report.loading && !report.data ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} accessibilityLabel="Opening manual location map" />
          </View>
        ) : report.errorMessage && !report.data ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: theme.danger }]}>{report.errorMessage}</Text>
            <AppButton onPress={() => void report.refresh()} leadingIcon="refresh-cw">Try Again</AppButton>
          </View>
        ) : !reportMatches ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: theme.danger }]}>This manual-map link does not match the saved Draft.</Text>
            <AppButton onPress={() => router.back()} variant="secondary">Return to Draft</AppButton>
          </View>
        ) : report.data?.authoringState !== 'draft' ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: theme.danger }]}>Only a Draft report can change its location.</Text>
            <AppButton onPress={() => router.back()} variant="secondary">Return to Report</AppButton>
          </View>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <Text style={[styles.instructions, { color: theme.text }]}>Move and zoom the online map, then tap the observation location. Confirm only after checking the pin coordinates.</Text>
              <OnlineMapPicker
                initialCenter={initialCenter}
                isOnline={isOnline}
                onSelectionChange={setSelection}
              />
              {report.errorMessage ? (
                <Text accessibilityLiveRegion="assertive" style={[styles.error, { color: theme.danger }]}>{report.errorMessage}</Text>
              ) : null}
              <AppButton
                testID="manual-map.confirm"
                accessibilityLabel={report.savingManualLocation ? 'Saving manual map location' : 'Confirm manual map location'}
                disabled={!selection || isOnline !== true || report.savingManualLocation}
                leadingIcon="map-pin"
                onPress={() => void confirmLocation()}>
                {report.savingManualLocation ? 'Saving Location…' : 'Confirm Location'}
              </AppButton>
              <AppButton onPress={() => router.back()} variant="secondary">Keep Draft Unchanged</AppButton>
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

function firstParam(value: string | string[] | undefined): string | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function getInitialCenter(
  report: ReturnType<typeof useFieldReportDraft>['data'],
): MapCoordinate {
  if (
    report &&
    report.finalLatitude !== null &&
    report.finalLongitude !== null
  ) {
    return { latitude: report.finalLatitude, longitude: report.finalLongitude };
  }
  if (
    report &&
    report.gpsAttemptLatitude !== null &&
    report.gpsAttemptLongitude !== null
  ) {
    return {
      latitude: report.gpsAttemptLatitude,
      longitude: report.gpsAttemptLongitude,
    };
  }
  return DEFAULT_MANUAL_MAP_CENTER;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  scrollContent: { alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  instructions: { ...Typography.body },
  error: { ...Typography.bodySmall, fontWeight: '700' },
});
