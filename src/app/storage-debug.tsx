import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Spacing, Typography } from '@/constants/theme';
import { useStorageDiagnostics } from '@/database/useStorageDiagnostics';
import { useTheme } from '@/hooks/use-theme';

export default function StorageDebugScreen() {
  if (!__DEV__) {
    return null;
  }

  return <DevelopmentStorageDebugScreen />;
}

function DevelopmentStorageDebugScreen() {
  const theme = useTheme();
  const { diagnostics, error, refresh, status } = useStorageDiagnostics();

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <ScreenHeader title="Storage diagnostics" />
      <AppCard style={styles.card}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.primaryDark }]}>
          Database foundation
        </Text>
        <DiagnosticRow label="Initialization" value={status} />
        <DiagnosticRow
          label="Database"
          value={diagnostics?.databaseFilename ?? 'Loading'}
        />
        <DiagnosticRow
          label="Foreign keys"
          value={
            diagnostics
              ? diagnostics.foreignKeysEnabled
                ? 'enabled'
                : 'disabled'
              : 'Loading'
          }
        />
        {diagnostics ? (
          <>
            <DiagnosticRow label="Scan records" value={diagnostics.rowCounts.records} />
            <DiagnosticRow label="Class scores" value={diagnostics.rowCounts.classScores} />
            <DiagnosticRow label="Symptoms" value={diagnostics.rowCounts.symptoms} />
            <DiagnosticRow
              label="Quality warnings"
              value={diagnostics.rowCounts.qualityWarnings}
            />
            <DiagnosticRow label="Orphan images" value="Phase 2" />
          </>
        ) : error ? (
          <View accessibilityRole="alert" style={styles.state}>
            <Feather name="alert-triangle" size={20} color={theme.danger} />
            <Text style={[styles.stateText, { color: theme.danger }]}>
              Diagnostics failed: {error}
            </Text>
          </View>
        ) : (
          <View accessibilityLiveRegion="polite" style={styles.state}>
            <ActivityIndicator accessibilityLabel="Loading storage diagnostics" color={theme.primary} />
            <Text style={[styles.stateText, { color: theme.textSecondary }]}>
              Reading database state
            </Text>
          </View>
        )}
        <AppButton onPress={refresh} variant="secondary" leadingIcon="refresh-cw">
          Refresh Diagnostics
        </AppButton>
      </AppCard>
      <Text style={[styles.note, { color: theme.textSecondary }]}>
        Developer-only route. Database reset is intentionally not available.
      </Text>
    </ScreenContainer>
  );
}

function DiagnosticRow({ label, value }: { label: string; value: number | string }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing.xl,
  },
  card: {
    gap: Spacing.md,
  },
  title: {
    ...Typography.heading,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  label: {
    ...Typography.bodySmall,
  },
  value: {
    ...Typography.bodySmall,
    fontWeight: '800',
  },
  state: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stateText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  note: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
