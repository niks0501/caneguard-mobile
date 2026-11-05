import { render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Gesture Handler 3 requires GestureDetector to sit under a
// GestureHandlerRootView. The app root provides one; screen tests that render a
// gesture screen on their own use this helper to supply it. The wrapper option
// keeps it in place across rerender().
function GestureRoot({ children }: { children: ReactNode }) {
  return <GestureHandlerRootView style={{ flex: 1 }}>{children}</GestureHandlerRootView>;
}

export function renderWithGestures(ui: ReactElement) {
  return render(ui, { wrapper: GestureRoot });
}
