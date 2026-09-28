process.env.EXPO_PUBLIC_API_BASE_URL ??= 'http://127.0.0.1:8000';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// FlashList v2 measures its own viewport and rows. Under Jest those measurements
// never resolve, so the list falls back to rendering every row and no test can
// observe windowing. Pin a 400x900 viewport with 100px rows instead: the window
// is then deterministic (about ten rows) regardless of the data length.
// `@shopify/flash-list/jestSetup` is not used because it maps the `FlashList`
// export to a `RecyclerView` the package stopped re-exporting, which makes every
// FlashList render fail with an invalid element type.
jest.mock('@shopify/flash-list/dist/recyclerview/utils/measureLayout', () => ({
  ...jest.requireActual('@shopify/flash-list/dist/recyclerview/utils/measureLayout'),
  measureFirstChildLayout: jest.fn(() => ({ height: 900, width: 400, x: 0, y: 0 })),
  measureItemLayout: jest.fn(() => ({ height: 100, width: 400, x: 0, y: 0 })),
  measureParentSize: jest.fn(() => ({ height: 900, width: 400, x: 0, y: 0 })),
}));

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
    dismissTo: jest.fn(),
    navigate: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    setParams: jest.fn(),
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
// react-native-gesture-handler ships a jestSetup that mocks its native module.
// react-native-reanimated 4 and react-native-worklets cannot load their native
// bindings under Jest, so both are replaced with their shipped JS mocks; the
// reanimated mock's runOnJS is an identity, so runOnJS-wrapped callbacks run
// synchronously in tests.
require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock.ts'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock.js'));
