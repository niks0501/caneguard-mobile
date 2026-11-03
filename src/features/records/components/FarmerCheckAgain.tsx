import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { Spacing, Typography } from '@/constants/theme';
import { useScanSession } from '@/features/detection/context/useScanSession';
import { returnToTab } from '@/features/navigation/returnToTab';
import { CheckHistorySection } from '@/features/records/components/CheckHistorySection';
import type { ScanRecordDetails } from '@/features/records/domain/recordTypes';
import { useScanCheckHistory } from '@/features/records/hooks/useRecords';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

/** Starts a Check Again for a saved record; every follow-up links to the first check. */
export function useStartCheckAgain(record: Pick<ScanRecordDetails, 'id' | 'followsUpScanId'>) {
  const { dispatch } = useScanSession();
  const originalId = record.followsUpScanId ?? record.id;
  return () => {
    dispatch({ type: 'START_FOLLOW_UP', payload: { scanId: originalId } });
    returnToTab('/scan');
  };
}

/**
 * Farmer-only part of the saved record screen: start a Check Again and review
 * the checks of this plant in date order. Render it for farmer sessions only.
 */
export function FarmerCheckAgain({
  record,
  hideAction = false,
}: {
  record: ScanRecordDetails;
  /** The What now? card already carries the Check Again link. */
  hideAction?: boolean;
}) {
  const theme = useTheme();
  const copy = useFarmerCopy().checkAgain;
  const startCheckAgain = useStartCheckAgain(record);
  const history = useScanCheckHistory(record.id, true);
  // A check keeps its note even when deleting the first check leaves it alone.
  const showHistory =
    history.length > 1 || history.some((item) => Boolean(item.personalNote));

  return (
    <>
      {hideAction ? null : (
        <View style={styles.action}>
          <Text style={[styles.hint, { color: theme.textSecondary }]}>{copy.actionHint}</Text>
          <AppButton
            testID="records.check-again"
            onPress={startCheckAgain}
            leadingIcon="camera"
            variant="secondary">
            {copy.action}
          </AppButton>
        </View>
      )}
      {showHistory ? (
        <CheckHistorySection
          currentId={record.id}
          history={history}
          onOpen={(id) =>
            router.push({ pathname: '/record-details', params: { id } } as unknown as Href)
          }
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  action: { gap: Spacing.sm },
  hint: { ...Typography.bodySmall },
});
