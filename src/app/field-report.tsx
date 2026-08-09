import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { TextField } from '@/components/ui/TextField';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { useFieldReportDraft } from '@/features/reports/hooks/useFieldReportDraft';
import type { FieldReport } from '@/features/reports/domain/fieldReportTypes';
import { useTheme } from '@/hooks/use-theme';

export default function FieldReportScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ scanRecordId?: string | string[] }>();
  const scanRecordId = Array.isArray(params.scanRecordId)
    ? params.scanRecordId[0]
    : (params.scanRecordId ?? null);
  const report = useFieldReportDraft(scanRecordId);

  return (
    <SafeAreaView
      testID="field-report.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top', 'bottom']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="Field Report Draft" />
        {report.loading && !report.data ? (
          <View style={styles.centered}>
            <ActivityIndicator
              accessibilityLabel="Opening Field Report draft"
              color={theme.primary}
            />
          </View>
        ) : report.errorMessage && !report.data ? (
          <View style={styles.centered}>
            <Text style={[styles.error, { color: theme.danger }]}> 
              {report.errorMessage}
            </Text>
            <AppButton onPress={() => void report.refresh()} leadingIcon="refresh-cw">
              Try Again
            </AppButton>
          </View>
        ) : report.data ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              <View
                style={[
                  styles.statusCard,
                  { backgroundColor: theme.warningBg, borderColor: theme.warning },
                ]}>
                <Feather name="edit-3" size={20} color={theme.warning} />
                <View style={styles.statusCopy}>
                  <Text style={[styles.statusTitle, { color: theme.text }]}>Draft</Text>
                  <Text style={[styles.statusMessage, { color: theme.textSecondary }]}> 
                    Save incomplete information now and return later. Drafts are
                    stored only on this device and are not queued for synchronization.
                  </Text>
                </View>
              </View>

              <DraftFields
                key={report.data.id}
                fieldReport={report.data}
                saving={report.saving}
                onSave={(values) => void report.save(values)}
              />

              {report.errorMessage ? (
                <Text
                  accessibilityLiveRegion="assertive"
                  style={[styles.error, { color: theme.danger }]}> 
                  {report.errorMessage}
                </Text>
              ) : null}
              {report.saved ? (
                <Text
                  testID="field-report.saved"
                  accessibilityLiveRegion="polite"
                  style={[styles.saved, { color: theme.success }]}> 
                  Draft saved on this device.
                </Text>
              ) : null}
              <Text style={[styles.identity, { color: theme.textSecondary }]}> 
                Report ID: {report.data.id}
              </Text>
            </View>
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function DraftFields({
  fieldReport,
  onSave,
  saving,
}: {
  fieldReport: FieldReport;
  onSave: (values: {
    barangay: string;
    farmerOrFarmOwnerName: string;
  }) => void;
  saving: boolean;
}) {
  const theme = useTheme();
  const [farmerName, setFarmerName] = useState(
    fieldReport.farmerOrFarmOwnerName ?? '',
  );
  const [barangay, setBarangay] = useState(fieldReport.barangay ?? '');

  return (
    <>
      <View
        style={[
          styles.formCard,
          { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
        ]}>
        <TextField
          testID="field-report.farmer-name-input"
          label="Farmer or farm owner name"
          value={farmerName}
          onChangeText={setFarmerName}
          placeholder="May be added later"
          autoCapitalize="words"
        />
        <TextField
          testID="field-report.barangay-input"
          label="Barangay"
          value={barangay}
          onChangeText={setBarangay}
          placeholder="May be added later"
          autoCapitalize="words"
        />
        <View style={styles.automaticFields}>
          <Text style={[styles.automaticLabel, { color: theme.textSecondary }]}> 
            Automatic area
          </Text>
          <Text style={[styles.automaticValue, { color: theme.text }]}> 
            {fieldReport.municipality}, {fieldReport.province}
          </Text>
        </View>
      </View>
      <AppButton
        testID="field-report.save-draft"
        onPress={() =>
          onSave({ farmerOrFarmOwnerName: farmerName, barangay })
        }
        disabled={saving}
        leadingIcon="save"
        accessibilityLabel={
          saving ? 'Saving Field Report draft' : 'Save Field Report draft'
        }>
        {saving ? 'Saving Draft...' : 'Save Draft'}
      </AppButton>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  scrollContent: { alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  statusCopy: { flex: 1, gap: Spacing.xs },
  statusTitle: { ...Typography.subheading, fontWeight: '800' },
  statusMessage: { ...Typography.bodySmall },
  formCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  automaticFields: { gap: Spacing.xs },
  automaticLabel: { ...Typography.caption, fontWeight: '700' },
  automaticValue: { ...Typography.body, fontWeight: '700' },
  error: { ...Typography.bodySmall, fontWeight: '700' },
  saved: { ...Typography.bodySmall, fontWeight: '800', textAlign: 'center' },
  identity: { ...Typography.caption, textAlign: 'center' },
});
