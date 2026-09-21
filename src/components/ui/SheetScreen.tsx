import { Feather } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SheetScreenProps = {
  cancelLabel?: string;
  cancelTestID?: string;
  children: ReactNode;
  errorMessage?: string | null;
  errorTestID?: string;
  isDirty?: boolean;
  onCancel: () => void;
  onSubmit?: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
  submitLoading?: boolean;
  submitLoadingLabel?: string;
  submitTestID?: string;
  testID?: string;
  title: string;
};

/**
 * Shared shell for the native sheet routes (`presentation: 'formSheet'`).
 * The route itself is the sheet, so this shell renders the title row, the
 * scrollable body above the keyboard, and a sticky footer — no overlay,
 * no second navigation system. Dismissal, back handling, and keyboard
 * avoidance come from the native stack; the dirty-draft guard reuses the
 * existing confirm pattern.
 */
export function SheetScreen({
  cancelLabel = 'Cancel',
  cancelTestID,
  children,
  errorMessage,
  errorTestID = 'sheet.error',
  isDirty = false,
  onCancel,
  onSubmit,
  submitDisabled = false,
  submitLabel = 'Save',
  submitLoading = false,
  submitLoadingLabel = 'Saving...',
  submitTestID = 'sheet.submit',
  testID,
  title,
}: SheetScreenProps) {
  const theme = useTheme();
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const handleDismiss = () => {
    if (submitLoading) {
      return;
    }
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  };

  return (
    <View
      testID={testID}
      accessibilityViewIsModal
      style={[styles.sheet, { backgroundColor: theme.surfaceElevated }]}>
      <View style={[styles.header, { borderBottomColor: theme.divider }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.primaryDark }]}>
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          disabled={submitLoading}
          hitSlop={8}
          onPress={handleDismiss}
          style={styles.closeButton}>
          <Feather name="x" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoiding}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {errorMessage ? (
            <Text
              testID={errorTestID}
              accessibilityLiveRegion="assertive"
              style={[styles.error, { color: theme.danger }]}>
              {errorMessage}
            </Text>
          ) : null}
          {children}
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[
          styles.footer,
          { borderTopColor: theme.divider, backgroundColor: theme.surfaceElevated },
        ]}>
        <AppButton
          testID={cancelTestID}
          variant="secondary"
          onPress={handleDismiss}
          disabled={submitLoading}
          style={styles.footerButton}>
          {cancelLabel}
        </AppButton>
        {onSubmit ? (
          <AppButton
            testID={submitTestID}
            onPress={onSubmit}
            disabled={submitDisabled || submitLoading}
            style={styles.footerButton}>
            {submitLoading ? submitLoadingLabel : submitLabel}
          </AppButton>
        ) : null}
      </View>

      <ConfirmDialog
        visible={showDiscardConfirm}
        title="Discard changes?"
        message="You have unsaved changes. Do you want to discard them?"
        cancelLabel="Keep editing"
        confirmLabel="Discard"
        destructive
        overlay
        onConfirm={() => {
          setShowDiscardConfirm(false);
          onCancel();
        }}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  title: {
    ...Typography.heading,
  },
  closeButton: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  error: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.xl,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
