import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

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
  confirmTestID?: string;
  cancelTestID?: string;
  style?: StyleProp<ViewStyle>;
  overlay?: boolean;
  onRequestClose?: () => void;
};

export function ConfirmDialog({
  cancelLabel = 'Cancel',
  cancelTestID,
  confirmLabel = 'Confirm',
  confirmTestID,
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
      <ScrollView
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
        style={styles.messageScroll}
        testID={`${testID}.message-scroll`}>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>
      </ScrollView>
      <View style={styles.actions} testID={`${testID}.actions`}>
        <View style={styles.actionBtn}>
          <AppButton
            onPress={onCancel}
            testID={cancelTestID ?? `${testID}.cancel`}
            variant="secondary">
            {cancelLabel}
          </AppButton>
        </View>
        <View style={styles.actionBtn}>
          <AppButton
            onPress={onConfirm}
            testID={confirmTestID ?? `${testID}.confirm`}
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
    maxHeight: '100%',
    flexShrink: 1,
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
  messageScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  messageContent: {
    flexGrow: 0,
  },
  message: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  actionBtn: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 140,
    minWidth: 140,
  },
});
