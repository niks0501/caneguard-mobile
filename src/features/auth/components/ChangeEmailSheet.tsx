import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FARMER_COPY } from '@/constants/copy';
import { farmerAuthErrorMessage } from '@/features/auth/authErrorCopy';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

/**
 * Change-email form (F2) as a native sheet route with its confirmation
 * gate (C8). Same lifecycle as the password sheet: the error stays inside
 * the sheet on failure, typed values are kept, and success signs out to
 * the login route.
 */
export function ChangeEmailSheet() {
  const { language } = useLanguagePreference();
  const copy = FARMER_COPY[language].accountSecurityForms;
  const common = copy.common;
  const emailCopy = copy.email;
  const { showToast } = useToast();
  const { changeEmail, errorMessage, user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const authError = isFarmer
    ? farmerAuthErrorMessage(errorMessage, FARMER_COPY[language].authErrors)
    : errorMessage;
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState(false);
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
    setAttempted(true);
    try {
      const changed = await changeEmail({
        currentPassword: emailPassword,
        email: newEmail,
      });
      if (changed) {
        setClosed(true);
        showToast(isFarmer ? emailCopy.toast : 'Email updated', 'success');
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
      title={isFarmer ? emailCopy.title : 'Change email'}
      cancelLabel={isFarmer ? common.cancel : undefined}
      closeAccessibilityLabel={isFarmer ? common.close : undefined}
      discardTitle={isFarmer ? common.discardTitle : undefined}
      discardMessage={isFarmer ? common.discardMessage : undefined}
      keepEditingLabel={isFarmer ? common.keepEditing : undefined}
      discardLabel={isFarmer ? common.discard : undefined}
      testID="account-security.email-sheet"
      errorMessage={attempted ? authError : null}
      errorTestID="account-security.error"
      isDirty={dirty}
      onCancel={close}
      onSubmit={() => setShowConfirm(true)}
      submitDisabled={!submittable}
      submitLoading={pending}
      submitLoadingLabel={isFarmer ? emailCopy.updating : 'Updating...'}
      submitLabel={isFarmer ? emailCopy.submit : 'Change email'}
      submitTestID="account-security.change-email">
      <TextField
        testID="account-security.new-email"
        label={isFarmer ? emailCopy.newEmail : 'New email'}
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
        label={isFarmer ? emailCopy.currentPassword : 'Current password'}
        value={emailPassword}
        onChangeText={setEmailPassword}
        placeholder={isFarmer ? emailCopy.confirmPassword : 'Confirm to change email'}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        editable={!pending}
      />
      <ConfirmDialog
        visible={showConfirm}
        title={isFarmer ? emailCopy.confirmTitle : 'Change email?'}
        message={isFarmer ? emailCopy.confirmMessage : 'Changing your email signs out every active session and requires verification of the new address.'}
        confirmLabel={isFarmer ? emailCopy.confirm : 'Confirm change'}
        cancelLabel={isFarmer ? common.cancel : 'Cancel'}
        overlay
        testID="account-security.confirm-dialog-email"
        onConfirm={() => void submit()}
        onCancel={() => setShowConfirm(false)}
      />
    </SheetScreen>
  );
}
