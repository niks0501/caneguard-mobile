import { Tabs } from 'expo-router';

import { FARMER_COPY, NAMING } from '@/constants/copy';
import { BottomNav } from '@/components/ui/BottomNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOfficeUpdates } from '@/features/notifications/providers/OfficeUpdatesProvider';
import { useLanguagePreference } from '@/providers/LanguagePreferenceProvider';

export default function TabLayout() {
  const { unreadCount } = useOfficeUpdates();
  const { user } = useAuth();
  // Farmers have no assigned visits, so Visits is not offered to them.
  const isFarmer = user?.role === 'farmer';
  const { language } = useLanguagePreference();
  const farmerTabs = FARMER_COPY[language].tabs;

  return (
    <Tabs
      backBehavior="none"
      tabBar={(props) => (
        <BottomNav
          {...props}
          hiddenTabs={isFarmer ? ['today'] : undefined}
          labels={
            isFarmer
              ? { home: farmerTabs.home, scan: farmerTabs.scan, activity: farmerTabs.myScans }
              : undefined
          }
          icons={isFarmer ? { activity: 'sprout' } : undefined}
          notificationCount={unreadCount}
          activityAccessibilityLabel={isFarmer ? farmerTabs.activityWithUpdates : undefined}
        />
      )}
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
      }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="scan" options={{ title: NAMING.scan }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="today" options={{ title: NAMING.visits, href: isFarmer ? null : undefined }} />
    </Tabs>
  );
}
