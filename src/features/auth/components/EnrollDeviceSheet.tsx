import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { FARMER_COPY } from '@/constants/copy';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

/**
 * Device-enrollment form (F3) as a native sheet route with its confirmation
 * gate (C9). On success the sheet closes back to Account & security, which
 * shows the result banner from the returned notice — the banner must not be
 * rendered inside the closed sheet.
 */
export function EnrollDeviceSheet() {
  const { language } = useLanguagePreference();
  const copy = FARMER_COPY[language].accountSecurityForms;
  const common = copy.common;
  const enrollmentCopy = copy.enrollment;
  const { showToast } = useToast();
  const { enrollMobileDevice, errorMessage, user } = useAuth();
  const isFarmer = user?.role === 'farmer';
  const [deviceName, setDeviceName] = useState(
    Device.deviceName?.trim() || Device.modelName?.trim() || (isFarmer ? enrollmentCopy.namePlaceholder : 'CaneGuard mobile device'),
  );
  const [enrollmentPassword, setEnrollmentPassword] = useState('');
  const [pending, setPending] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [closed, setClosed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const close = () => {
    setClosed(true);
    router.back();
  };

  const dirty = enrollmentPassword.length > 0;
  const submittable = !pending && enrollmentPassword.length > 0 && deviceName.trim().length > 0;

  const submit = async () => {
    if (!submittable) {
      return;
    }
    setShowConfirm(false);
    setPending(true);
    setAttempted(true);
    try {
      const enrolled = await enrollMobileDevice(enrollmentPassword, deviceName);
      if (enrolled) {
        showToast(isFarmer ? enrollmentCopy.toast : 'Device enrolled', 'success');
        setClosed(true);
        router.dismissTo({
          params: { notice: 'enrolled' },
          pathname: '/account-security',
        });
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
      title={isFarmer ? enrollmentCopy.title : 'Device enrollment'}
      cancelLabel={isFarmer ? common.cancel : undefined}
      closeAccessibilityLabel={isFarmer ? common.close : undefined}
      discardTitle={isFarmer ? common.discardTitle : undefined}
      discardMessage={isFarmer ? common.discardMessage : undefined}
      keepEditingLabel={isFarmer ? common.keepEditing : undefined}
      discardLabel={isFarmer ? common.discard : undefined}
      testID="account-security.enrollment-sheet"
      errorMessage={attempted ? errorMessage : null}
      errorTestID="account-security.error"
      isDirty={dirty}
      onCancel={close}
      onSubmit={() => setShowConfirm(true)}
      submitDisabled={!submittable}
      submitLoading={pending}
      submitLoadingLabel={isFarmer ? enrollmentCopy.submitting : 'Enrolling...'}
      submitLabel={isFarmer ? enrollmentCopy.submit : 'Enroll this installation'}
      submitTestID="account-security.enroll-device">
      <TextField
        testID="account-security.device-name"
        label={isFarmer ? enrollmentCopy.name : 'Installation name'}
        helpHintText={isFarmer ? enrollmentCopy.nameHelp : 'A name for this installation on the office system. It is stored securely and is not a hardware identifier.'}
        value={deviceName}
        onChangeText={setDeviceName}
        placeholder={isFarmer ? enrollmentCopy.namePlaceholder : 'CaneGuard mobile device'}
        maxLength={120}
        textContentType="none"
        editable={!pending}
      />
      <TextField
        testID="account-security.enrollment-password"
        label={isFarmer ? enrollmentCopy.currentPassword : 'Current password'}
        value={enrollmentPassword}
        onChangeText={setEnrollmentPassword}
        placeholder={isFarmer ? enrollmentCopy.confirmPassword : 'Confirm this installation'}
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        editable={!pending}
      />
      <ConfirmDialog
        visible={showConfirm}
        title={isFarmer ? enrollmentCopy.confirmTitle : 'Enroll this installation?'}
        message={isFarmer ? enrollmentCopy.confirmMessage : 'This installation will be enrolled with a fresh server session. Existing sessions on other device identities are unchanged.'}
        confirmLabel={isFarmer ? enrollmentCopy.confirm : 'Enroll'}
        cancelLabel={isFarmer ? common.cancel : 'Cancel'}
        overlay
        testID="account-security.confirm-dialog-enrollment"
        onConfirm={() => void submit()}
        onCancel={() => setShowConfirm(false)}
      />
    </SheetScreen>
  );
}
