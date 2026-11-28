import { StyleSheet, Text, View } from 'react-native';
import { useState } from 'react';

import { useToast } from '@/components/ui/Toast';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { BarangayPicker } from '@/features/reports/components/BarangayPicker';
import { NASUGBU_BARANGAYS } from '@/features/reports/referenceData/nasugbuSeed';
import { useHomeBarangay } from '@/features/farmer-care/hooks/useFarmerCare';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy } from '@/providers/LanguagePreferenceProvider';

/** Settings, farmer only: the barangay that guidance and questions start from. The farmer's own choice. */
export function HomeBarangayRow() {
  const theme = useTheme();
  const copy = useFarmerCopy().care.settings;
  const { showToast } = useToast();
  const home = useHomeBarangay();
  const [saving, setSaving] = useState(false);
  if (!home.loaded) return null;

  const change = async (value: string) => {
    if (saving || !value.trim()) return;
    setSaving(true);
    try {
      const outcome = await home.save(value.trim());
      if (outcome === 'invalid') {
        showToast(copy.homeBarangayInvalid, 'error');
      } else {
        showToast(
          outcome === 'saved' ? copy.homeBarangaySaved : copy.homeBarangayLocalOnly,
          outcome === 'saved' ? 'success' : 'info',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View testID="settings.home-barangay" style={[styles.row, { borderBottomColor: theme.divider }]}>
      <Text style={[styles.label, { color: theme.text }]}>{copy.homeBarangayLabel}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>{copy.homeBarangayDescription}</Text>
      <BarangayPicker
        allowCustom={false}
        barangays={NASUGBU_BARANGAYS}
        value={home.barangay ?? ''}
        onChange={(value) => void change(value)}
        testID="settings.home-barangay.picker"
      />
      {home.barangay ? null : (
        <Text style={[styles.description, { color: theme.textSecondary }]}>{copy.homeBarangayNotSet}</Text>
      )}
      {home.unsupported ? (
        <View
          testID="settings.home-barangay.unsupported"
          style={[styles.notice, { backgroundColor: theme.warningBg, borderColor: theme.border }]}>
          <Text style={[styles.noticeText, { color: theme.text }]}>{copy.homeBarangayUnsupported}</Text>
        </View>
      ) : home.pushPending ? (
        <Text testID="settings.home-barangay.pending" style={[styles.pending, { color: theme.textSecondary }]}>
          {copy.homeBarangayPendingSync}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.sm, paddingVertical: Spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth },
  label: { ...Typography.subheading },
  description: { ...Typography.bodySmall },
  pending: { ...Typography.caption, fontWeight: '600' },
  notice: { borderWidth: 1, borderRadius: Radius.md, padding: Spacing.md },
  noticeText: { ...Typography.bodySmall },
});
