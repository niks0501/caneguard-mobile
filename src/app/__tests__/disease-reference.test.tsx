import { render, screen } from '@testing-library/react-native';

import DiseaseReferenceScreen from '@/app/disease-reference';

describe('DiseaseReferenceScreen', () => {
  it('renders all four Model V1 reference classes with photos and patterns', async () => {
    await render(<DiseaseReferenceScreen />);

    expect(screen.getByText('Disease reference')).toBeOnTheScreen();
    expect(screen.getByText('Sugarcane condition reference')).toBeOnTheScreen();

    expect(screen.getByText('Healthy')).toBeOnTheScreen();
    expect(screen.getByText('Mosaic')).toBeOnTheScreen();
    expect(screen.getByText('Rust')).toBeOnTheScreen();
    expect(screen.getByText('Smut')).toBeOnTheScreen();

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
    expect(screen.getByLabelText('Smut reference pattern')).toBeOnTheScreen();

    expect(screen.getByText(/Dark, whip-like growth emerging/)).toBeOnTheScreen();
  });
});
