import { render, screen } from '@testing-library/react-native';

import { ReferenceMedia } from '@/components/ui/ReferenceMedia';

const PHOTO = 1;

describe('ReferenceMedia', () => {
  it('renders the bundled photo through expo-image with a bounded cache', async () => {
    await render(
      <ReferenceMedia
        label="Healthy"
        patternDescription="No visible symptoms"
        photo={PHOTO}
        testID="reference.media"
      />,
    );

    const photo = screen.getByLabelText('Healthy reference photo');
    // `expo-image` supports container-size downscaling and an explicit cache
    // policy; the React Native Image it replaced supported neither.
    expect(photo.props.cachePolicy).toBe('memory-disk');
    expect(photo.props.contentFit).toBe('contain');
    expect(photo.props.source).toBe(PHOTO);
  });

  it('keeps the description-only frame when no photo is licensed', async () => {
    await render(
      <ReferenceMedia
        label="Smut"
        patternDescription="Dark, whip-like growth"
        testID="reference.media"
      />,
    );

    expect(screen.getByLabelText('Smut reference description')).toBeOnTheScreen();
    expect(screen.getByText('No photo available · description only')).toBeOnTheScreen();
    expect(screen.queryByLabelText('Smut reference photo')).not.toBeOnTheScreen();
  });
});
