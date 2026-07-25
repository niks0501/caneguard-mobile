import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { ScanSessionProvider } from '@/features/detection/context/ScanSessionProvider';
import { useScanSession } from '@/features/detection/context/useScanSession';

function SessionProbe() {
  const { state, dispatch } = useScanSession();

  return (
    <>
      <Text>{state.status}</Text>
      <Text>{state.sourceUri ?? 'no image'}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select test image"
        onPress={() =>
          dispatch({
            type: 'SELECT_IMAGE',
            payload: {
              sourceUri: 'file:///provider-leaf.jpg',
              sourceWidth: 640,
              sourceHeight: 480,
              sourceType: 'camera',
            },
          })
        }
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reset test scan"
        onPress={() => dispatch({ type: 'RESET_SCAN' })}
      />
    </>
  );
}

describe('ScanSessionProvider', () => {
  it('owns one scan session and exposes reducer actions through the hook', async () => {
    await render(
      <ScanSessionProvider>
        <SessionProbe />
      </ScanSessionProvider>,
    );

    expect(screen.getByText('idle')).toBeOnTheScreen();
    expect(screen.getByText('no image')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Select test image'));

    expect(screen.getByText('image-selected')).toBeOnTheScreen();
    expect(screen.getByText('file:///provider-leaf.jpg')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Reset test scan'));

    expect(screen.getByText('idle')).toBeOnTheScreen();
    expect(screen.getByText('no image')).toBeOnTheScreen();
  });
});
