import { Image as ExpoImage } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { SCAN_CHECK_COPY, SCAN_PICTURE_NAMES } from '@/constants/copy';
import type { ChecklistObservationId } from '@/features/detection/checklist/checklistConsistency';
import { findFieldGuideEntry } from '@/features/field-guide/constants/fieldGuideEntries';
import { useTheme } from '@/hooks/use-theme';

type GridOption = { id: ChecklistObservationId; label: string };

/**
 * Which shipped reference photo stands for each answer. Healthy, Mosaic and
 * Rust use the bundled reference photos; Smut uses the first field-guide photo.
 * Yellow midrib has no photo yet, so it stays a text tile until one ships.
 */
const PHOTO_ENTRY: Partial<Record<ChecklistObservationId, 'healthy' | 'mosaic' | 'rust' | 'smut'>> = {
  none: 'healthy',
  mosaic: 'mosaic',
  rust: 'rust',
  smut: 'smut',
};

function referencePhoto(id: ChecklistObservationId): string | number | undefined {
  const entryId = PHOTO_ENTRY[id];
  return entryId ? findFieldGuideEntry(entryId)?.images[0]?.source : undefined;
}

type Props = {
  options: readonly GridOption[];
  selected: ChecklistObservationId | null;
  onSelect: (id: ChecklistObservationId) => void;
};

export function ObservationPictureGrid({ options, selected, onSelect }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {options.map((option) => {
        const isSelected = selected === option.id;
        const photo = referencePhoto(option.id);
        return (
          <Pressable
            key={option.id}
            testID={`scan.symptom-${option.id}`}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [
              styles.tile,
              {
                backgroundColor: isSelected ? theme.backgroundSelected : theme.surfaceElevated,
                borderColor: isSelected ? theme.primary : theme.border,
              },
              pressed && { opacity: 0.78 },
            ]}>
            <View style={[styles.photoFrame, { backgroundColor: theme.surfaceMuted }]}>
              {photo ? (
                <ExpoImage
                  source={photo}
                  contentFit="cover"
                  accessible={false}
                  style={styles.photo}
                />
              ) : (
                <Text style={[styles.noPhoto, { color: theme.textSecondary }]}>
                  {option.id === 'yellow-midrib' ? SCAN_CHECK_COPY.noReferencePhoto : ''}
                </Text>
              )}
            </View>
            <Text style={[styles.name, { color: theme.text }]}>
              {SCAN_PICTURE_NAMES[option.id]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  tile: {
    width: '47.5%',
    flexGrow: 1,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  photoFrame: {
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%' },
  noPhoto: { ...Typography.caption },
  name: { ...Typography.bodySmall, fontWeight: '700', textAlign: 'center' },
});
