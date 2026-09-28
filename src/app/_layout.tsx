// react-native-gesture-handler must be the first import so its native gesture
// pipeline is installed before any other module runs.
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { MobileAttentionLifecycle } from '@/features/notifications/components/MobileAttentionLifecycle';
import { OfficeUpdatesProvider } from '@/features/notifications/providers/OfficeUpdatesProvider';
import { ScanSessionProvider } from '@/features/detection/context/ScanSessionProvider';
import { CaneGuardModelProvider } from '@/features/detection/model/useCaneGuardModel';
import { CaneGuardDatabaseProvider } from '@/database/DatabaseProvider';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { AuthProvider } from '@/features/auth/providers/AuthProvider';
import { SyncProvider } from '@/features/sync/providers/SyncProvider';
import { ToastProvider } from '@/components/ui/Toast';
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
          <ToastProvider>
            <CaneGuardDatabaseProvider>
              <ScanSessionProvider>
                <CaneGuardModelProvider>
                  <SyncProvider>
                    <OfficeUpdatesProvider>
                      <AppNavigator />
                    </OfficeUpdatesProvider>
                  </SyncProvider>
                </CaneGuardModelProvider>
              </ScanSessionProvider>
            </CaneGuardDatabaseProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemePreferenceProvider>
    </GestureHandlerRootView>
  );
}

export function AppNavigator() {
  const { colorScheme, isHydrated } = useThemePreference();
  const { status } = useAuth();
  const previousStatusRef = useRef(status);

  useEffect(() => {
    if (isHydrated && status !== 'restoring') {
      void SplashScreen.hideAsync();
    }
  }, [isHydrated, status]);

  useEffect(() => {
    const previousStatus = previousStatusRef.current;
    previousStatusRef.current = status;
    // Every successful login lands on the dashboard unconditionally. The
    // login screen's own replace can be lost when the auth guard flips and
    // unmounts it, letting the router restore the pre-login route instead.
    if (previousStatus !== 'authenticated' && status === 'authenticated') {
      router.replace('/home');
    }
  }, [status]);

  if (!isHydrated || status === 'restoring') {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {status === 'authenticated' ? <MobileAttentionLifecycle /> : null}
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={status === 'authenticated'}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="image-preview" />
          <Stack.Screen name="symptom-checklist" />
          <Stack.Screen name="analysis-result" />
          <Stack.Screen name="records" />
          <Stack.Screen name="record-details" />
          <Stack.Screen name="field-report" />
          <Stack.Screen name="field-validation" />
          <Stack.Screen name="manual-map" />
          <Stack.Screen name="reports" />
          <Stack.Screen name="notification-details" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="account-security" />
          <Stack.Screen
            name="account-password"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.85, 1],
              sheetGrabberVisible: true,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="account-email"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.85, 1],
              sheetGrabberVisible: true,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="account-device-enrollment"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.85, 1],
              sheetGrabberVisible: true,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="account-biometric"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.85, 1],
              sheetGrabberVisible: true,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="field-report-details"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: [0.85, 1],
              sheetGrabberVisible: true,
              gestureEnabled: false,
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={status === 'unauthenticated'}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="verify-email" />
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
