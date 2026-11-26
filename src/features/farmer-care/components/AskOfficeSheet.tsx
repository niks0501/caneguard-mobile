import { randomUUID } from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCaneGuardDatabase } from '@/database/DatabaseProvider';
import { SheetScreen } from '@/components/ui/SheetScreen';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { BarangayPicker } from '@/features/reports/components/BarangayPicker';
import { NASUGBU_BARANGAYS } from '@/features/reports/referenceData/nasugbuSeed';
import { enqueueFarmerInquiry } from '@/features/farmer-care/data/farmerCareRepository';
import { FARMER_AI_LABELS, FARMER_CONCERNS, type FarmerConcern } from '@/features/farmer-care/domain/farmerCareTypes';
import { useFarmerCare, useHomeBarangay } from '@/features/farmer-care/hooks/useFarmerCare';
import { useScanRecordDetails } from '@/features/records/hooks/useRecords';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

/**
 * Two taps and a barangay: the farmer's optional question to the office. It is
 * saved on the phone first, so it works with no signal, and it never asks for
 * a diagnosis, a location permission or anything official.
 */
export function AskOfficeSheet() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ scanId?: string | string[] }>();
  const scanId = Array.isArray(params.scanId) ? params.scanId[0] : (params.scanId ?? null);
  const copy = useFarmerCopy().care.ask;
  const database = useCaneGuardDatabase();
  const { showToast } = useToast();
  const { isFarmer, ownerIdentity, syncNow } = useFarmerCare();
  const scan = useScanRecordDetails(scanId);
  const home = useHomeBarangay();
  const [pickedBarangay, setPickedBarangay] = useState<string | null>(null);
  const [landmark, setLandmark] = useState('');
  const [concern, setConcern] = useState<FarmerConcern | null>(null);
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // The home barangay is chosen once and pre-selected here, unless the farmer picks another.
  const barangay = pickedBarangay ?? home.barangay ?? '';

  const dirty = landmark.length > 0 || concern !== null || pickedBarangay !== null;
  const ready = isFarmer && !!ownerIdentity && !!scanId && !!scan.data && barangay.trim().length > 0 && !pending;

  const submit = async () => {
    if (!ready || !ownerIdentity || !scanId || !scan.data) return;
    setPending(true);
    setErrorMessage(null);
    try {
      const label = (FARMER_AI_LABELS as readonly string[]).includes(scan.data.predictedLabel)
        ? scan.data.predictedLabel
        : null;
      const { created } = enqueueFarmerInquiry(database, {
        id: randomUUID(),
        ownerIdentity,
        scanRecordId: scanId,
        barangay: barangay.trim(),
        landmark: landmark.trim() || null,
        concern,
        aiLabel: label,
        aiConfidencePercent: label ? Math.round(Math.min(1, Math.max(0, scan.data.confidence)) * 100) : null,
        createdAt: new Date().toISOString(),
      });
      // Remember the barangay for next time without asking again.
      if (!home.barangay) void home.save(barangay.trim());
      const result = await syncNow();
      showToast(created && result && result.sent > 0 ? copy.sentNow : copy.saved, 'success');
      router.back();
    } catch {
      setErrorMessage(copy.saveFailed);
    } finally {
      setPending(false);
    }
  };

  return (
    <SheetScreen
      testID="ask-office.sheet"
      title={copy.title}
      cancelLabel={copy.cancel}
      isDirty={dirty}
      onCancel={() => router.back()}
      onSubmit={() => void submit()}
      submitLabel={copy.send}
      submitLoading={pending}
      submitLoadingLabel={copy.sending}
      submitDisabled={!ready}
      submitTestID="ask-office.submit"
      errorMessage={errorMessage}>
      <View style={styles.body}>
        <Text style={[styles.reassurance, { color: theme.text }]}>{copy.reassurance}</Text>
        <Text style={[styles.willSee, { color: theme.textSecondary }]}>{copy.willSee}</Text>
        <BarangayPicker
          barangays={NASUGBU_BARANGAYS}
          value={barangay}
          onChange={setPickedBarangay}
          testID="ask-office.barangay"
        />
        {barangay.trim().length === 0 ? (
          <Text style={[styles.willSee, { color: theme.textSecondary }]}>{copy.barangayNeeded}</Text>
        ) : null}
        <TextField
          testID="ask-office.landmark"
          label={copy.landmarkLabel}
          value={landmark}
          onChangeText={setLandmark}
          placeholder={copy.landmarkPlaceholder}
          maxLength={120}
        />
        <Text style={[styles.label, { color: theme.text }]}>{copy.concernLabel}</Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {FARMER_CONCERNS.map((value) => {
            const selected = concern === value;
            return (
              <Pressable
                key={value}
                testID={`ask-office.concern.${value}`}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setConcern(selected ? null : value)}
                style={[
                  styles.chip,
                  {
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? theme.primary : 'transparent',
                  },
                ]}>
                <Text style={[styles.chipText, { color: selected ? theme.surfaceElevated : theme.text }]}>
                  {copy.concerns[value]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SheetScreen>
  );
}

const styles = StyleSheet.create({
  body: { gap: Spacing.lg },
  reassurance: { ...Typography.subheading },
  willSee: { ...Typography.bodySmall },
  label: { ...Typography.label },
  chips: { gap: Spacing.sm },
  // 52px tall, full width: one thumb, no mistaps.
  chip: { minHeight: 52, borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.lg, justifyContent: 'center' },
  chipText: { ...Typography.body },
});
