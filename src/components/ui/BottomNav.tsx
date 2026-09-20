import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type NavTab = 'home' | 'scan' | 'activity' | 'today';

type TabNavigationState = {
  index: number;
  routes: readonly { key: string; name: string }[];
};

type TabNavigation = {
  navigate: (name: string) => void;
};

export type BottomNavProps = {
  /** Kept for isolated presenter tests and legacy embedders. */
  activeTab?: NavTab;
  state?: TabNavigationState;
  navigation?: TabNavigation;
};

type NavItem = {
  key: NavTab;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'scan', label: 'Scan', icon: 'camera' },
  { key: 'activity', label: 'Activity', icon: 'activity' },
  { key: 'today', label: "Today's visits", icon: 'calendar' },
];

/**
 * The tab bar is intentionally a presenter. The navigator owns route state
 * and focus; this component only renders it and dispatches tab navigation.
 */
export function BottomNav({ activeTab, state, navigation }: BottomNavProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const selectedRoute = state?.routes[state.index]?.name;

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, { backgroundColor: theme.surfaceElevated, borderTopColor: theme.divider, paddingBottom: Math.max(Spacing.sm, insets.bottom) }]}>
        {NAV_ITEMS.map((item) => {
          const active = selectedRoute ? selectedRoute === item.key : item.key === activeTab;

          return (
            <Pressable
              key={item.key}
              testID={`nav.${item.key}`}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (!active) {
                  navigation?.navigate(item.key);
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
    ...Typography.caption,
    lineHeight: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
