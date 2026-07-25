import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import {
  CANEGUARD_DATABASE_FILENAME,
  useCompatibilityDatabaseProbe,
} from '@/database/compatibilitySpike';
import { useTheme } from '@/hooks/use-theme';

export default function StorageCompatibilityScreen() {
  if (!__DEV__) {
    return null;
  }

  return <DevelopmentStorageCompatibilityScreen />;
}

function DevelopmentStorageCompatibilityScreen() {
  const theme = useTheme();
  const { success, error, probePersisted } = useCompatibilityDatabaseProbe();

  const status = error
    ? {
        title: 'Migration failed',
        detail: error.message,
        color: theme.danger,
        background: theme.dangerBg,
        icon: 'alert-triangle' as const,
      }
    : !success
      ? {
          title: 'Applying migration',
          detail: 'Opening the local database and applying bundled SQL.',
          color: theme.info,
          background: theme.infoBg,
          icon: 'loader' as const,
        }
      : probePersisted === null
        ? {
            title: 'Checking persistence',
            detail: 'Writing and reading the Phase 0 compatibility probe.',
            color: theme.info,
            background: theme.infoBg,
            icon: 'loader' as const,
          }
        : probePersisted
          ? {
              title: 'Compatibility migration ready',
              detail: 'The bundled SQL migration ran and the local probe row is available.',
              color: theme.success,
              background: theme.successBg,
              icon: 'check-circle' as const,
            }
          : {
              title: 'Persistence check failed',
              detail: 'The migration ran, but the local compatibility probe could not be read back.',
              color: theme.danger,
              background: theme.dangerBg,
              icon: 'alert-triangle' as const,
            };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <ScreenHeader title="Storage compatibility" />
      <AppCard style={styles.card}>
        <View
          accessibilityLiveRegion={error || probePersisted === false ? 'assertive' : 'polite'}
          style={[styles.statusIcon, { backgroundColor: status.background }]}>
          {status.icon === 'loader' ? (
            <ActivityIndicator accessibilityLabel={status.title} color={status.color} />
          ) : (
            <Feather name={status.icon} size={IconSize.xl} color={status.color} />
          )}
        </View>
        <Text accessibilityRole="header" style={[styles.statusTitle, { color: status.color }]}>
          {status.title}
        </Text>
        <Text style={[styles.detail, { color: theme.textSecondary }]}>{status.detail}</Text>
        <Text style={[styles.databaseName, { color: theme.textSecondary }]}>
          Database: {CANEGUARD_DATABASE_FILENAME}
        </Text>
      </AppCard>
      <Text style={[styles.note, { color: theme.textSecondary }]}>
        Developer-only Phase 0 proof. Phase 1 replaces the compatibility table with the approved
        local-record schema.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: Spacing['2xl'],
  },
  card: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: {
    ...Typography.heading,
    textAlign: 'center',
  },
  detail: {
    ...Typography.body,
    textAlign: 'center',
  },
  databaseName: {
    ...Typography.bodySmall,
  },
  note: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
