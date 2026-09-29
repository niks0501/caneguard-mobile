import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DiseasePill, type DiseasePillVariant } from '@/components/ui/DiseasePill';
import { ASSIGNMENT_PHOTO_PLACEHOLDER } from '@/constants/copy';
import { ComponentTokens, Radius, Spacing, Typography } from '@/constants/theme';
import { useAssignmentPhotoUri } from '@/features/activity/hooks/useAssignmentPhoto';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import {
  formatTodayDueLine,
  getLocalDateKey,
  type TodayVisitBucket,
} from '@/features/assignments/domain/todayVisits';
import { useTheme } from '@/hooks/use-theme';

export function AssignmentCard({
  assignment,
  dueState,
  onPress,
  testID,
  today,
}: {
  assignment: FieldValidationAssignment;
  dueState?: TodayVisitBucket;
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

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Field validation assignment ${assignment.referenceCode}`}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.pressed]}
      testID={testID}>
      <View
        style={[
          styles.card,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}>
        <View style={styles.body}>
          <AssignmentPhoto
            referenceCode={assignment.referenceCode}
            uri={photoUri}
          />
          <View style={styles.titleBlock}>
            <View style={[styles.assignmentTag, { backgroundColor: theme.infoBg }]}>
              <Feather name="clipboard" size={14} color={theme.primary} />
              <Text style={[styles.assignmentTagText, { color: theme.primary }]}>Assignment</Text>
            </View>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.reference, { color: theme.primaryDark }]}>
              {assignment.referenceCode}
            </Text>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.location, { color: theme.textSecondary }]}>
              {assignment.case.barangay}
            </Text>
          </View>
        </View>
        <DiseasePill variant={variant} />
        <View style={[styles.details, { borderTopColor: theme.divider }]}>
          {dueState ? (
            <Detail label="Due" value={formatTodayDueLine(assignment, today ?? getLocalDateKey())} theme={theme} />
          ) : (
            <Detail label="Visit" value={target} theme={theme} />
          )}
          <Detail label="Submitted by" value={assignment.submitter.name} theme={theme} />
          <Detail label="Status" value={stateLabel(assignment.fieldValidationState)} theme={theme} />
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

function Detail({
  label,
  theme,
  value,
}: {
  label: string;
  theme: ReturnType<typeof useTheme>;
  value: string;
}) {
  return (
    <View style={styles.detail}>
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.detailValue, { color: theme.primaryDark }]}>
        {value}
      </Text>
    </View>
  );
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
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

function toPillVariant(label: string): DiseasePillVariant {
  return label === 'healthy' || label === 'mosaic' || label === 'rust' || label === 'smut'
    ? label
    : 'unclear';
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  card: {
    borderRadius: ComponentTokens.card.borderRadius,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  body: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
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
  titleBlock: { flex: 1, gap: Spacing.xs },
  assignmentTag: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  assignmentTagText: { ...Typography.caption, fontWeight: '800' },
  reference: { ...Typography.subheading, fontWeight: '800' },
  location: { ...Typography.bodySmall },
  details: {
    borderTopWidth: 1,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },
  detail: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  detailLabel: { ...Typography.caption, flexShrink: 0 },
  detailValue: { ...Typography.caption, fontWeight: '800', textAlign: 'right', flex: 1 },
});
