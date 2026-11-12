import { router } from 'expo-router';
import { useState } from 'react';

import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FARMER_COPY } from '@/constants/copy';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

/**
 * Biometric-disable form (F4) as a native sheet route. Deliberately ungated
 * (C10): the current-password field itself is the step-up, and re-enabling
 * reverses the action.
 */
export function DisableBiometricSheet() {
  const { language } = useLanguagePreference();
  const copy = FARMER_COPY[language].accountSecurityForms;
  const common = copy.common;
  const biometricCopy = copy.biometric;
  const { showToast } = useToast();
  const { disableBiometric, errorMessage, user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const [disablePassword, setDisablePassword] = useState('');
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [closed, setClosed] = useState(false);

  const close = () => {
    setClosed(true);
    router.back();
  };

  const dirty = disablePassword.length > 0;
  const submittable = !pending && disablePassword.length > 0;

  const submit = async () => {
    if (!submittable) {
      return;
    }
    setPending(true);
    setAttempted(true);
    try {
      const disabled = await disableBiometric(disablePassword);
      if (disabled) {
        setClosed(true);
        showToast(isFarmer ? biometricCopy.toast : 'Biometrics disabled', 'info');
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
      title={isFarmer ? biometricCopy.title : 'Disable biometric unlock'}
      cancelLabel={isFarmer ? common.cancel : undefined}
      closeAccessibilityLabel={isFarmer ? common.close : undefined}
      discardTitle={isFarmer ? common.discardTitle : undefined}
      discardMessage={isFarmer ? common.discardMessage : undefined}
      keepEditingLabel={isFarmer ? common.keepEditing : undefined}
      discardLabel={isFarmer ? common.discard : undefined}
      testID="account-security.biometric-sheet"
      errorMessage={attempted ? errorMessage : null}
      errorTestID="account-security.error"
      isDirty={dirty}
      onCancel={close}
      onSubmit={() => void submit()}
      submitDisabled={!submittable}
      submitLoading={pending}
      submitLoadingLabel={isFarmer ? biometricCopy.submitting : 'Disabling...'}
      submitLabel={isFarmer ? biometricCopy.submit : 'Disable biometric unlock'}
      submitTestID="account-security.disable-biometric">
      <TextField
        testID="account-security.disable-biometric-password"
        label={isFarmer ? biometricCopy.currentPassword : 'Current password'}
        value={disablePassword}
        onChangeText={setDisablePassword}
        placeholder={isFarmer ? biometricCopy.confirmPassword : 'Confirm to disable'}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        editable={!pending}
      />
    </SheetScreen>
  );
}
