import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/ui/BottomNav';
import { RecordCard, type MockRecord } from '@/components/ui/RecordCard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FilterKey = 'all' | 'smut' | 'rust' | 'mildew' | 'mosaic' | 'healthy';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'smut', label: 'Smut' },
  { key: 'rust', label: 'Rust' },
  { key: 'mildew', label: 'Mildew' },
  { key: 'mosaic', label: 'Mosaic' },
  { key: 'healthy', label: 'Healthy' },
];

const MOCK_RECORDS: MockRecord[] = [
  {
    id: '1',
    barangay: 'Brgy. Wawa',
    date: 'Jul 12, 2025',
    time: '10:23 AM',
    disease: 'smut',
    status: 'queued',
    statusText: 'Awaiting sync',
  },
  {
    id: '2',
    barangay: 'Brgy. Cogunan',
    date: 'Jul 10, 2025',
    time: '3:45 PM',
    disease: 'healthy',
    status: 'sent',
    statusText: 'Synced to MAO',
  },
  {
    id: '3',
    barangay: 'Brgy. Mataas na Lupa',
    date: 'Jul 8, 2025',
    time: '8:05 AM',
    disease: 'rust',
    status: 'sent',
    statusText: 'Reviewed by MAO',
  },
  {
    id: '4',
    barangay: 'Brgy. Bilaran',
    date: 'Jul 5, 2025',
    time: '1:12 PM',
    disease: 'mosaic',
    status: 'queued',
    statusText: 'Awaiting sync',
  },
];

export default function RecordsScreen() {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={styles.root}>
        <ScreenHeader title="My Records" />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}>
          <View style={styles.content}>
            <View
              style={[
                styles.searchWrap,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                },
              ]}>
              <TextInput
                placeholder="Search records..."
                placeholderTextColor={theme.textSecondary}
                value={search}
                onChangeText={setSearch}
                style={[styles.searchInput, { color: theme.text }]}
              />
            </View>

            <View style={styles.filterRow}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}>
                {FILTERS.map((filter) => {
                  const selected = activeFilter === filter.key;

                  return (
                    <Pressable
                      key={filter.key}
                      accessibilityRole="button"
                      accessibilityLabel={filter.label}
                      accessibilityState={{ selected }}
                      onPress={() => setActiveFilter(filter.key)}
                      style={({ pressed }) => [
                        styles.filterPill,
                        {
                          backgroundColor: selected ? theme.primary : theme.surfaceElevated,
                          borderColor: selected ? theme.primary : theme.border,
                        },
                        pressed && { opacity: 0.7 },
                      ]}>
                      <Text
                        style={[
                          styles.filterLabel,
                          { color: selected ? theme.surfaceElevated : theme.text },
                        ]}>
                        {filter.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={[styles.scrollHint, { backgroundColor: theme.surfaceMuted }]}>
                <View style={[styles.scrollHintBar, { backgroundColor: theme.primary }]} />
              </View>
            </View>

            <Text style={[styles.monthLabel, { color: theme.textSecondary }]}>JUL 2025</Text>

            <View style={styles.recordsList}>
              {MOCK_RECORDS.map((record) => (
                <RecordCard key={record.id} record={record} />
              ))}
            </View>

            <View style={{ height: Layout.bottomNavHeight + Spacing.xl }} />
          </View>
        </ScrollView>

        <BottomNav activeTab="records" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingTop: Spacing.lg,
    gap: Spacing.lg,
  },
  searchWrap: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    minHeight: ComponentTokens.input.minHeight,
    justifyContent: 'center',
  },
  searchInput: {
    ...Typography.body,
    flex: 1,
  },
  filterRow: {
    gap: Spacing.sm,
  },
  filterScroll: {
    gap: Spacing.sm,
  },
  filterPill: {
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLabel: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
  scrollHint: {
    height: 3,
    borderRadius: Radius.full,
    width: 48,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  scrollHintBar: {
    width: '52%',
    height: '100%',
    borderRadius: Radius.full,
  },
  monthLabel: {
    ...Typography.label,
    letterSpacing: 1,
  },
  recordsList: {
    gap: Spacing.md,
  },
});
