import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DiseasePill, type DiseasePillVariant } from '@/components/ui/DiseasePill';
import {
  ComponentTokens,
  Radius,
  Shadows,
  Spacing,
  Typography,
} from '@/constants/theme';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';
import type { SyncStatus } from '@/database/schema';
import { useTheme } from '@/hooks/use-theme';

type RecordCardProps = {
  onPress: () => void;
  record: ScanRecordListItem;
};

export function RecordCard({ record, onPress }: RecordCardProps) {
  const theme = useTheme();
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const savedAt = formatSavedAt(record.createdAt);
  const variant = toPillVariant(record.predictedLabel);
  const syncPresentation = getSyncPresentation(record.syncStatus);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${getResultLabel(record.predictedLabel)} record saved ${savedAt}`}
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
            accessibilityLabel="Saved image unavailable"
            name="image"
            size={24}
            color={theme.textSecondary}
          />
        ) : (
          <ExpoImage
            source={{ uri: record.managedImageUri }}
            contentFit="cover"
            accessibilityLabel={`Saved image for ${getResultLabel(record.predictedLabel)}`}
            onError={() => setImageUnavailable(true)}
            style={styles.image}
          />
        )}
      </View>
      <View style={styles.main}>
        <View style={styles.header}>
          <View style={styles.copy}>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={[styles.result, { color: theme.primaryDark }]}>
              {getResultLabel(record.predictedLabel)}
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
          <DiseasePill variant={variant} />
        </View>
        <View style={styles.footer}>
          <Text style={[styles.confidence, { color: theme.primaryDark }]}>
            {Math.round(record.confidence * 100)}% confidence
          </Text>
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
        </View>
      </View>
    </Pressable>
  );
}

export function getSyncPresentation(status: SyncStatus): {
  color: 'danger' | 'info' | 'success' | 'warning';
  icon: keyof typeof Feather.glyphMap;
  label: string;
} {
  switch (status) {
    case 'local_only':
      return { color: 'info', icon: 'smartphone', label: 'Local only' };
    case 'pending':
      return { color: 'warning', icon: 'clock', label: 'Pending upload' };
    case 'syncing':
      return { color: 'info', icon: 'upload-cloud', label: 'Uploading' };
    case 'synced':
      return { color: 'success', icon: 'check-circle', label: 'Synced' };
    case 'failed':
      return { color: 'danger', icon: 'alert-triangle', label: 'Sync failed' };
  }
}

export function getResultLabel(label: string): string {
  if (label === 'healthy') {
    return 'No supported disease detected';
  }
  if (label === 'mosaic') {
    return 'Possible result: Mosaic';
  }
  if (label === 'rust') {
    return 'Possible result: Rust';
  }
  return `Stored model result: ${label}`;
}

function toPillVariant(label: string): DiseasePillVariant {
  return label === 'healthy' || label === 'mosaic' || label === 'rust'
    ? label
    : 'unclear';
}

function formatSavedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const styles = StyleSheet.create({
  card: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.md,
    ...Shadows.sm,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  copy: { flex: 1, gap: Spacing.xs },
  result: { ...Typography.bodySmall, fontWeight: '800' },
  date: { ...Typography.caption },
  location: { ...Typography.caption },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  confidence: { ...Typography.caption, fontWeight: '800' },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexShrink: 1,
  },
  statusText: { ...Typography.caption, fontWeight: '700', flexShrink: 1 },
  pressed: { opacity: 0.75 },
});
