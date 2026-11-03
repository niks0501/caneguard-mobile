import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { FARMER_COPY, type FarmerCopyBlock, type FarmerLanguage } from '@/constants/copy';
import { useAuth } from '@/features/auth/hooks/useAuth';

export type { FarmerLanguage };

type LanguagePreferenceContextValue = {
  /**
   * Effective language: English for every non-farmer session; for farmers the saved
   * choice, else Tagalog.
   */
  language: FarmerLanguage;
  isHydrated: boolean;
  setLanguage: (language: FarmerLanguage) => void;
};

export const LANGUAGE_STORAGE_KEY = 'caneguard.language';

const LanguagePreferenceContext = createContext<LanguagePreferenceContextValue | null>(null);

export function isFarmerLanguage(value: string | null): value is FarmerLanguage {
  return value === 'en' || value === 'tl';
}

export function LanguagePreferenceProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [preferredLanguage, setPreferredLanguage] = useState<FarmerLanguage | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());
  const hasSelectedLanguage = useRef(false);
  const language: FarmerLanguage =
    user?.role === 'farmer' ? preferredLanguage ?? 'tl' : 'en';

  useEffect(() => {
    let isMounted = true;

    async function restoreLanguagePreference() {
      try {
        const storedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (isMounted && !hasSelectedLanguage.current && isFarmerLanguage(storedLanguage)) {
          setPreferredLanguage(storedLanguage);
        }
      } catch (error: unknown) {
        console.warn('Unable to restore the saved language preference.', error);
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    }

    void restoreLanguagePreference();

    return () => {
      isMounted = false;
    };
  }, []);

  function setLanguage(nextLanguage: FarmerLanguage) {
    hasSelectedLanguage.current = true;
    setPreferredLanguage(nextLanguage);

    persistenceQueue.current = persistenceQueue.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage))
      .catch((error: unknown) => {
        console.warn('Unable to save the language preference.', error);
      });
  }

  return (
    <LanguagePreferenceContext.Provider value={{ language, isHydrated, setLanguage }}>
      {children}
    </LanguagePreferenceContext.Provider>
  );
}

export function useLanguagePreference(): LanguagePreferenceContextValue {
  const context = useContext(LanguagePreferenceContext);

  if (!context) {
    throw new Error('useLanguagePreference must be used within LanguagePreferenceProvider.');
  }

  return context;
}

/** Returns the farmer copy block for the active language. */
export function useFarmerCopy(): FarmerCopyBlock {
  return FARMER_COPY[useLanguagePreference().language];
}
