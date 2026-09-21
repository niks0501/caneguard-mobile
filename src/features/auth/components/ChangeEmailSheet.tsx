import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Change-email form (F2) as a native sheet route with its confirmation
 * gate (C8). Same lifecycle as the password sheet: the error stays inside
 * the sheet on failure, typed values are kept, and success signs out to
 * the login route.
 */
export function ChangeEmailSheet() {
  const { showToast } = useToast();
  const { changeEmail, errorMessage } = useAuth();
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const close = () => {
    setClosed(true);
    router.back();
  };

  const dirty = newEmail.length > 0 || emailPassword.length > 0;
  const submittable = !pending && emailPassword.length > 0 && newEmail.trim().length > 0;

  const submit = async () => {
    if (!submittable) {
      return;
    }
    setShowConfirm(false);
    setPending(true);
    try {
      const changed = await changeEmail({
        currentPassword: emailPassword,
        email: newEmail,
      });
      if (changed) {
        setClosed(true);
        showToast('Email updated', 'success');
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
      title="Change email"
      testID="account-security.email-sheet"
      errorMessage={errorMessage}
      errorTestID="account-security.error"
      isDirty={dirty}
      onCancel={close}
      onSubmit={() => setShowConfirm(true)}
      submitDisabled={!submittable}
      submitLoading={pending}
      submitLoadingLabel="Updating..."
      submitLabel="Change email"
      submitTestID="account-security.change-email">
      <TextField
        testID="account-security.new-email"
        label="New email"
        value={newEmail}
        onChangeText={setNewEmail}
        placeholder="you@example.com"
        maxLength={255}
        keyboardType="email-address"
        autoCapitalize="none"
        textContentType="emailAddress"
        editable={!pending}
      />
      <TextField
        testID="account-security.email-password"
        label="Current password"
        value={emailPassword}
        onChangeText={setEmailPassword}
        placeholder="Confirm to change email"
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        editable={!pending}
      />
      <ConfirmDialog
        visible={showConfirm}
        title="Change email?"
        message="Changing your email signs out every active session and requires verification of the new address."
        confirmLabel="Confirm change"
        cancelLabel="Cancel"
        overlay
        testID="account-security.confirm-dialog-email"
        onConfirm={() => void submit()}
        onCancel={() => setShowConfirm(false)}
      />
    </SheetScreen>
  );
}
