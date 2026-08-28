import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComponentTokens, Layout, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type NavTab = 'home' | 'scan' | 'activity';

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
  { key: 'activity', label: 'Activity', icon: 'activity', route: '/activity' },
];

export function BottomNav({ activeTab }: BottomNavProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, { backgroundColor: theme.surfaceElevated, paddingBottom: Math.max(Spacing.sm, insets.bottom) }]}>
        {NAV_ITEMS.map((item) => {
          const active = item.key === activeTab;

          return (
            <Pressable
              key={item.key}
              testID={`nav.${item.key}`}
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
              <View style={styles.iconWrap}>
                <Feather name={item.icon} size={ComponentTokens.bottomNav.iconSize} color={active ? theme.primary : theme.textSecondary} />
                {active ? <View style={[styles.activeLine, { backgroundColor: theme.accentDark }]} /> : null}
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
    backgroundColor: 'transparent',
  },
  row: {
    width: '100%',
    maxWidth: Layout.mobileMaxWidth,
    minHeight: Layout.bottomNavHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
  },
  item: {
    flex: 1,
    minWidth: 0,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  iconWrap: {
    width: 30,
    height: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  activeLine: {
    width: 18,
    height: 3,
    borderRadius: Radius.full,
    marginTop: Spacing.xs,
  },
  label: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
