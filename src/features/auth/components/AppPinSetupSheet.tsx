import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { FARMER_COPY } from '@/constants/copy';
import { Typography } from '@/constants/theme';
import { farmerAuthErrorMessage } from '@/features/auth/authErrorCopy';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { APP_PIN_LENGTH, isValidAppPin } from '@/features/auth/services/appPinAuth';
import { useTheme } from '@/hooks/use-theme';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

/**
 * Native sheet route for setting or changing the 4-digit CaneGuard Quick PIN.
 * Used both from Account & security and as a one-step optional prompt when an
 * inspector signs in on a phone with no OS screen lock.
 */
export function AppPinSetupSheet() {
  const theme = useTheme();
  const { language } = useLanguagePreference();
  const { showToast } = useToast();
  const { dismissInitialPinSetup, errorMessage, setupAppPin, user } = useAuth();
  const params = useLocalSearchParams<{ onboarding?: string | string[] }>();
  const isOnboarding =
    (Array.isArray(params.onboarding) ? params.onboarding[0] : params.onboarding) === '1';
  const isFarmer = user?.role === 'farmer';
  const formLanguage = isFarmer ? language : 'en';
  const copy = FARMER_COPY[formLanguage].accountSecurityForms;
  const common = copy.common;
  const pinCopy = copy.appPin;
  const displayedAuthError = isFarmer
    ? farmerAuthErrorMessage(errorMessage, FARMER_COPY[language].authErrors)
    : errorMessage;

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [closed, setClosed] = useState(false);

  const normalizeDigits = (value: string) =>
    value.replace(/\D/g, '').slice(0, APP_PIN_LENGTH);

  const close = () => {
    if (isOnboarding) {
      dismissInitialPinSetup();
    }
    setClosed(true);
    router.back();
  };

  const dirty = pin.length > 0 || confirmPin.length > 0;
  const submittable =
    !pending && pin.length === APP_PIN_LENGTH && confirmPin.length === APP_PIN_LENGTH;

  const submit = async () => {
    if (pending) return;
    if (!isValidAppPin(pin)) {
      setLocalError(pinCopy.invalidError);
      return;
    }
    if (pin !== confirmPin) {
      setLocalError(pinCopy.mismatchError);
      return;
    }
    setLocalError(null);
    setPending(true);
    try {
      const saved = await setupAppPin(pin);
      if (saved) {
        showToast(pinCopy.savedToast, 'success');
        setClosed(true);
        router.back();
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
      title={isOnboarding ? pinCopy.onboardingTitle : pinCopy.title}
      cancelLabel={isOnboarding ? pinCopy.skip : common.cancel}
      cancelTestID="account-security.app-pin-cancel"
      closeAccessibilityLabel={common.close}
      discardTitle={common.discardTitle}
      discardMessage={common.discardMessage}
      keepEditingLabel={common.keepEditing}
      discardLabel={common.discard}
      testID="account-security.app-pin-sheet"
      errorMessage={localError ?? displayedAuthError}
      errorTestID="account-security.app-pin-error"
      isDirty={!isOnboarding && dirty}
      onCancel={close}
      onSubmit={() => void submit()}
      submitDisabled={!submittable}
      submitLoading={pending}
      submitLoadingLabel={pinCopy.saving}
      submitLabel={pinCopy.submit}
      submitTestID="account-security.app-pin-submit">
      {isOnboarding ? (
        <Text style={[styles.hint, { color: theme.textSecondary }]}>
          {pinCopy.onboardingHint}
        </Text>
      ) : null}
      <TextField
        testID="account-security.app-pin-input"
        label={pinCopy.pinLabel}
        value={pin}
        onChangeText={(text) => {
          setLocalError(null);
          setPin(normalizeDigits(text));
        }}
        placeholder={pinCopy.pinPlaceholder}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={APP_PIN_LENGTH}
        editable={!pending}
      />
      <TextField
        testID="account-security.app-pin-confirm"
        label={pinCopy.confirmLabel}
        value={confirmPin}
        onChangeText={(text) => {
          setLocalError(null);
          setConfirmPin(normalizeDigits(text));
        }}
        placeholder={pinCopy.confirmPlaceholder}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={APP_PIN_LENGTH}
        editable={!pending}
      />
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  hint: {
    ...Typography.bodySmall,
  },
});
