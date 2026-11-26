import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { AppButton } from '@/components/ui/AppButton';
import { Spacing, Typography } from '@/constants/theme';
import { FarmerInquiryTracker } from '@/features/farmer-care/components/FarmerInquiryTracker';
import { deleteUnsentFarmerInquiry } from '@/features/farmer-care/data/farmerCareRepository';
import { useFarmerCare, useInquiryForScan } from '@/features/farmer-care/hooks/useFarmerCare';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

/**
 * Farmer-only, on a saved scan: either the optional "ask the office to look"
 * action, or where the question stands. Asking is always the farmer's choice;
 * saving a scan never sends anything.
 */
export function FarmerAskOffice({ scanId }: { scanId: string }) {
  const theme = useTheme();
  const database = useCaneGuardDatabase();
  const copy = useFarmerCopy().care;
  const { isFarmer, ownerIdentity } = useFarmerCare();
  const inquiry = useInquiryForScan(scanId);
  if (!isFarmer || !ownerIdentity) return null;

  const openSheet = () => router.push({ pathname: '/ask-office', params: { scanId } });
  if (inquiry) {
    return (
      <FarmerInquiryTracker
        inquiry={inquiry}
        onAskAgain={openSheet}
        onRemoveUnsent={() => deleteUnsentFarmerInquiry(database, ownerIdentity, inquiry.id)}
      />
    );
  }
  return (
    <View style={styles.action}>
      <Text style={[styles.hint, { color: theme.textSecondary }]}>{copy.ask.actionHint}</Text>
      <AppButton testID="farmer-care.ask" onPress={openSheet} leadingIcon="message-circle" variant="secondary">
        {copy.ask.action}
      </AppButton>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { gap: Spacing.sm },
  hint: { ...Typography.caption },
});
