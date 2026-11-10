import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DiseasePill, type DiseasePillVariant } from '@/components/ui/DiseasePill';
import { ASSIGNMENT_PHOTO_PLACEHOLDER, UNRECOGNIZED_LABEL_TEXT } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useAssignmentPhotoUri } from '@/features/activity/hooks/useAssignmentPhoto';
import {
  UNKNOWN_PREDICTED_LABEL,
  type FieldValidationAssignment,
} from '@/features/assignments/domain/assignmentTypes';
import type { PhoneCompletionState } from '@/features/assignments/domain/fieldValidationCompletionTypes';
import {
  formatTodayDueLine,
  getLocalDateKey,
  type TodayVisitBucket,
} from '@/features/assignments/domain/todayVisits';
import { VISIT_DONE_WAITING_LABEL } from '@/features/sync/utils/syncStatusCopy';
import { useTheme } from '@/hooks/use-theme';
import { formatDateKey } from '@/lib/formatters';

export function AssignmentCard({
  assignment,
  dueState,
  onPress,
  phoneCompletion,
  testID,
  today,
}: {
  assignment: FieldValidationAssignment;
  dueState?: TodayVisitBucket;
  /**
   * The visit saved on this phone, shown over the server assignment until the
   * server reports the visit completed.
   */
  phoneCompletion?: PhoneCompletionState;
  today?: string;
  onPress?: () => void;
  testID?: string;
}) {
  const theme = useTheme();
  const photoUri = useAssignmentPhotoUri(assignment);
  const variant = toPillVariant(assignment.case.predictedLabel);
  const target = assignment.targetVisitDate
    ? formatDate(assignment.targetVisitDate)
    : 'No target visit date';
  const dueLine = dueState
    ? formatTodayDueLine(assignment, today ?? getLocalDateKey())
    : target;
  const progress = progressLabel(
    assignment.fieldValidationState,
    phoneCompletion,
  );

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Field validation assignment ${assignment.referenceCode}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
      testID={testID}>
      <View style={[styles.row, { borderBottomColor: theme.divider }]}>
        <AssignmentPhoto
          referenceCode={assignment.referenceCode}
          uri={photoUri}
        />
        <View style={styles.copy}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.place, { color: theme.text }]}>
            {assignment.case.barangay}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.due, { color: theme.text }]}>
            {dueLine}
          </Text>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[styles.reference, { color: theme.textSecondary }]}>
            {progress === 'Assigned'
              ? assignment.referenceCode
              : `${assignment.referenceCode} · ${progress}`}
          </Text>
          <DiseasePill
            variant={variant}
            label={assignment.case.predictedLabel === UNKNOWN_PREDICTED_LABEL ? UNRECOGNIZED_LABEL_TEXT : undefined}
          />
        </View>
      </View>
    </Pressable>
  );
}

/**
 * One fixed-size photo frame. A stored picture and the designed placeholder
 * share the frame, so the card never opens a hole and heights stay put.
 */
function AssignmentPhoto({
  referenceCode,
  uri,
}: {
  referenceCode: string;
  uri: string | null;
}) {
  const theme = useTheme();
  const [failedUri, setFailedUri] = useState<string | null>(null);
  // A new URI is shown again without an effect: only the URI that actually
  // failed falls back to the placeholder.
  const photoUri = uri && uri !== failedUri ? uri : null;

  return (
    <View
      style={[
        styles.photo,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        photoUri ? null : styles.photoPlaceholderFrame,
      ]}
      testID="assignment.photo">
      {photoUri ? (
        <ExpoImage
          accessibilityLabel={`Case photo for ${referenceCode}`}
          cachePolicy="memory-disk"
          contentFit="cover"
          onError={() => setFailedUri(photoUri)}
          source={{ uri: photoUri }}
          style={styles.photoImage}
          testID="assignment.photo.image"
        />
      ) : (
        <View
          style={styles.photoPlaceholder}
          testID="assignment.photo.placeholder">
          <Feather name="image" size={20} color={theme.textSecondary} />
          <Text
            numberOfLines={1}
            style={[styles.photoPlaceholderLabel, { color: theme.textSecondary }]}>
            {ASSIGNMENT_PHOTO_PLACEHOLDER}
          </Text>
        </View>
      )}
    </View>
  );
}

function progressLabel(
  serverState: FieldValidationAssignment['fieldValidationState'],
  phoneCompletion: PhoneCompletionState | undefined,
): string {
  if (!phoneCompletion || serverState === 'completed') {
    return stateLabel(serverState);
  }
  return phoneCompletion === 'waiting'
    ? VISIT_DONE_WAITING_LABEL
    : stateLabel('completed');
}

function stateLabel(state: FieldValidationAssignment['fieldValidationState']): string {
  switch (state) {
    case 'assigned':
      return 'Assigned';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'unassigned':
      return 'Unassigned';
  }
}

function formatDate(value: string): string {
  return formatDateKey(value);
}

function toPillVariant(label: string): DiseasePillVariant {
  return label === 'healthy' || label === 'mosaic' || label === 'rust' || label === 'smut'
    ? label
    : 'unclear';
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  row: {
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  photo: {
    width: 72,
    height: 72,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoPlaceholderFrame: { borderWidth: 1, borderStyle: 'dashed' },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  photoPlaceholderLabel: { ...Typography.caption, textAlign: 'center' },
  copy: { flex: 1, gap: Spacing.xs },
  place: { ...Typography.subheading },
  due: { ...Typography.body },
  reference: { ...Typography.bodySmall },
});
