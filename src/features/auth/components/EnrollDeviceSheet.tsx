import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';

/**
 * Device-enrollment form (F3) as a native sheet route with its confirmation
 * gate (C9). On success the sheet closes back to Account & security, which
 * shows the result banner from the returned notice — the banner must not be
 * rendered inside the closed sheet.
 */
export function EnrollDeviceSheet() {
  const { showToast } = useToast();
  const { enrollMobileDevice, errorMessage } = useAuth();
  const [deviceName, setDeviceName] = useState(
    Device.deviceName?.trim() || Device.modelName?.trim() || 'CaneGuard mobile device',
  );
  const [enrollmentPassword, setEnrollmentPassword] = useState('');
  const [pending, setPending] = useState(false);
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
    try {
      const enrolled = await enrollMobileDevice(enrollmentPassword, deviceName);
      if (enrolled) {
        showToast('Device enrolled', 'success');
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
      title="Device enrollment"
      testID="account-security.enrollment-sheet"
      errorMessage={errorMessage}
      errorTestID="account-security.error"
      isDirty={dirty}
      onCancel={close}
      onSubmit={() => setShowConfirm(true)}
      submitDisabled={!submittable}
      submitLoading={pending}
      submitLoadingLabel="Enrolling..."
      submitLabel="Enroll this installation"
      submitTestID="account-security.enroll-device">
      <TextField
        testID="account-security.device-name"
        label="Installation name"
        helpHintText="A name for this installation on the office system. It is stored securely and is not a hardware identifier."
        value={deviceName}
        onChangeText={setDeviceName}
        placeholder="CaneGuard mobile device"
        maxLength={120}
        textContentType="none"
        editable={!pending}
      />
      <TextField
        testID="account-security.enrollment-password"
        label="Current password"
        value={enrollmentPassword}
        onChangeText={setEnrollmentPassword}
        placeholder="Confirm this installation"
        secureTextEntry
        autoCapitalize="none"
        textContentType="password"
        editable={!pending}
      />
      <ConfirmDialog
        visible={showConfirm}
        title="Enroll this installation?"
        message="This installation will be enrolled with a fresh server session. Existing sessions on other device identities are unchanged."
        confirmLabel="Enroll"
        cancelLabel="Cancel"
        overlay
        testID="account-security.confirm-dialog-enrollment"
        onConfirm={() => void submit()}
        onCancel={() => setShowConfirm(false)}
      />
    </SheetScreen>
  );
}
