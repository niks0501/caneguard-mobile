import { StyleSheet, Text } from 'react-native';

import { FIELD_GUIDE_PENDING_VALIDATION_NOTICE } from '@/constants/copy';
import { Spacing, Typography } from '@/constants/theme';
import type { FieldGuideEditorial } from '@/features/field-guide/domain/fieldGuideTypes';
import { useTheme } from '@/hooks/use-theme';

export type FieldGuidePendingValidationNoticeProps = {
  editorial: FieldGuideEditorial;
  testID?: string;
};

/**
 * Reader-facing release-gate marker. It is rendered beside the education
 * disclaimer only while the entry's editorial record is pending expert review,
 * and disappears once that record says the wording was reviewed.
 */
export function FieldGuidePendingValidationNotice({
  editorial,
  testID,
}: FieldGuidePendingValidationNoticeProps) {
  const theme = useTheme();

  if (editorial.validationStatus !== 'pending-expert-review') {
    return null;
  }

  return (
    <Text style={[styles.notice, { color: theme.warning }]} testID={testID}>
      {FIELD_GUIDE_PENDING_VALIDATION_NOTICE}
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: {
    ...Typography.caption,
    fontWeight: '800',
    marginTop: Spacing.xs,
  },
});
