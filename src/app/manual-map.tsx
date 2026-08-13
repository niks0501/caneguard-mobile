import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
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
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    reportId?: string | string[];
    scanRecordId?: string | string[];
  }>();
  const reportId = firstParam(params.reportId);
  const scanRecordId = firstParam(params.scanRecordId);
  const report = useFieldReportDraft(scanRecordId, false);
  const { isOnline } = useSync();
  const [selection, setSelection] = useState<MapCoordinate | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Native scroll gesture of the surrounding ScrollView; the map's pan
  // gesture blocks it so dragging on the map pans the map instead of
  // scrolling the page.
  const scrollNativeGesture = useMemo(() => Gesture.Native(), []);

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
    <SafeAreaView
      testID="manual-map.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={isFullscreen ? [] : ['top', 'bottom']}>
      <View style={styles.root}>
        {!isFullscreen ? (
          <BrandedScreenHeader title="Pin Report Location" />
        ) : null}
        {report.loading && !report.data ? (
          <View style={styles.centered}>
            <ActivityIndicator
              color={theme.primary}
              accessibilityLabel="Opening manual location map"
            />
          </View>
        ) : report.errorMessage && !report.data ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: theme.danger }]}>
              {report.errorMessage}
            </Text>
            <AppButton
              onPress={() => void report.refresh()}
              leadingIcon="refresh-cw">
              Try Again
            </AppButton>
          </View>
        ) : !reportMatches ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: theme.danger }]}>
              This manual-map link does not match the saved Draft.
            </Text>
            <AppButton onPress={() => router.back()} variant="secondary">
              Return to Draft
            </AppButton>
          </View>
        ) : report.data?.authoringState !== 'draft' ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: theme.danger }]}>
              Only a Draft report can change its location.
            </Text>
            <AppButton onPress={() => router.back()} variant="secondary">
              Return to Report
            </AppButton>
          </View>
        ) : (
          // The picker stays mounted across the fullscreen toggle (same tree
          // position) so center/zoom/selection survive it. In fullscreen the
          // scroll is disabled, the map fills the screen, and the actions
          // float over the map.
          <ScrollView
            scrollEnabled={!isFullscreen}
            keyboardShouldPersistTaps="handled"
            style={styles.scroll}
            contentContainerStyle={
              isFullscreen
                ? styles.scrollContentFullscreen
                : styles.scrollContent
            }>
            <GestureDetector gesture={scrollNativeGesture}>
              <View
                style={
                  isFullscreen ? styles.contentFullscreen : styles.content
                }>
                {!isFullscreen ? (
                  <Text style={[styles.instructions, { color: theme.text }]}>
                    Move and zoom the online map, then tap the observation
                    location. Confirm only after checking the pin coordinates.
                  </Text>
                ) : null}
                <OnlineMapPicker
                  blocksScrollGesture={scrollNativeGesture}
                  fullscreen={isFullscreen}
                  initialCenter={initialCenter}
                  isOnline={isOnline}
                  onSelectionChange={setSelection}
                  onToggleFullscreen={() =>
                    setIsFullscreen((current) => !current)
                  }
                />
                {isFullscreen ? (
                  <View
                    style={[
                      styles.fullscreenActions,
                      { bottom: insets.bottom + Spacing.md },
                    ]}>
                    {report.errorMessage ? (
                      <Text
                        accessibilityLiveRegion="assertive"
                        style={[
                          styles.fullscreenError,
                          {
                            color: theme.danger,
                            backgroundColor: theme.surfaceElevated,
                          },
                        ]}>
                        {report.errorMessage}
                      </Text>
                    ) : null}
                    <AppButton
                      testID="manual-map.confirm"
                      accessibilityLabel={
                        report.savingManualLocation
                          ? 'Saving manual map location'
                          : 'Confirm manual map location'
                      }
                      disabled={
                        !selection ||
                        isOnline !== true ||
                        report.savingManualLocation
                      }
                      leadingIcon="map-pin"
                      onPress={() => void confirmLocation()}>
                      {report.savingManualLocation
                        ? 'Saving Location…'
                        : 'Confirm Location'}
                    </AppButton>
                    <AppButton
                      onPress={() => router.back()}
                      variant="secondary">
                      Keep Draft Unchanged
                    </AppButton>
                  </View>
                ) : (
                  <>
                    {report.errorMessage ? (
                      <Text
                        accessibilityLiveRegion="assertive"
                        style={[
                          styles.error,
                          { color: theme.danger },
                        ]}>
                        {report.errorMessage}
                      </Text>
                    ) : null}
                    <AppButton
                      testID="manual-map.confirm"
                      accessibilityLabel={
                        report.savingManualLocation
                          ? 'Saving manual map location'
                          : 'Confirm manual map location'
                      }
                      disabled={
                        !selection ||
                        isOnline !== true ||
                        report.savingManualLocation
                      }
                      leadingIcon="map-pin"
                      onPress={() => void confirmLocation()}>
                      {report.savingManualLocation
                        ? 'Saving Location…'
                        : 'Confirm Location'}
                    </AppButton>
                    <AppButton
                      onPress={() => router.back()}
                      variant="secondary">
                      Keep Draft Unchanged
                    </AppButton>
                  </>
                )}
              </View>
            </GestureDetector>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  scroll: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  scrollContentFullscreen: { flexGrow: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  contentFullscreen: {
    flex: 1,
    width: '100%',
  },
  fullscreenActions: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    gap: Spacing.md,
    zIndex: 10,
    elevation: 10,
  },
  fullscreenError: {
    ...Typography.bodySmall,
    fontWeight: '700',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  instructions: { ...Typography.body },
  error: { ...Typography.bodySmall, fontWeight: '700' },
});
