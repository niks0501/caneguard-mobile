import { Feather } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { IconSize, Radius, Spacing, Typography } from '@/constants/theme';
import { MODEL_FILENAME, MODEL_VERSION } from '@/features/detection/constants/modelContract';
import { useCaneGuardModel } from '@/features/detection/model/useCaneGuardModel';
import { useTheme } from '@/hooks/use-theme';

export default function ModelSmokeTestScreen() {
  const theme = useTheme();
  const modelState = useCaneGuardModel();

  const status =
    modelState.state === 'loading'
      ? {
          title: 'Loading model',
          detail: 'Resolving the bundled TensorFlow Lite asset and initializing the CPU runtime.',
          color: theme.info,
          background: theme.infoBg,
          icon: 'loader' as const,
        }
      : modelState.state === 'loaded'
        ? {
            title: 'Model loaded',
            detail: 'The native runtime loaded the bundled model and its tensors match the Model v0 contract.',
            color: theme.success,
            background: theme.successBg,
            icon: 'check-circle' as const,
          }
        : {
            title: 'Model failed to load',
            detail: 'The bundled asset, native runtime, or tensor contract could not be initialized.',
            color: theme.danger,
            background: theme.dangerBg,
            icon: 'alert-triangle' as const,
          };

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <ScreenHeader title="Model v0 smoke test" />

      <AppCard style={styles.card}>
        <View
          accessibilityLiveRegion={modelState.state === 'error' ? 'assertive' : 'polite'}
          style={[styles.statusIcon, { backgroundColor: status.background }]}>
          {modelState.state === 'loading' ? (
            <ActivityIndicator accessibilityLabel="Model loading" color={status.color} />
          ) : (
            <Feather name={status.icon} size={IconSize.xl} color={status.color} />
          )}
        </View>

        <Text accessibilityRole="header" style={[styles.statusTitle, { color: status.color }]}>
          {status.title}
        </Text>
        <Text style={[styles.detail, { color: theme.textSecondary }]}>{status.detail}</Text>

        <View style={[styles.metadata, { borderColor: theme.border }]}>
          <MetadataRow label="Asset" value={MODEL_FILENAME} />
          <MetadataRow label="Version" value={MODEL_VERSION} />
          <MetadataRow label="Delegate" value="CPU" />
          {modelState.state === 'loaded' ? (
            <>
              <MetadataRow
                label="Input"
                value={`${modelState.model.inputs[0].dataType} [${modelState.model.inputs[0].shape.join(', ')}]`}
              />
              <MetadataRow
                label="Output"
                value={`${modelState.model.outputs[0].dataType} [${modelState.model.outputs[0].shape.join(', ')}]`}
              />
            </>
          ) : null}
        </View>

        {modelState.state === 'error' && __DEV__ ? (
          <View style={[styles.errorDetail, { backgroundColor: theme.dangerBg }]}>
            <Text style={[styles.errorLabel, { color: theme.danger }]}>Development error detail</Text>
            <Text selectable style={[styles.errorMessage, { color: theme.text }]}>
              {modelState.error.message}
            </Text>
          </View>
        ) : null}
      </AppCard>

      <Text style={[styles.note, { color: theme.textSecondary }]}>
        Developer-only check. This route loads the model but does not run image inference.
      </Text>
    </ScreenContainer>
  );
}

function MetadataRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={styles.metadataRow}>
      <Text style={[styles.metadataLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text selectable style={[styles.metadataValue, { color: theme.text }]}>
        {value}
      </Text>
    </View>
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
  metadata: {
    alignSelf: 'stretch',
    borderTopWidth: 1,
    marginTop: Spacing.sm,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.lg,
  },
  metadataLabel: {
    ...Typography.label,
    width: 72,
  },
  metadataValue: {
    ...Typography.bodySmall,
    flex: 1,
  },
  errorDetail: {
    alignSelf: 'stretch',
    borderRadius: Radius.sm,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  errorLabel: {
    ...Typography.label,
  },
  errorMessage: {
    ...Typography.bodySmall,
  },
  note: {
    ...Typography.caption,
    textAlign: 'center',
  },
});
