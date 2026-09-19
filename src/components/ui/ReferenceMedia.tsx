import { Feather } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ReferenceMediaProps = {
  /** Class name used in the accessible label, for example "Smut". */
  label: string;
  /** Bundled photo, or undefined to render the description-only state. */
  photo?: number;
  /** How the class looks in the field, shown when no photo is available. */
  patternDescription: string;
  testID?: string;
};

/**
 * One media frame for every reference class.
 *
 * The frame keeps a fixed 4:3 ratio and always contains the whole image, so a
 * class is never presented with a silently cropped photo and no class looks
 * broken next to the others. When no licence-evidenced photo exists, the
 * description-only state fills exactly the same frame instead of shrinking to
 * a text strip.
 *
 * Licensing and provenance are deliberately absent here: they belong in the
 * asset manifest, never in the inspector's field reference.
 */
export function ReferenceMedia({
  label,
  photo,
  patternDescription,
  testID,
}: ReferenceMediaProps) {
  const theme = useTheme();

  if (photo) {
    return (
      <View
        style={[
          styles.frame,
          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        ]}
        testID={testID}>
        <Image
          accessibilityLabel={`${label} reference photo`}
          resizeMode="contain"
          source={photo}
          style={styles.photo}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={`${label} reference description`}
      style={[
        styles.frame,
        styles.descriptionFrame,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}
      testID={testID}>
      <Feather name="info" size={20} color={theme.primary} />
      <Text style={[styles.descriptionText, { color: theme.text }]}>
        {patternDescription}
      </Text>
      <Text style={[styles.descriptionNote, { color: theme.textSecondary }]}>
        No photo available · description only
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  descriptionFrame: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  descriptionText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  descriptionNote: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
