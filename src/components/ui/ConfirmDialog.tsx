import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Card } from '@/components/ui/Card';
import { Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
  overlay?: boolean;
  onRequestClose?: () => void;
};

export function ConfirmDialog({
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  destructive = false,
  message,
  onCancel,
  onConfirm,
  onRequestClose,
  overlay = false,
  style,
  testID = 'confirm-dialog',
  title,
  visible,
}: ConfirmDialogProps) {
  const theme = useTheme();

  if (!visible) return null;

  const content = (
    <Card
      accessibilityRole="alert"
      style={[
        styles.card,
        overlay && styles.overlayCard,
        {
          backgroundColor: theme.surfaceElevated,
          borderColor: destructive ? theme.danger : theme.border,
        },
        style,
      ]}
      testID={testID}
      variant="elevated">
      <View style={styles.header}>
        <Feather
          name={destructive ? 'alert-triangle' : 'help-circle'}
          size={22}
          color={destructive ? theme.danger : theme.primary}
        />
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      </View>
      <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      <View style={styles.actions}>
        <View style={styles.actionBtn}>
          <AppButton
            onPress={onCancel}
            testID={`${testID}.cancel`}
            variant="secondary">
            {cancelLabel}
          </AppButton>
        </View>
        <View style={styles.actionBtn}>
          <AppButton
            onPress={onConfirm}
            testID={`${testID}.confirm`}
            variant={destructive ? 'danger' : 'primary'}>
            {confirmLabel}
          </AppButton>
        </View>
      </View>
    </Card>
  );

  if (overlay) {
    return (
      <View testID={`${testID}.overlay`} style={styles.overlay}>
        <Pressable
          accessibilityLabel="Dismiss confirmation"
          accessibilityRole="button"
          onPress={onRequestClose}
          style={StyleSheet.absoluteFill}
        />
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    zIndex: 1000,
  },
  overlayCard: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: Spacing.md,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.subheading,
    fontWeight: '700',
    flex: 1,
  },
  message: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
  },
});
