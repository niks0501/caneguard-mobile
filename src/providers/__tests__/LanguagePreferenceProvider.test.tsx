import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { FARMER_COPY } from '@/constants/copy';
import {
  LANGUAGE_STORAGE_KEY,
  LanguagePreferenceProvider,
  useFarmerCopy,
  useLanguagePreference,
} from '@/providers/LanguagePreferenceProvider';

let mockRole: 'farmer' | 'field_reporter' = 'farmer';
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: mockRole } }),
}));

const api = {} as ReturnType<typeof useLanguagePreference>;
function Probe() {
  Object.assign(api, useLanguagePreference());
  const copy = useFarmerCopy();
  return <Text testID="greeting">{copy.greeting.morning}</Text>;
}

async function mount() {
  return render(
    <LanguagePreferenceProvider>
      <Probe />
    </LanguagePreferenceProvider>,
  );
}

beforeEach(async () => {
  mockRole = 'farmer';
  await AsyncStorage.clear();
});

describe('LanguagePreferenceProvider', () => {
  it('defaults to Tagalog for farmers and English for inspectors', async () => {
    const view = await mount();
    await waitFor(() => expect(api.isHydrated).toBe(true));
    expect(screen.getByTestId('greeting').props.children).toBe(FARMER_COPY.tl.greeting.morning);
    await view.unmount();

    mockRole = 'field_reporter';
    await mount();
    await waitFor(() => expect(api.isHydrated).toBe(true));
    expect(screen.getByTestId('greeting').props.children).toBe(FARMER_COPY.en.greeting.morning);
  });

  it('persists the choice across a restart', async () => {
    const first = await mount();
    await waitFor(() => expect(api.isHydrated).toBe(true));
    await act(async () => api.setLanguage('en'));
    await waitFor(async () => expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en'));
    await first.unmount();

    await mount();
    await waitFor(() => expect(api.isHydrated).toBe(true));
    expect(api.language).toBe('en');
  });
});
