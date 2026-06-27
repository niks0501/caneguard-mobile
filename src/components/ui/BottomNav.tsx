import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Layout, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type NavTab = 'home' | 'scan' | 'records' | 'settings' | 'reports';

export type BottomNavProps = {
  activeTab: NavTab;
};

type NavItem = {
  key: NavTab;
  label: string;
  icon: string;
  route: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'H', route: '/home' },
  { key: 'scan', label: 'Scan', icon: 'S', route: '/scan' },
  { key: 'records', label: 'Records', icon: 'R', route: '/records' },
  { key: 'settings', label: 'Settings', icon: 'O', route: '/settings' },
  { key: 'reports', label: 'Reports', icon: 'P', route: '/reports' },
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
              <View
                style={[
                  styles.iconBox,
                  { borderColor: active ? theme.primary : theme.textSecondary },
                ]}>
                <Text style={[styles.iconText, { color: active ? theme.primary : theme.textSecondary }]}>
                  {item.icon}
                </Text>
              </View>
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
  iconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
});
