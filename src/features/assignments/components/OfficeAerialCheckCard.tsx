import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Pill } from '@/components/ui/Pill';
import { Row } from '@/components/ui/Row';
import { OFFICE_AERIAL_COPY } from '@/constants/copy';
import { Radius, Spacing, Typography } from '@/constants/theme';
import {
  buildMobileAerialOverlayUrl,
  buildMobileAerialPreviewUrl,
} from '@/features/assignments/api/mobileFieldValidationAssignmentsApi';
import { GuardedPhoto } from '@/features/assignments/components/GuardedPhoto';
import type { FieldValidationAssignment } from '@/features/assignments/domain/assignmentTypes';
import {
  isAerialBriefReadyOffline,
  listOfficeMediaItems,
  readOfficeMediaUri,
} from '@/features/assignments/services/officeMediaCache';
import { useSyncRecordsRevision } from '@/features/sync/hooks/useSyncRecordsRevision';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime } from '@/lib/formatters';

type AerialViewMode = 'overlay' | 'preview';

/** CaneGuard --kpi-band-3 flat solid highlight matching server overlay tint. */
const PROBLEM_SWATCH_COLOR = '#ae8a1b';

/**
 * Read-only aerial canopy brief for assigned field inspectors.
 * Renders nothing when the assignment carries no aerial check (or aerial is off).
 * Never combines photo canopy percentages with ground area, loss rate, or severity.
 */
export function OfficeAerialCheckCard({
  accessToken,
  assignment,
}: {
  accessToken?: string | null;
  assignment: FieldValidationAssignment;
}) {
  const theme = useTheme();
  const [mode, setMode] = useState<AerialViewMode>('overlay');
  useSyncRecordsRevision(); // re-read the disk when an aerial prefetch finishes

  const aerial = assignment.aerialCheck;
  if (!aerial) return null;

  const media = listOfficeMediaItems(assignment);
  const localUri = (kind: 'aerial-overlay' | 'aerial-preview') => {
    const entry = media.find((candidate) => candidate.kind === kind);
    return entry ? readOfficeMediaUri(assignment.ownerIdentity, entry) : null;
  };

  const showingOverlay = mode === 'overlay';
  const activeLocalUri = showingOverlay ? localUri('aerial-overlay') : localUri('aerial-preview');
  const activeUrl = showingOverlay
    ? buildMobileAerialOverlayUrl(assignment.id)
    : buildMobileAerialPreviewUrl(assignment.id);
  const activeLabel = showingOverlay
    ? OFFICE_AERIAL_COPY.overlayLabel
    : OFFICE_AERIAL_COPY.photoLabel;
  const readyOffline = isAerialBriefReadyOffline(assignment.ownerIdentity, assignment);

  return (
    <View
      testID="field-validation.aerial-brief"
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.heading}>
        <Feather name="eye" size={20} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>{OFFICE_AERIAL_COPY.title}</Text>
        <Pill label={OFFICE_AERIAL_COPY.badge} variant="warning" size="sm" />
        {readyOffline ? (
          <Pill label={OFFICE_AERIAL_COPY.readyOffline} variant="success" size="sm" />
        ) : null}
      </View>

      <View
        style={[
          styles.toggleRow,
          { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
        ]}
        accessibilityRole="tablist">
        <Pressable
          testID="field-validation.aerial-brief.mode-overlay"
          accessibilityRole="button"
          accessibilityState={{ selected: showingOverlay }}
          onPress={() => setMode('overlay')}
          style={[
            styles.toggleButton,
            showingOverlay ? { backgroundColor: theme.primary } : null,
          ]}>
          <Text
            style={[
              styles.toggleText,
              { color: showingOverlay ? theme.onPrimary : theme.text },
            ]}>
            {OFFICE_AERIAL_COPY.overlayTab}
          </Text>
        </Pressable>
        <Pressable
          testID="field-validation.aerial-brief.mode-preview"
          accessibilityRole="button"
          accessibilityState={{ selected: !showingOverlay }}
          onPress={() => setMode('preview')}
          style={[
            styles.toggleButton,
            !showingOverlay ? { backgroundColor: theme.primary } : null,
          ]}>
          <Text
            style={[
              styles.toggleText,
              { color: !showingOverlay ? theme.onPrimary : theme.text },
            ]}>
            {OFFICE_AERIAL_COPY.photoTab}
          </Text>
        </Pressable>
      </View>

      <GuardedPhoto
        accessToken={accessToken}
        emptyText={OFFICE_AERIAL_COPY.unavailable}
        label={activeLabel}
        localUri={activeLocalUri}
        testID="field-validation.aerial-brief.photo"
        url={activeUrl}
      />

      {showingOverlay ? (
        <View style={styles.legendRow} testID="field-validation.aerial-brief.legend">
          <View style={[styles.swatch, { backgroundColor: PROBLEM_SWATCH_COLOR }]} />
          <Text style={[styles.caption, { color: theme.textSecondary }]}>
            {OFFICE_AERIAL_COPY.overlaySwatchLabel}
          </Text>
        </View>
      ) : null}

      <Row
        label={OFFICE_AERIAL_COPY.abnormalLabel}
        value={
          aerial.enoughCanopy && aerial.abnormalCanopyPercent !== null
            ? `${aerial.abnormalCanopyPercent.toFixed(1)}%`
            : OFFICE_AERIAL_COPY.lowCanopyNotice
        }
      />
      <Row
        label={OFFICE_AERIAL_COPY.canopyLabel}
        value={`${aerial.canopyCoveragePercent.toFixed(1)}%`}
      />
      <Row
        label={OFFICE_AERIAL_COPY.checkedLabel}
        value={formatDateTime(aerial.createdAt, aerial.createdAt)}
      />
      <Text
        testID="field-validation.aerial-brief.guardrail"
        style={[styles.caption, { color: theme.textSecondary }]}>
        {OFFICE_AERIAL_COPY.guardrail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.md },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  title: { ...Typography.subheading, fontWeight: '800' },
  toggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 3,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  toggleText: { ...Typography.caption, fontWeight: '700' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  swatch: { width: 12, height: 12, borderRadius: 3 },
  caption: { ...Typography.caption },
});
