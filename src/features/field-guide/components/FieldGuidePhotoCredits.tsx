import { StyleSheet, Text, View } from 'react-native';

import {
  FIELD_GUIDE_CREDIT_CREATOR_LABEL,
  FIELD_GUIDE_CREDIT_LICENSE_LABEL,
  FIELD_GUIDE_CREDIT_MISSING,
  FIELD_GUIDE_CREDIT_SOURCE_LABEL,
} from '@/constants/copy';
import { Spacing, Typography } from '@/constants/theme';
import type { FieldGuideImage } from '@/features/field-guide/domain/fieldGuideTypes';
import { useTheme } from '@/hooks/use-theme';

export type FieldGuidePhotoCreditsProps = {
  images: readonly FieldGuideImage[];
  testID?: string;
};

/**
 * Per-photo credit block, rendered in the entry's read-only credits disclosure
 * and under the open photo in the full-screen viewer.
 *
 * An incomplete record is labelled as incomplete. Nothing here guesses a
 * creator, a licence or an original page; those fields are filled in only when
 * the office supplies the evidence, and `credit.recorded` gates the wording.
 */
export function FieldGuidePhotoCredits({ images, testID }: FieldGuidePhotoCreditsProps) {
  const theme = useTheme();

  if (images.length === 0) {
    return null;
  }

  return (
    <View style={styles.list} testID={testID}>
      {images.map((image, index) => (
        <View
          key={image.assetKey}
          style={[styles.item, { borderColor: theme.border }]}
          testID={testID ? `${testID}.${index + 1}` : undefined}>
          <Text style={[styles.caption, { color: theme.text }]}>{image.caption}</Text>
          {image.credit.recorded ? (
            <>
              {image.credit.creator ? (
                <Text style={[styles.line, { color: theme.textSecondary }]}>
                  {`${FIELD_GUIDE_CREDIT_CREATOR_LABEL}: ${image.credit.creator}`}
                </Text>
              ) : null}
              {image.credit.licenseName ? (
                <Text style={[styles.line, { color: theme.textSecondary }]}>
                  {`${FIELD_GUIDE_CREDIT_LICENSE_LABEL}: ${image.credit.licenseName}`}
                </Text>
              ) : null}
              {image.credit.sourcePageUrl ? (
                <Text selectable style={[styles.line, { color: theme.textSecondary }]}>
                  {`${FIELD_GUIDE_CREDIT_SOURCE_LABEL}: ${image.credit.sourcePageUrl}`}
                </Text>
              ) : null}
              {image.credit.attribution ? (
                <Text style={[styles.line, { color: theme.textSecondary }]}>
                  {image.credit.attribution}
                </Text>
              ) : null}
            </>
          ) : (
            <Text style={[styles.line, { color: theme.textSecondary }]}>
              {FIELD_GUIDE_CREDIT_MISSING}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.md },
  item: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    gap: 2,
  },
  caption: { ...Typography.bodySmall, fontWeight: '800' },
  line: { ...Typography.caption },
});
