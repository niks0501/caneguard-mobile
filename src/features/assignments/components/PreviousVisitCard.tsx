import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import type { ReactNode } from 'react';

import { Pill } from '@/components/ui/Pill';
import { Row } from '@/components/ui/Row';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { PreviousVisitContext } from '@/features/assignments/domain/previousVisit';
import { useTheme } from '@/hooks/use-theme';

export function PreviousVisitCard({
  currentReporterConcern,
  photoAccessToken,
  previousVisit,
  previousVisitPhotoUrl,
}: {
  currentReporterConcern?: string | null;
  previousVisit?: PreviousVisitContext | null;
  previousVisitPhotoUrl?: string | null;
  photoAccessToken?: string | null;
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
        <PreviousVisitDetails
          photoAccessToken={photoAccessToken}
          previousVisit={previousVisit}
          previousVisitPhotoUrl={previousVisitPhotoUrl}
        />
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

function PreviousVisitDetails({
  photoAccessToken,
  previousVisit,
  previousVisitPhotoUrl,
}: {
  photoAccessToken?: string | null;
  previousVisit: PreviousVisitContext;
  previousVisitPhotoUrl?: string | null;
}) {
  const theme = useTheme();
  const evidence = [previousVisit.fieldObservation, previousVisit.fieldFinding]
    .filter(Boolean)
    .join(' · ');
  const photoSource = previousVisit.freshPhotoAvailable && previousVisitPhotoUrl
    ? {
        headers: photoAccessToken
          ? { Authorization: `Bearer ${photoAccessToken}` }
          : undefined,
        uri: previousVisitPhotoUrl,
      }
    : null;

  return (
    <View style={styles.details}>
      <Text style={[styles.source, { color: theme.textSecondary }]}>Previous visit · {formatTimestamp(previousVisit.visitedAt)} · {previousVisit.referenceCode}</Text>
      <ContextRow
        label="Previous concern"
        value={previousVisit.reporterSuspectedCondition ? <Pill label={`${previousVisit.reporterSuspectedCondition} · reported concern`} variant="warning" /> : <Text style={[styles.fallback, { color: theme.textSecondary }]}>Not reported</Text>}
      />
      <ContextRow
        label="Last staff classification"
        value={previousVisit.authorityClassifiedCondition ? <Pill label={previousVisit.authorityClassifiedCondition} variant="info" /> : <Text style={[styles.fallback, { color: theme.textSecondary }]}>Not classified</Text>}
      />
      <ContextRow
        label="Last action taken"
        value={previousVisit.actionTaken ? <Text style={[styles.value, { color: theme.text }]}>{previousVisit.actionTaken}</Text> : <Text style={[styles.fallback, { color: theme.textSecondary }]}>Not recorded</Text>}
      />
      <ContextRow
        label="Previous field evidence"
        value={
          <View style={styles.evidence}>
            {evidence ? <Text style={[styles.value, { color: theme.text }]}>{evidence}</Text> : null}
            {photoSource ? <ExpoImage accessibilityLabel="Previous field evidence photo" contentFit="cover" source={photoSource} style={styles.photo} /> : null}
            {!evidence && !photoSource ? <Text style={[styles.fallback, { color: theme.textSecondary }]}>No previous evidence</Text> : null}
          </View>
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
