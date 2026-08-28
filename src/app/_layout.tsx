// react-native-gesture-handler must be the first import so its native gesture
// pipeline is installed before any other module runs.
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

import { ScanSessionProvider } from '@/features/detection/context/ScanSessionProvider';
import { CaneGuardModelProvider } from '@/features/detection/model/useCaneGuardModel';
import { CaneGuardDatabaseProvider } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { SyncProvider } from '@/features/sync/providers/SyncProvider';
import {
  ThemePreferenceProvider,
  useThemePreference,
} from '@/providers/ThemePreferenceProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <ThemePreferenceProvider>
        <AuthProvider>
          <CaneGuardDatabaseProvider>
            <ScanSessionProvider>
              <CaneGuardModelProvider>
                <SyncProvider>
                  <AppNavigator />
                </SyncProvider>
              </CaneGuardModelProvider>
            </ScanSessionProvider>
          </CaneGuardDatabaseProvider>
        </AuthProvider>
      </ThemePreferenceProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { colorScheme, isHydrated } = useThemePreference();
  const { status } = useAuth();

  useEffect(() => {
    if (isHydrated && status !== 'restoring') {
      void SplashScreen.hideAsync();
    }
  }, [isHydrated, status]);

  if (!isHydrated || status === 'restoring') {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={status === 'unauthenticated'}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
        <Stack.Protected guard={status === 'authenticated'}>
          <Stack.Screen name="home" />
          <Stack.Screen name="activity" />
          <Stack.Screen name="scan" />
          <Stack.Screen name="image-preview" />
          <Stack.Screen name="symptom-checklist" />
          <Stack.Screen name="analysis-result" />
          <Stack.Screen name="records" />
          <Stack.Screen name="record-details" />
          <Stack.Screen name="field-report" />
          <Stack.Screen name="field-validation" />
          <Stack.Screen name="manual-map" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="settings" />
        </Stack.Protected>
        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="model-smoke-test" />
          <Stack.Screen name="model-debug" />
          <Stack.Screen name="storage-debug" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
});
