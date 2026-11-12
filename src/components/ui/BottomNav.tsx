import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ComponentTokens, Layout, Radius, Spacing, Typography } from '@/constants/theme';
import { activityTabLabel } from '@/constants/copy';
import { useTheme } from '@/hooks/use-theme';

export type NavTab = 'home' | 'scan' | 'activity' | 'today';

type TabNavigationState = {
  index: number;
  routes: readonly { key: string; name: string }[];
};

type TabNavigation = {
  navigate: (name: string) => void;
};

type TabNavigateToTab = (routeKey: string) => void;

export type BottomNavProps = {
  /** Kept for isolated presenter tests and legacy embedders. */
  activeTab?: NavTab;
  state?: TabNavigationState;
  /** Legacy dispatcher, used only when the navigator callback is unavailable. */
  navigation?: TabNavigation;
  /** Expo Router's custom tab-bar transition callback, keyed by route key. */
  navigateToTab?: TabNavigateToTab;
  /** Unread office updates, shown on the Activity tab. */
  notificationCount?: number;
  /** Tabs left out of the bar, for example Visits on a farmer session. */
  hiddenTabs?: readonly NavTab[];
  /** Replacement tab words, for example a farmer's own language. */
  labels?: Partial<Record<NavTab, string>>;
  /** Replacement icons, for example the farmer's own scans tab. */
  icons?: Partial<Record<NavTab, keyof typeof MaterialCommunityIcons.glyphMap>>;
  activityAccessibilityLabel?: (count: number) => string;
};

type NavItem = {
  key: NavTab;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home-variant' },
  { key: 'scan', label: 'Scan', icon: 'camera' },
  { key: 'activity', label: 'Activity', icon: 'clipboard-text-clock' },
  { key: 'today', label: 'Visits', icon: 'map-marker-radius' },
];

/**
 * The tab bar is intentionally a presenter. The navigator owns route state
 * and focus; this component only renders it and dispatches tab navigation.
 */
export function BottomNav({
  activeTab,
  activityAccessibilityLabel,
  hiddenTabs,
  icons,
  labels,
  navigation,
  navigateToTab,
  notificationCount = 0,
  state,
}: BottomNavProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const selectedRoute = state?.routes[state.index]?.name;

  return (
    <View style={styles.wrap}>
      <View style={[styles.row, { backgroundColor: theme.background, borderTopColor: theme.divider, paddingBottom: Math.max(Spacing.sm, insets.bottom) }]}>
        {NAV_ITEMS.filter((item) => !hiddenTabs?.includes(item.key)).map((item) => {
          const active = selectedRoute ? selectedRoute === item.key : item.key === activeTab;

          return (
            <Pressable
              key={item.key}
              testID={`nav.${item.key}`}
              accessibilityRole="button"
              accessibilityLabel={
                item.key === 'activity' && notificationCount > 0 && activityAccessibilityLabel
                  ? activityAccessibilityLabel(notificationCount)
                  : item.key === 'activity' && !labels?.activity
                    ? activityTabLabel(notificationCount)
                    : (labels?.[item.key] ?? item.label)
              }
              accessibilityState={{ selected: active }}
              onPress={() => {
                if (active) {
                  return;
                }

                const route = state?.routes.find((candidate) => candidate.name === item.key);
                if (route && navigateToTab) {
                  navigateToTab(route.key);
                  return;
                }

                navigation?.navigate(item.key);
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && { opacity: 0.7 },
              ]}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons testID={`nav.${item.key}.icon`} name={icons?.[item.key] ?? item.icon} size={ComponentTokens.bottomNav.iconSize} color={active ? theme.primary : theme.textSecondary} />
                {item.key === 'activity' && notificationCount > 0 ? (
                  <View
                    testID="nav.activity-badge"
                    style={[styles.badge, { backgroundColor: theme.danger }]}>
                    <Text style={[styles.badgeText, { color: theme.background }]}>
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Text>
                  </View>
                ) : null}
                {active ? <View style={[styles.activeLine, { backgroundColor: theme.primary }]} /> : null}
              </View>
              <Text style={[styles.label, { color: active ? theme.primary : theme.textSecondary }]}>
                {labels?.[item.key] ?? item.label}
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
  badge: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
    right: -8,
    top: -4,
  },
  badgeText: { ...Typography.tabLabel },
  label: {
    ...Typography.tabLabel,
    lineHeight: 14,
    textAlign: 'center',
  },
});
