import { render, screen } from '@testing-library/react-native';

import DiseaseReferenceScreen from '@/app/disease-reference';

describe('DiseaseReferenceScreen', () => {
  it('renders all four reference classes with consistent media presentation and safe Smut fallback', async () => {
    await render(<DiseaseReferenceScreen />);

    expect(screen.getByText('Disease reference')).toBeOnTheScreen();
    expect(screen.getByText('Sugarcane condition reference')).toBeOnTheScreen();

    expect(screen.getByText('Healthy')).toBeOnTheScreen();
    expect(screen.getByText('Mosaic')).toBeOnTheScreen();
    expect(screen.getByText('Rust')).toBeOnTheScreen();
    expect(screen.getByText('Smut')).toBeOnTheScreen();

    // All four cards share the exact same sub-label structure
    expect(screen.getAllByText('Observational reference')).toHaveLength(4);
    expect(screen.queryByText(/Model V1/i)).not.toBeOnTheScreen();

    // Media frames exist for all four classes
    expect(screen.getByTestId('disease-reference.media.healthy')).toBeOnTheScreen();
    expect(screen.getByTestId('disease-reference.media.mosaic')).toBeOnTheScreen();
    expect(screen.getByTestId('disease-reference.media.rust')).toBeOnTheScreen();
    expect(screen.getByTestId('disease-reference.media.smut')).toBeOnTheScreen();

    // Healthy, Mosaic, and Rust render their photos
    expect(screen.getByLabelText('Healthy reference photo')).toHaveProp(
      'source',
      require('../../../assets/images/sugarcane-diseases/reference_healthy.jpg'),
    );
    expect(screen.getByLabelText('Mosaic reference photo')).toHaveProp(
      'source',
      require('../../../assets/images/sugarcane-diseases/reference_mosaic.jpg'),
    );
    expect(screen.getByLabelText('Rust reference photo')).toHaveProp(
      'source',
      require('../../../assets/images/sugarcane-diseases/reference_rust.jpg'),
    );

    // Smut uses the approved safe fallback (full-size description-only state)
    expect(screen.getByLabelText('Smut reference description')).toBeOnTheScreen();
    expect(screen.getByText('No photo available · description only')).toBeOnTheScreen();
    expect(
      screen.getAllByText(/dark, whip-like growth emerging/i).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Smut reference photo')).not.toBeOnTheScreen();
  });
});
