import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/ui/BottomNav';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useOfficeUpdates } from '@/features/notifications/providers/OfficeUpdatesProvider';

export default function TabLayout() {
  const { unreadCount } = useOfficeUpdates();
  const { user } = useAuth();
  // Farmers have no assigned visits, so Visits is not offered to them.
  const isFarmer = user?.role === 'farmer';

  return (
    <Tabs
      backBehavior="none"
      tabBar={(props) => (
        <BottomNav
          {...props}
          hiddenTabs={isFarmer ? ['today'] : undefined}
          notificationCount={unreadCount}
        />
      )}
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
      }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="today" options={{ title: 'Visits', href: isFarmer ? null : undefined }} />
    </Tabs>
  );
}
