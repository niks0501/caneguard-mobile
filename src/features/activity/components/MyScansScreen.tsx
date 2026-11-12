import { Feather } from '@expo/vector-icons';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { RecordCard } from '@/components/ui/RecordCard';
import {
  ComponentTokens,
  Layout,
  Radius,
  Spacing,
  Typography,
} from '@/constants/theme';
import { DEFAULT_RECORD_PAGE_SIZE } from '@/features/records/domain/recordTypes';
import {
  FARMER_SCAN_STATES,
  type FarmerScanState,
} from '@/features/records/domain/scanState';
import { usePaginatedScanRecords } from '@/features/records/hooks/useRecords';
import { possibleConditionLine } from '@/features/records/components/possibleConditionLine';
import { useFarmerScans } from '@/features/records/hooks/useScanStates';
import type { ScanRecordListItem } from '@/features/records/domain/recordTypes';
import { useTheme } from '@/hooks/use-theme';
import { useFarmerCopy, useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

type StateFilter = 'all' | FarmerScanState;

const STATE_COPY_KEY = {
  needs_checking: 'stateNeedsChecking',
  followed_up: 'stateFollowedUp',
  saved: 'stateSaved',
} as const;

function TimelineSeparator() {
  return <View style={styles.separator} />;
}

/** Farmer version of the Activity tab: the farmer's own scans with a computed state. */
export default function MyScansScreen() {
  const theme = useTheme();
  const farmerCopy = useFarmerCopy();
  const { language } = useLanguagePreference();
  const copy = farmerCopy.myScans;
  const [filter, setFilter] = useState<StateFilter>('all');
  const [searchInput, setSearchInput] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const records = usePaginatedScanRecords(
    { search: submittedSearch || undefined },
    DEFAULT_RECORD_PAGE_SIZE,
  );
  const { states, threads, status: threadStatus, refresh: refreshThreads } = useFarmerScans();
  const stateLabel = useCallback(
    (state: FarmerScanState) => copy[STATE_COPY_KEY[state]],
    [copy],
  );

  // One card per plant: the newest loaded check stands for the first check and
  // its follow-ups, which stay reachable from that record's check history.
  const visible = useMemo(() => {
    if (threadStatus !== 'ready') return [];
    const seenPlants = new Set<string>();
    return records.data.filter((record) => {
      if (filter !== 'all' && states.get(record.id) !== filter) return false;
      const plant = threads.get(record.id)?.originalId ?? record.id;
      if (seenPlants.has(plant)) return false;
      seenPlants.add(plant);
      return true;
    });
  }, [filter, records.data, states, threads, threadStatus]);
  const hasFilters = filter !== 'all' || Boolean(submittedSearch);
  const chips: { key: StateFilter; label: string }[] = [
    { key: 'all', label: copy.filterAll },
    ...FARMER_SCAN_STATES.map((state) => ({ key: state, label: stateLabel(state) })),
  ];

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ScanRecordListItem>) => {
      const state = states.get(item.id);
      return (
        <View style={styles.listRow}>
          <RecordCard
            testID={`my-scans.item.${item.id}`}
            record={item}
            scanState={state ? { label: stateLabel(state), state } : undefined}
            farmerText={{
              language,
              openLabel: copy.openScan,
              result: possibleConditionLine(farmerCopy, item.predictedLabel),
            }}
            onPress={() =>
              router.push({
                pathname: '/record-details',
                params: { id: item.id },
              } as unknown as Href)
            }
          />
        </View>
      );
    },
    [copy, farmerCopy, language, stateLabel, states],
  );

  const submitSearch = () => setSubmittedSearch(searchInput.trim());
  const clearFilters = () => {
    setFilter('all');
    setSearchInput('');
    setSubmittedSearch('');
  };

  const status =
    records.loading && records.data.length === 0 ? (
      <EmptyState icon="loader" title={copy.loading} message="" liveRegion="polite">
        <ActivityIndicator accessibilityLabel={copy.loading} color={theme.primary} />
      </EmptyState>
    ) : records.errorMessage ? (
      <EmptyState
        icon="alert-triangle"
        title={copy.loadError}
        message=""
        liveRegion="assertive">
        <AppButton onPress={() => void records.refresh()} leadingIcon="refresh-cw">
          {copy.retryLoad}
        </AppButton>
      </EmptyState>
    ) : threadStatus === 'loading' ? (
      <EmptyState icon="loader" title={copy.loading} message="" liveRegion="polite">
        <ActivityIndicator accessibilityLabel={copy.loading} color={theme.primary} />
      </EmptyState>
    ) : threadStatus === 'error' ? (
      <EmptyState
        icon="alert-triangle"
        title={copy.loadError}
        message=""
        liveRegion="assertive">
        <AppButton onPress={() => void refreshThreads()} leadingIcon="refresh-cw">
          {copy.retryLoad}
        </AppButton>
      </EmptyState>
    ) : visible.length === 0 ? (
      <EmptyState
        testID="my-scans.empty"
        icon={hasFilters ? 'search' : 'camera'}
        title={hasFilters ? copy.noMatchTitle : copy.emptyTitle}
        message={hasFilters ? copy.noMatchMessage : copy.emptyMessage}>
        {hasFilters ? (
          <AppButton onPress={clearFilters} variant="secondary">
            {copy.clearFilters}
          </AppButton>
        ) : (
          <AppButton onPress={() => router.push('/scan')} leadingIcon="camera">
            {copy.startScan}
          </AppButton>
        )}
      </EmptyState>
    ) : null;

  const header = (
    <View style={styles.content}>
      <View style={styles.searchRow}>
        <View
          style={[
            styles.search,
            { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
          ]}>
          <Feather name="search" size={20} color={theme.textSecondary} />
          <TextInput
            accessibilityLabel={copy.searchLabel}
            placeholder={copy.searchPlaceholder}
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
          accessibilityLabel={copy.searchLabel}
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
        {chips.map((chip) => {
          const selected = filter === chip.key;
          return (
            <Pressable
              key={chip.key}
              testID={`my-scans.filter.${chip.key}`}
              accessibilityRole="button"
              accessibilityLabel={chip.label}
              accessibilityState={{ selected }}
              onPress={() => setFilter(chip.key)}
              style={({ pressed }) => [
                styles.filter,
                {
                  backgroundColor: selected ? theme.primary : theme.surfaceMuted,
                  borderColor: selected ? theme.primary : theme.border,
                },
                pressed && styles.pressed,
              ]}>
              <Text
                style={[
                  styles.filterText,
                  { color: selected ? theme.background : theme.primaryDark },
                ]}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {status ?? (
        <Text testID="my-scans.count" style={[styles.count, { color: theme.textSecondary }]}>
          {visible.length === 1
            ? copy.countOne
            : copy.countMany.replace('{count}', String(visible.length))}
        </Text>
      )}
    </View>
  );

  const footer = (
    <View style={styles.footer}>
      {threadStatus === 'ready' && records.hasMore ? (
        <AppButton
          testID="my-scans.load-more"
          onPress={() => void records.loadMore()}
          busy={records.loadingMore}
          disabled={records.loadingMore}
          variant="secondary">
          {copy.loadMore}
        </AppButton>
      ) : null}
      <View style={styles.bottomSpace} />
    </View>
  );

  return (
    <SafeAreaView
      testID="my-scans.screen"
      style={[styles.safe, { backgroundColor: theme.background }]}
      edges={['top']}>
      <View style={styles.root}>
        <BrandedScreenHeader title={copy.title} showBack={false} subtitle={copy.subtitle} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.root}>
          <FlashList
            testID="my-scans.list"
            data={visible}
            ItemSeparatorComponent={TimelineSeparator}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={footer}
            ListHeaderComponent={header}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  root: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingVertical: Spacing.lg,
    gap: Spacing.lg,
  },
  footer: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  listRow: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    alignSelf: 'center',
    paddingHorizontal: ComponentTokens.screen.horizontalPadding,
  },
  separator: { height: Spacing.md },
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
  bottomSpace: { height: Layout.bottomNavHeight + Spacing['3xl'] },
  pressed: { opacity: 0.75 },
});
