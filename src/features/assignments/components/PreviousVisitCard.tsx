import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { Pill } from '@/components/ui/Pill';
import { Row } from '@/components/ui/Row';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { PreviousVisit } from '@/features/assignments/domain/previousVisit';
import { useTheme } from '@/hooks/use-theme';

export function PreviousVisitCard({
  currentReporterConcern,
  previousVisit,
}: {
  currentReporterConcern?: string | null;
  previousVisit?: PreviousVisit | null;
}) {
  const theme = useTheme();

  return (
    <View
      testID="field-validation.previous-visit"
      style={[styles.card, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
      <View style={styles.heading}>
        <Feather name="clock" size={20} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>Previous visit</Text>
      </View>
      {previousVisit ? (
        <PreviousVisitDetails previousVisit={previousVisit} />
      ) : (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No previous visit recorded for this farm on this device</Text>
          {currentReporterConcern ? (
            <View style={styles.currentConcern}>
              <Text style={[styles.caption, { color: theme.textSecondary }]}>This case was reported as</Text>
              <Pill label={`${currentReporterConcern} · reported concern`} variant="warning" />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

function PreviousVisitDetails({ previousVisit }: { previousVisit: PreviousVisit }) {
  const theme = useTheme();
  const completion = previousVisit.completion;
  const evidence = completion
    ? [completion.fieldObservation, completion.fieldFinding].filter(Boolean).join(' · ')
    : null;

  return (
    <View style={styles.details}>
      <Text style={[styles.source, { color: theme.textSecondary }]}>Previous visit · {formatTimestamp(previousVisit.visitedAt)} · {previousVisit.assignment.referenceCode}</Text>
      <ContextRow
        label="Previous concern"
        value={previousVisit.reporterConcern ? <Pill label={`${previousVisit.reporterConcern} · reported concern`} variant="warning" /> : <Text style={[styles.fallback, { color: theme.textSecondary }]}>Not reported on this device</Text>}
      />
      <ContextRow
        label="Last staff classification"
        value={<Text style={[styles.fallback, { color: theme.textSecondary }]}>Not received on this device</Text>}
      />
      <ContextRow
        label="Last action taken"
        value={completion?.actionTaken ? <Text style={[styles.value, { color: theme.text }]}>{completion.actionTaken}</Text> : <Text style={[styles.fallback, { color: theme.textSecondary }]}>Not recorded on this device</Text>}
      />
      <ContextRow
        label="Previous field evidence"
        value={
          completion ? (
            <View style={styles.evidence}>
              {evidence ? <Text style={[styles.value, { color: theme.text }]}>{evidence}</Text> : null}
              {completion.freshPhotoUri ? <ExpoImage accessibilityLabel="Previous field evidence photo" contentFit="cover" source={{ uri: completion.freshPhotoUri }} style={styles.photo} /> : null}
              {!evidence && !completion.freshPhotoUri ? <Text style={[styles.fallback, { color: theme.textSecondary }]}>No previous evidence on this device</Text> : null}
            </View>
          ) : (
            <Text style={[styles.fallback, { color: theme.textSecondary }]}>No previous evidence on this device</Text>
          )
        }
      />
    </View>
  );
}

function ContextRow({ label, value }: { label: string; value: ReactNode }) {
  return <Row label={label} value={value} numberOfLines={4} />;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.lg },
  heading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  title: { ...Typography.subheading, fontWeight: '800' },
  details: { gap: Spacing.sm },
  source: { ...Typography.caption },
  empty: { gap: Spacing.sm },
  emptyText: { ...Typography.bodySmall },
  currentConcern: { gap: Spacing.xs },
  caption: { ...Typography.caption },
  fallback: { ...Typography.caption, textAlign: 'right', flexShrink: 1 },
  value: { ...Typography.caption, fontWeight: '700', textAlign: 'right', flexShrink: 1 },
  evidence: { alignItems: 'flex-end', gap: Spacing.xs, maxWidth: '68%' },
  photo: { width: 96, height: 72, borderRadius: Radius.md },
});
