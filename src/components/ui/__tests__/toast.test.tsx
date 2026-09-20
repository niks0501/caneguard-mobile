import { act, fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Button, Text, View } from 'react-native';

import { ToastProvider, useToast } from '@/components/ui/Toast';

function TestComponent() {
  const { showToast, hideToast, toast } = useToast();

  return (
    <View>
      <Text testID="toast-state">{toast?.message ?? 'no-toast'}</Text>
      <Button
        title="Show Success"
        onPress={() => showToast('Draft saved', 'success')}
      />
      <Button
        title="Show Error"
        onPress={() => showToast('Sync failed — will retry', 'error')}
      />
      <Button
        title="Show Info"
        onPress={() => showToast('Draft discarded', 'info')}
      />
      <Button title="Hide Toast" onPress={() => hideToast()} />
    </View>
  );
}

describe('Toast and ToastProvider', () => {
  it('renders a toast with plain copy and dismisses after duration', async () => {
    jest.useFakeTimers();
    await render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    expect(screen.queryByTestId('app-toast')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByText('Show Success'));
    });

    expect(screen.getByTestId('app-toast')).toBeOnTheScreen();
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Draft saved');

    // Fast-forward past duration
    await act(async () => {
      jest.advanceTimersByTime(3600);
    });

    expect(screen.queryByTestId('app-toast')).toBeNull();
    jest.useRealTimers();
  });

  it('renders error toast with assertive accessibilityLiveRegion', async () => {
    await render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByText('Show Error'));
    });

    const toast = screen.getByTestId('app-toast');
    expect(toast).toHaveTextContent('Sync failed — will retry');
    expect(toast).toHaveProp('accessibilityLiveRegion', 'assertive');
  });

  it('allows dismissing the toast on press', async () => {
    await render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    );

    await act(async () => {
      fireEvent.press(screen.getByText('Show Info'));
    });

    expect(screen.getByTestId('app-toast')).toHaveTextContent('Draft discarded');

    await act(async () => {
      fireEvent.press(screen.getByTestId('app-toast'));
    });

    expect(screen.queryByTestId('app-toast')).toBeNull();
  });

  it('safe fallback works outside of ToastProvider without throwing', async () => {
    await render(<TestComponent />);

    expect(screen.getByTestId('toast-state')).toHaveTextContent('no-toast');

    // Calling showToast should not throw
    await act(async () => {
      fireEvent.press(screen.getByText('Show Success'));
    });
  });
});
