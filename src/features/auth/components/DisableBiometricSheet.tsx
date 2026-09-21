import { router } from 'expo-router';
import { useState } from 'react';

import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Biometric-disable form (F4) as a native sheet route. Deliberately ungated
 * (C10): the current-password field itself is the step-up, and re-enabling
 * reverses the action.
 */
export function DisableBiometricSheet() {
  const { showToast } = useToast();
  const { disableBiometric, errorMessage } = useAuth();
  const [disablePassword, setDisablePassword] = useState('');
  const [pending, setPending] = useState(false);
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
    try {
      const disabled = await disableBiometric(disablePassword);
      if (disabled) {
        setClosed(true);
        showToast('Biometrics disabled', 'info');
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
      title="Disable biometric unlock"
      testID="account-security.biometric-sheet"
      errorMessage={errorMessage}
      errorTestID="account-security.error"
      isDirty={dirty}
      onCancel={close}
      onSubmit={() => void submit()}
      submitDisabled={!submittable}
      submitLoading={pending}
      submitLoadingLabel="Disabling..."
      submitLabel="Disable biometric unlock"
      submitTestID="account-security.disable-biometric">
      <TextField
        testID="account-security.disable-biometric-password"
        label="Current password"
        value={disablePassword}
        onChangeText={setDisablePassword}
        placeholder="Confirm to disable"
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        editable={!pending}
      />
    </SheetScreen>
  );
}
