process.env.EXPO_PUBLIC_API_BASE_URL ??= 'http://127.0.0.1:8000';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@expo/vector-icons', () => {
  const React = require('react');

  function Feather(props) {
    return React.createElement('FeatherIcon', props);
  }

  Feather.glyphMap = {};

  return { Feather };
});

jest.mock('expo-image', () => {
  const React = require('react');

  return {
    Image: (props) => React.createElement('ExpoImage', props),
  };
});

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useFocusEffect: (callback) => callback(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  return {
    SafeAreaView: ({ children, ...props }) =>
      React.createElement('SafeAreaView', props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

jest.mock('@/hooks/use-theme', () => {
  const theme = new Proxy(
    {},
    {
      get: (_target, property) => String(property),
    },
  );

  return {
    useTheme: () => theme,
  };
});

jest.mock('@/providers/ThemePreferenceProvider', () => ({
  useThemePreference: () => ({
    colorScheme: 'light',
    isDarkMode: false,
    isHydrated: true,
    setDarkMode: jest.fn(),
  }),
}));
