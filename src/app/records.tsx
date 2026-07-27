import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BottomNav } from '@/components/ui/BottomNav';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { RecordCard } from '@/components/ui/RecordCard';
import { SyncStatusPanel } from '@/components/ui/SyncStatusPanel';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import type { ModelLabel } from '@/features/detection/constants/modelContract';
import { DEFAULT_RECORD_PAGE_SIZE } from '@/features/records/domain/recordTypes';
import { usePaginatedScanRecords } from '@/features/records/hooks/useRecords';
import { useTheme } from '@/hooks/use-theme';

type FilterKey = 'all' | ModelLabel;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'healthy', label: 'Healthy' },
  { key: 'mosaic', label: 'Mosaic' },
  { key: 'rust', label: 'Rust' },
];

export default function RecordsScreen() {
  const theme = useTheme();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const records = usePaginatedScanRecords({
    predictedLabel: activeFilter === 'all' ? undefined : activeFilter,
    search: submittedSearch || undefined,
  }, DEFAULT_RECORD_PAGE_SIZE);
  const hasFilters = activeFilter !== 'all' || Boolean(submittedSearch);

  const submitSearch = () => {
    setSubmittedSearch(searchInput.trim());
  };

  const clearFilters = () => {
    setActiveFilter('all');
    setSearchInput('');
    setSubmittedSearch('');
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top']}>
      <View style={styles.root}>
        <BrandedScreenHeader title="My Records" showBack={false} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <View
              style={[
                styles.intro,
                {
                  backgroundColor: theme.surfaceMuted,
                  borderColor: theme.border,
                },
              ]}>
              <Feather name="hard-drive" size={20} color={theme.primary} />
              <Text style={[styles.introText, { color: theme.textSecondary }]}>
                Every completed report stays on this device even when an upload
                is pending or fails.
              </Text>
            </View>
            <SyncStatusPanel />

            <View style={styles.searchRow}>
              <View
                style={[
                  styles.search,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.border,
                  },
                ]}>
                <Feather
                  name="search"
                  size={20}
                  color={theme.textSecondary}
                />
                <TextInput
                  accessibilityLabel="Search saved records"
                  placeholder="Search result or barangay"
                  placeholderTextColor={theme.textSecondary}
                  value={searchInput}
                  onChangeText={setSearchInput}
                  onSubmitEditing={submitSearch}
                  returnKeyType="search"
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Submit record search"
                onPress={submitSearch}
                style={({ pressed }) => [
                  styles.searchButton,
                  { backgroundColor: theme.primary },
                  pressed && styles.pressed,
                ]}>
                <Feather name="arrow-right" size={20} color={theme.background} />
              </Pressable>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filters}>
              {FILTERS.map((filter) => {
                const selected = activeFilter === filter.key;
                return (
                  <Pressable
                    key={filter.key}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter records by ${filter.label}`}
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setActiveFilter(filter.key);
                    }}
                    style={({ pressed }) => [
                      styles.filter,
                      {
                        backgroundColor: selected
                          ? theme.primary
                          : theme.surfaceMuted,
                        borderColor: selected ? theme.primary : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.filterText,
                        {
                          color: selected
                            ? theme.background
                            : theme.primaryDark,
                        },
                      ]}>
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {records.loading && records.data.length === 0 ? (
              <StateCard
                icon="loader"
                title="Loading saved records"
                message="Reading local records from this device."
                liveRegion="polite">
                <ActivityIndicator
                  accessibilityLabel="Loading saved records"
                  color={theme.primary}
                />
              </StateCard>
            ) : records.errorMessage ? (
              <StateCard
                icon="alert-triangle"
                title="Records unavailable"
                message={records.errorMessage}
                liveRegion="assertive">
                <AppButton onPress={() => void records.refresh()} leadingIcon="refresh-cw">
                  Try Again
                </AppButton>
              </StateCard>
            ) : records.data.length === 0 ? (
              <StateCard
                icon={hasFilters ? 'search' : 'folder'}
                title={hasFilters ? 'No matching records' : 'No saved records yet'}
                message={
                  hasFilters
                    ? 'No local records match the current search and filter.'
                    : 'Complete an analysis and choose Save Record to keep it on this device.'
                }>
                {hasFilters ? (
                  <AppButton onPress={clearFilters} variant="secondary">
                    Clear Filters
                  </AppButton>
                ) : (
                  <AppButton
                    onPress={() => router.push('/scan')}
                    leadingIcon="camera">
                    Start Scan
                  </AppButton>
                )}
              </StateCard>
            ) : (
              <>
                <Text style={[styles.count, { color: theme.textSecondary }]}>
                  {records.data.length} local{' '}
                  {records.data.length === 1 ? 'record' : 'records'}
                </Text>
                <View style={styles.list}>
                  {records.data.map((record) => (
                    <RecordCard
                      key={record.id}
                      record={record}
                      onPress={() =>
                        router.push({
                          pathname: '/record-details',
                          params: { id: record.id },
                        } as unknown as Href)
                      }
                    />
                  ))}
                </View>
                {records.hasMore ? (
                  <AppButton
                    onPress={() => void records.loadMore()}
                    disabled={records.loadingMore}
                    variant="secondary">
                    {records.loadingMore ? 'Loading...' : 'Load More'}
                  </AppButton>
                ) : null}
              </>
            )}
            <View style={styles.bottomSpace} />
          </View>
        </ScrollView>
        <BottomNav activeTab="records" />
      </View>
    </SafeAreaView>
  );
}

function StateCard({
  children,
  icon,
  liveRegion,
  message,
  title,
}: {
  children: React.ReactNode;
  icon: keyof typeof Feather.glyphMap;
  liveRegion?: 'none' | 'polite' | 'assertive';
  message: string;
  title: string;
}) {
  const theme = useTheme();
  return (
    <View
      accessibilityLiveRegion={liveRegion}
      style={[
        styles.stateCard,
        { backgroundColor: theme.surfaceMuted, borderColor: theme.border },
      ]}>
      <Feather name={icon} size={26} color={theme.primary} />
      <Text style={[styles.stateTitle, { color: theme.primaryDark }]}>
        {title}
      </Text>
      <Text style={[styles.stateMessage, { color: theme.textSecondary }]}>
        {message}
      </Text>
      <View style={styles.stateAction}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  scrollContent: { alignItems: 'center' },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.xl,
    gap: Spacing.lg,
  },
  intro: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  introText: { ...Typography.bodySmall, flex: 1 },
  searchRow: { flexDirection: 'row', gap: Spacing.sm },
  search: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInput: { ...Typography.body, flex: 1 },
  searchButton: {
    width: 54,
    height: 54,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filters: { gap: Spacing.sm },
  filter: {
    minHeight: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterText: { ...Typography.bodySmall, fontWeight: '800' },
  count: { ...Typography.label, letterSpacing: 0.8 },
  list: { gap: Spacing.md },
  stateCard: {
    minHeight: 220,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  stateTitle: { ...Typography.subheading, textAlign: 'center' },
  stateMessage: { ...Typography.bodySmall, textAlign: 'center' },
  stateAction: { width: '100%', marginTop: Spacing.sm },
  bottomSpace: { height: Layout.bottomNavHeight + Spacing['3xl'] },
  pressed: { opacity: 0.72 },
});
