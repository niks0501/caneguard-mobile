import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ScanSessionProvider } from '@/features/detection/context/ScanSessionProvider';
import { CaneGuardModelProvider } from '@/features/detection/model/useCaneGuardModel';
import { CaneGuardDatabaseProvider } from '@/database/DatabaseProvider';
import {
  ThemePreferenceProvider,
  useThemePreference,
} from '@/providers/ThemePreferenceProvider';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <CaneGuardDatabaseProvider>
        <ScanSessionProvider>
          <CaneGuardModelProvider>
            <AppNavigator />
          </CaneGuardModelProvider>
        </ScanSessionProvider>
      </CaneGuardDatabaseProvider>
    </ThemePreferenceProvider>
  );
}

function AppNavigator() {
  const { colorScheme, isHydrated } = useThemePreference();

  useEffect(() => {
    if (isHydrated) {
      void SplashScreen.hideAsync();
    }
  }, [isHydrated]);

  if (!isHydrated) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="home" />
        <Stack.Screen name="scan" />
        <Stack.Screen name="image-preview" />
        <Stack.Screen name="symptom-checklist" />
        <Stack.Screen name="analysis-result" />
        <Stack.Screen name="records" />
        <Stack.Screen name="reports" />
        <Stack.Screen name="settings" />
        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="model-smoke-test" />
          <Stack.Screen name="model-debug" />
          <Stack.Screen name="storage-debug" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
