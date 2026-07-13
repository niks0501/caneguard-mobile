import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/ui/BottomNav';
import { BrandedScreenHeader } from '@/components/ui/BrandedScreenHeader';
import { RecordCard, type MockRecord } from '@/components/ui/RecordCard';
import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FilterKey = 'all' | 'smut' | 'rust' | 'mildew' | 'mosaic' | 'healthy';
const FILTERS: { key: FilterKey; label: string }[] = [{ key: 'all', label: 'All' }, { key: 'smut', label: 'Smut' }, { key: 'rust', label: 'Rust' }, { key: 'mildew', label: 'Mildew' }, { key: 'mosaic', label: 'Mosaic' }, { key: 'healthy', label: 'Healthy' }];
const MOCK_RECORDS: MockRecord[] = [
  { id: '1', barangay: 'Brgy. Wawa', date: 'Jul 12, 2025', time: '10:23 AM', disease: 'smut', status: 'queued', statusText: 'Awaiting sync' },
  { id: '2', barangay: 'Brgy. Cogunan', date: 'Jul 10, 2025', time: '3:45 PM', disease: 'healthy', status: 'sent', statusText: 'Synced to MAO' },
  { id: '3', barangay: 'Brgy. Mataas na Lupa', date: 'Jul 8, 2025', time: '8:05 AM', disease: 'rust', status: 'sent', statusText: 'Reviewed by MAO' },
  { id: '4', barangay: 'Brgy. Bilaran', date: 'Jul 5, 2025', time: '1:12 PM', disease: 'mosaic', status: 'queued', statusText: 'Awaiting sync' },
];

export default function RecordsScreen() {
  const theme = useTheme(); const [activeFilter, setActiveFilter] = useState<FilterKey>('all'); const [search, setSearch] = useState('');
  const visibleRecords = MOCK_RECORDS.filter((record) => (activeFilter === 'all' || record.disease === activeFilter) && `${record.barangay} ${record.disease} ${record.date}`.toLowerCase().includes(search.trim().toLowerCase()));
  return <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top']}><View style={styles.root}><BrandedScreenHeader title="My Records" showBack={false} /><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}><View style={styles.content}>
    <View style={[styles.search, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}><Feather name="search" size={20} color={theme.textSecondary} /><TextInput accessibilityLabel="Search records" placeholder="Search records" placeholderTextColor={theme.textSecondary} value={search} onChangeText={setSearch} style={[styles.searchInput, { color: theme.text }]} /></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{FILTERS.map((filter) => { const selected = activeFilter === filter.key; return <Pressable key={filter.key} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setActiveFilter(filter.key)} style={({ pressed }) => [styles.filter, { backgroundColor: selected ? theme.primary : theme.surfaceMuted, borderColor: selected ? theme.primary : theme.border }, pressed && styles.pressed]}><Text style={[styles.filterText, { color: selected ? theme.surfaceElevated : theme.primaryDark }]}>{filter.label}</Text></Pressable>; })}</ScrollView>
    <Text style={[styles.month, { color: theme.textSecondary }]}>JUL 2025</Text>
    <View style={styles.list}>{visibleRecords.length ? visibleRecords.map((record) => <RecordCard key={record.id} record={record} />) : <View style={[styles.empty, { backgroundColor: theme.surfaceMuted }]}><Feather name="search" size={22} color={theme.textSecondary} /><Text style={[styles.emptyText, { color: theme.textSecondary }]}>No records match this search.</Text></View>}</View><View style={{ height: Layout.bottomNavHeight + Spacing['3xl'] }} />
  </View></ScrollView><BottomNav activeTab="records" /></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, root: { flex: 1 }, scrollContent: { alignItems: 'center' }, content: { width: '100%', maxWidth: Layout.mobileMaxWidth, paddingHorizontal: ComponentTokens.screen.horizontalPadding, paddingVertical: Spacing.xl, gap: Spacing.lg }, search: { minHeight: 54, borderWidth: 1, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }, searchInput: { ...Typography.body, flex: 1 }, filters: { gap: Spacing.sm }, filter: { minHeight: 40, borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: Spacing.lg, alignItems: 'center', justifyContent: 'center' }, filterText: { ...Typography.bodySmall, fontWeight: '800' }, month: { ...Typography.label, letterSpacing: 1.2 }, list: { gap: Spacing.md }, empty: { minHeight: 110, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }, emptyText: { ...Typography.bodySmall }, pressed: { opacity: 0.7 } });
