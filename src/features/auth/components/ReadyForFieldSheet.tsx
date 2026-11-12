import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { SheetScreen } from '@/components/ui/SheetScreen';
import { READY_FOR_FIELD_COPY } from '@/constants/copy';
import { Typography } from '@/constants/theme';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme } from '@/hooks/use-theme';

/**
 * One-time sheet after a password sign-in. Its single action opens the
 * existing biometric setup in Account security; it stores nothing itself.
 */
export function ReadyForFieldSheet() {
  const theme = useTheme();
  const { user } = useAuth();
  const isFarmer = user?.role === 'farmer';

  // Offline visit work is an inspector task; farmers are never shown this sheet.
  useEffect(() => {
    if (isFarmer) {
      router.back();
    }
  }, [isFarmer]);

  const openSetup = () => {
    router.replace('/account-security');
  };

  if (isFarmer) {
    return null;
  }

  return (
    <SheetScreen
      testID="ready-for-field.sheet"
      title={READY_FOR_FIELD_COPY.sheetTitle}
      cancelLabel={READY_FOR_FIELD_COPY.sheetNotNow}
      cancelTestID="ready-for-field.dismiss"
      submitLabel={READY_FOR_FIELD_COPY.sheetSetUp}
      submitTestID="ready-for-field.setup"
      onCancel={() => router.back()}
      onSubmit={openSetup}>
      <Text style={[styles.body, { color: theme.text }]}>{READY_FOR_FIELD_COPY.sheetBody}</Text>
      <Text style={[styles.note, { color: theme.textSecondary }]}>
        {READY_FOR_FIELD_COPY.sheetNote}
      </Text>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  body: { ...Typography.body },
  note: { ...Typography.caption },
});
