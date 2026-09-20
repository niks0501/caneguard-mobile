import { Tabs } from 'expo-router';

import { BottomNav } from '@/components/ui/BottomNav';

export default function TabLayout() {
  return (
    <Tabs
      backBehavior="none"
      tabBar={(props) => <BottomNav {...props} />}
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
