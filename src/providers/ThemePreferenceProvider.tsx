import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemeScheme = 'light' | 'dark';

type ThemePreferenceContextValue = {
  colorScheme: ThemeScheme;
  isDarkMode: boolean;
  isHydrated: boolean;
  setDarkMode: (enabled: boolean) => void;
};

const THEME_STORAGE_KEY = 'caneguard.theme-scheme';

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(null);

function isThemeScheme(value: string | null): value is ThemeScheme {
  return value === 'light' || value === 'dark';
}

export function ThemePreferenceProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preferredScheme, setPreferredScheme] = useState<ThemeScheme | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const colorScheme = preferredScheme ?? (systemScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    let isMounted = true;

    async function restoreThemePreference() {
      try {
        const storedScheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (isMounted && isThemeScheme(storedScheme)) {
          setPreferredScheme(storedScheme);
        }
      } catch (error: unknown) {
        console.warn('Unable to restore the saved theme preference.', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    void restoreThemePreference();

    return () => {
      isMounted = false;
    };
  }, []);

  function setDarkMode(enabled: boolean) {
    const nextScheme: ThemeScheme = enabled ? 'dark' : 'light';
    setPreferredScheme(nextScheme);

    persistenceQueue.current = persistenceQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(THEME_STORAGE_KEY, nextScheme))
      .catch((error: unknown) => {
        console.warn('Unable to save the theme preference.', error);
      });
  }

  return (
    <ThemePreferenceContext.Provider
      value={{ colorScheme, isDarkMode: colorScheme === 'dark', isHydrated, setDarkMode }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext);

  if (!context) {
    throw new Error('useThemePreference must be used within ThemePreferenceProvider.');
  }

  return context;
}
