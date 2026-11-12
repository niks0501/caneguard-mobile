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
import { FARMER_COPY } from '@/constants/copy';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

/**
 * Change-password form (F1) as a native sheet route with its confirmation
 * gate (C7). The sheet stays open while the request is in flight, shows the
 * existing inline error inside itself on failure with typed values kept, and
 * closes only on success.
 */
export function ChangePasswordSheet() {
  const { language } = useLanguagePreference();
  const copy = FARMER_COPY[language].accountSecurityForms;
  const common = copy.common;
  const passwordCopy = copy.password;
  const { showToast } = useToast();
  const { changePassword, errorMessage, user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState(false);
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
    setAttempted(true);
    try {
      const changed = await changePassword({
        currentPassword,
        password: newPassword,
      });
      if (changed) {
        setClosed(true);
        showToast(isFarmer ? passwordCopy.toast : 'Password updated', 'success');
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
      title={isFarmer ? passwordCopy.title : 'Change password'}
      cancelLabel={isFarmer ? common.cancel : undefined}
      closeAccessibilityLabel={isFarmer ? common.close : undefined}
      discardTitle={isFarmer ? common.discardTitle : undefined}
      discardMessage={isFarmer ? common.discardMessage : undefined}
      keepEditingLabel={isFarmer ? common.keepEditing : undefined}
      discardLabel={isFarmer ? common.discard : undefined}
      testID="account-security.password-sheet"
      errorMessage={attempted ? errorMessage : null}
      errorTestID="account-security.error"
      isDirty={dirty}
      onCancel={close}
      onSubmit={() => setShowConfirm(true)}
      submitDisabled={!submittable}
      submitLoading={pending}
      submitLoadingLabel={isFarmer ? passwordCopy.updating : 'Updating...'}
      submitLabel={isFarmer ? passwordCopy.submit : 'Change password'}
      submitTestID="account-security.change-password">
      <TextField
        testID="account-security.current-password"
        label={isFarmer ? passwordCopy.currentPassword : 'Current password'}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        placeholder={isFarmer ? passwordCopy.currentPassword : 'Current password'}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        editable={!pending}
      />
      <TextField
        testID="account-security.new-password"
        label={isFarmer ? passwordCopy.newPassword : 'New password'}
        value={newPassword}
        onChangeText={setNewPassword}
        placeholder={isFarmer ? passwordCopy.newPassword : 'New password'}
        secureTextEntry
        maxLength={PASSWORD_MAX_LENGTH}
        autoCapitalize="none"
        textContentType="newPassword"
        editable={!pending}
      />
      <ConfirmDialog
        visible={showConfirm}
        title={isFarmer ? passwordCopy.confirmTitle : 'Change password?'}
        message={isFarmer ? passwordCopy.confirmMessage : 'Changing your password signs out every active session. You will need to sign in again with your new password.'}
        confirmLabel={isFarmer ? passwordCopy.confirm : 'Confirm change'}
        cancelLabel={isFarmer ? common.cancel : 'Cancel'}
        overlay
        testID="account-security.confirm-dialog-password"
        onConfirm={() => void submit()}
        onCancel={() => setShowConfirm(false)}
      />
    </SheetScreen>
  );
}
