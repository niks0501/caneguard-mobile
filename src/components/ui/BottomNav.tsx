import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ComponentTokens, Layout, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type NavTab = 'home' | 'scan' | 'records' | 'settings' | 'reports';

export type BottomNavProps = {
  activeTab: NavTab;
};

type NavItem = {
  key: NavTab;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home', route: '/home' },
  { key: 'scan', label: 'Scan', icon: 'camera', route: '/scan' },
  { key: 'records', label: 'Records', icon: 'folder', route: '/records' },
  { key: 'settings', label: 'Settings', icon: 'settings', route: '/settings' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart-2', route: '/reports' },
];

export function BottomNav({ activeTab }: BottomNavProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: theme.surfaceElevated, borderTopColor: theme.border }]}>
      <View style={styles.row}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeTab;

          return (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (!active) {
                  router.push(item.route as any);
                }
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && { opacity: 0.7 },
              ]}>
              <Feather
                name={item.icon}
                size={ComponentTokens.bottomNav.iconSize}
                color={active ? theme.primary : theme.textSecondary}
              />
              <Text style={[styles.label, { color: active ? theme.primary : theme.textSecondary }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    borderTopWidth: 1,
  },
  row: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    minHeight: Layout.bottomNavHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  item: {
    minWidth: 54,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  navIcon: {
    width: ComponentTokens.bottomNav.iconSize,
    height: ComponentTokens.bottomNav.iconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
});
