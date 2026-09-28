import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/ui/BottomNav';
import { useOfficeUpdates } from '@/features/notifications/providers/OfficeUpdatesProvider';

export default function TabLayout() {
  const { unreadCount } = useOfficeUpdates();

  return (
    <Tabs
      backBehavior="none"
      tabBar={(props) => <BottomNav {...props} notificationCount={unreadCount} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
      }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="scan" options={{ title: 'Scan' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
      <Tabs.Screen name="today" options={{ title: "Today's visits" }} />
    </Tabs>
  );
}
