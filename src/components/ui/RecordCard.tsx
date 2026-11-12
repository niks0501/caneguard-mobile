import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  FARMER_COPY,
  PERSONAL_SCAN_LOCAL_STATUS,
  UNFINISHED_COPY,
  UNRECOGNIZED_LABEL_TEXT,
  type FarmerLanguage,
} from '@/constants/copy';
import {
  ComponentTokens,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import type { FarmerScanState } from '@/features/records/domain/scanState';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';
import { managedDisplayImageUriIfPresent } from '@/features/records/services/scanImageStorage';
import type { SyncStatus } from '@/database/schema';
import { getAuthorityReviewPresentation } from '@/features/reports/domain/reportReviewTypes';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import { isAutoRetryableSyncErrorCode } from '@/features/sync/errors/syncErrors';
import { SYNC_TONE_COLOR, type SyncToneColorKey } from '@/features/sync/utils/syncStatusCopy';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/formatters';

type RecordCardProps = {
  activityType?: 'report' | 'scan';
  onPress: () => void;
  record: ScanRecordListItem;
  /** Farmer My Scans state; replaces the device and sync status line. */
  scanState?: { label: string; state: FarmerScanState };
  /**
   * The farmer's own wording for this card: the result line and the open
   * label in their language.
   */
  farmerText?: { language: FarmerLanguage; openLabel: string; result: string };
  testID?: string;
};

const FARMER_STATE_ICON: Record<FarmerScanState, keyof typeof Feather.glyphMap> = {
  needs_checking: 'eye',
  followed_up: 'repeat',
  saved: 'check-circle',
};

export function RecordCard({
  activityType,
  farmerText,
  onPress,
  record,
  scanState,
  testID,
}: RecordCardProps) {
  const theme = useTheme();
  const [imageUnavailable, setImageUnavailable] = useState(false);
  // Prefer the small display derivative this save wrote. It is absent for
  // records saved before the derivative existed and after a failed generation,
  // and the preserved original is the correct fallback in both cases.
  const thumbnailUri =
    managedDisplayImageUriIfPresent(record.managedImageUri) ?? record.managedImageUri;
  const savedAt = formatSavedAt(record.createdAt);
  const syncPresentation = record.reportDraft
    ? { color: SYNC_TONE_COLOR.whisper, icon: 'edit-3' as const, label: UNFINISHED_COPY.label }
    : getSyncPresentation(record.syncStatus);
  const itemLabel = activityType ?? 'record';
  const resultText = farmerText?.result ?? getResultLabel(record.predictedLabel);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        farmerText
          ? `${farmerText.openLabel}: ${farmerText.result}, ${savedAt}`
          : `Open ${getResultLabel(record.predictedLabel)} ${itemLabel} saved ${savedAt}`
      }
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <View
        style={[styles.thumbnail, { backgroundColor: theme.surfaceMuted }]}>
        {imageUnavailable ? (
          <Feather
            accessibilityLabel={
              farmerText
                ? FARMER_COPY[farmerText.language].record.imageUnavailable
                : 'Saved image unavailable'
            }
            name="image"
            size={24}
            color={theme.textSecondary}
          />
        ) : (
          <ExpoImage
            source={{ uri: thumbnailUri }}
            cachePolicy="memory-disk"
            contentFit="cover"
            accessibilityLabel={farmerText ? resultText : `Saved image for ${resultText}`}
            onError={() => setImageUnavailable(true)}
            style={styles.image}
          />
        )}
      </View>
      <View style={styles.main}>
        {activityType ? (
          <View
            accessibilityLabel={activityType === 'report' ? 'Field Report activity' : 'Scan activity'}
            style={[
              styles.activityType,
              {
                backgroundColor: theme.surfaceMuted,
              },
            ]}>
            <Feather
              name={activityType === 'report' ? 'file-text' : 'camera'}
              size={13}
              color={theme.primary}
            />
            <Text style={[styles.activityTypeText, { color: theme.primary }]}>
              {activityType === 'report' ? 'Report' : 'Scan'}
            </Text>
          </View>
        ) : null}
        <View style={styles.header}>
          <View style={styles.copy}>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[styles.result, { color: theme.primaryDark }]}>
              {resultText}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.date, { color: theme.textSecondary }]}>
              {savedAt}
            </Text>
            {record.barangay ? (
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.location, { color: theme.textSecondary }]}>
                {record.barangay}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.footer}>
          {farmerText ? (
            scanState ? (
              <View
                testID={`record-card.state.${record.id}`}
                accessibilityLabel={scanState.label}
                style={styles.status}>
                <Feather
                  name={FARMER_STATE_ICON[scanState.state]}
                  size={14}
                  color={theme.textSecondary}
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={[styles.statusText, { color: theme.textSecondary }]}>
                  {scanState.label}
                </Text>
              </View>
            ) : null
          ) : (
            <View style={styles.status}>
              <Feather
                name={syncPresentation.icon}
                size={14}
                color={theme[syncPresentation.color]}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.statusText,
                  { color: theme[syncPresentation.color] },
                ]}>
                {syncPresentation.label}
              </Text>
            </View>
          )}
        </View>
        {!farmerText && !scanState && record.syncStatus === 'synced' && record.authorityReview ? (
          <View
            testID={`record-card.authority-status.${record.id}`}
            accessibilityLabel={`Authority review: ${getAuthorityReviewPresentation(record.authorityReview.rawStatus).label}`}
            style={styles.authorityStatus}>
            <Feather name="shield" size={14} color={theme.textSecondary} />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.statusText, { color: theme.textSecondary }]}>
              {getAuthorityReviewPresentation(record.authorityReview.rawStatus).label}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function getSyncPresentation(
  status: SyncStatus,
  lastSyncErrorCode: string | null = null,
): {
  color: SyncToneColorKey;
  icon: keyof typeof Feather.glyphMap;
  label: string;
} {
  // Normal states whisper in ink; only a failure the inspector must act on
  // (sign in again, could not send) is Stop red.
  switch (status) {
    case 'local_only':
      return {
        color: SYNC_TONE_COLOR.whisper,
        icon: 'smartphone',
        label: PERSONAL_SCAN_LOCAL_STATUS,
      };
    case 'pending':
      return { color: SYNC_TONE_COLOR.whisper, icon: 'clock', label: 'Waiting to send' };
    case 'syncing':
      return { color: SYNC_TONE_COLOR.whisper, icon: 'upload-cloud', label: 'Sending to office' };
    case 'synced':
      return { color: SYNC_TONE_COLOR.whisper, icon: 'check-circle', label: 'Sent to office' };
    case 'failed':
      if (lastSyncErrorCode === 'AUTH_REQUIRED') {
        return { color: SYNC_TONE_COLOR.stop, icon: 'lock', label: 'Sign in again to send' };
      }
      if (isAutoRetryableSyncErrorCode(lastSyncErrorCode)) {
        return { color: SYNC_TONE_COLOR.whisper, icon: 'clock', label: 'Waiting to send' };
      }
      return {
        color: SYNC_TONE_COLOR.stop,
        icon: 'alert-triangle',
        label: 'Could not send — try again',
      };
  }
}

export function getResultLabel(label: string): string {
  const resultName = label === 'unknown'
    ? UNRECOGNIZED_LABEL_TEXT
    : Object.prototype.hasOwnProperty.call(diseaseCatalog, label)
      ? diseaseCatalog[label as keyof typeof diseaseCatalog].displayName
      : label;
  return `Possible Condition: ${resultName}`;
}

function formatSavedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return formatDateTime(date);
}

const styles = StyleSheet.create({
  card: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  thumbnail: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  main: { flex: 1, gap: Spacing.sm },
  activityType: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  activityTypeText: { ...Typography.label },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  copy: { flex: 1, gap: Spacing.xs },
  result: { ...Typography.bodySmall, fontWeight: '500' },
  date: { ...Typography.caption },
  location: { ...Typography.caption },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 1,
  },
  statusText: { ...Typography.caption, fontWeight: '500', flexShrink: 1 },
  authorityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 1,
  },
  pressed: { opacity: 0.75 },
});
