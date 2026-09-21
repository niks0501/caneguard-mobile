import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from '@/features/auth/components/passwordRules';

/**
 * Change-password form (F1) as a native sheet route with its confirmation
 * gate (C7). The sheet stays open while the request is in flight, shows the
 * existing inline error inside itself on failure with typed values kept, and
 * closes only on success.
 */
export function ChangePasswordSheet() {
  const { showToast } = useToast();
  const { changePassword, errorMessage } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const close = () => {
    setClosed(true);
    router.back();
  };

  const dirty = currentPassword.length > 0 || newPassword.length > 0;
  const submittable =
    !pending && currentPassword.length > 0 && newPassword.length >= PASSWORD_MIN_LENGTH;

  const submit = async () => {
    if (!submittable) {
      return;
    }
    setShowConfirm(false);
    setPending(true);
    try {
      const changed = await changePassword({
        currentPassword,
        password: newPassword,
      });
      if (changed) {
        setClosed(true);
        showToast('Password updated', 'success');
        router.replace('/login');
      }
    } finally {
      setPending(false);
    }
  };

  if (closed) {
    return null;
  }

  return (
    <SheetScreen
      title="Change password"
      testID="account-security.password-sheet"
      errorMessage={errorMessage}
      errorTestID="account-security.error"
      isDirty={dirty}
      onCancel={close}
      onSubmit={() => setShowConfirm(true)}
      submitDisabled={!submittable}
      submitLoading={pending}
      submitLoadingLabel="Updating..."
      submitLabel="Change password"
      submitTestID="account-security.change-password">
      <TextField
        testID="account-security.current-password"
        label="Current password"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder="Current password"
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        editable={!pending}
      />
      <TextField
        testID="account-security.new-password"
        label="New password"
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder="New password"
        secureTextEntry
        maxLength={PASSWORD_MAX_LENGTH}
        autoCapitalize="none"
        textContentType="newPassword"
        editable={!pending}
      />
      <ConfirmDialog
        visible={showConfirm}
        title="Change password?"
        message="Changing your password signs out every active session. You will need to sign in again with your new password."
        confirmLabel="Confirm change"
        cancelLabel="Cancel"
        overlay
        testID="account-security.confirm-dialog-password"
        onConfirm={() => void submit()}
        onCancel={() => setShowConfirm(false)}
      />
    </SheetScreen>
  );
}
