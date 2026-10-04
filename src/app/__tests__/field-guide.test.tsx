import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import FieldGuideEntryScreen from '@/app/field-guide/[entryId]';
import FieldGuideIndexScreen from '@/app/field-guide/index';
import {
  DECISION_SUPPORT_DISCLAIMER,
  FIELD_GUIDE_APP_CAN_CHECK,
  FIELD_GUIDE_APP_CANNOT_CHECK,
  FIELD_GUIDE_INTRO,
  FIELD_GUIDE_NOT_FOUND_TITLE,
  FIELD_GUIDE_SECTION_DETAIL,
  FIELD_GUIDE_SECTION_IMPACT,
  FIELD_GUIDE_SECTION_MANAGEMENT,
  FIELD_GUIDE_SECTION_SIGNS,
  FIELD_GUIDE_SECTION_WHERE_TO_LOOK,
} from '@/constants/copy';
import { FIELD_GUIDE_LAUNCH_ENTRY_IDS } from '@/features/field-guide/domain/fieldGuideTypes';

// Asset modules required at module scope, exactly as the entry data requires
// them, so a screen test compares the same module the screen renders.
const REFERENCE_PHOTOS = {
  healthy: require('../../../assets/images/sugarcane-diseases/reference_healthy.jpg'),
  mosaic: require('../../../assets/images/sugarcane-diseases/reference_mosaic.jpg'),
  rust: require('../../../assets/images/sugarcane-diseases/reference_rust.jpg'),
} as const;

const DROP_PHOTOS = {
  healthy: [require('../../../assets/images/field-guide/healthy/01-healthy.jpg')],
  mosaic: [require('../../../assets/images/field-guide/mosaic/01-mosaic.jpg')],
  rust: [require('../../../assets/images/field-guide/rust/01-rust.jpg')],
  smut: [
    require('../../../assets/images/field-guide/smut/01-smut.jpg'),
    require('../../../assets/images/field-guide/smut/02-smut.jpg'),
  ],
  rssi: [
    require('../../../assets/images/field-guide/rssi/01-rssi.jpg'),
    require('../../../assets/images/field-guide/rssi/02-rssi.jpg'),
  ],
} as const;

const mockPush = jest.mocked(router.push);
const mockReplace = jest.mocked(router.replace);
const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);

function showEntry(entryId: string) {
  mockUseLocalSearchParams.mockReturnValue({ entryId });
}

beforeEach(() => {
  showEntry('rust');
});

describe('FieldGuideIndexScreen', () => {
  it('renders every launch entry once, with its category heading in reading order', async () => {
    await render(<FieldGuideIndexScreen />);

    expect(screen.getByTestId('field-guide.screen')).toBeOnTheScreen();
    expect(screen.getByText('Field guide')).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_INTRO)).toBeOnTheScreen();
    expect(screen.getByText(DECISION_SUPPORT_DISCLAIMER)).toBeOnTheScreen();

    expect(
      screen
        .getAllByTestId(/^field-guide\.entry\.[a-z0-9-]+$/)
        .map((node) => node.props.testID),
    ).toEqual(FIELD_GUIDE_LAUNCH_ENTRY_IDS.map((id) => `field-guide.entry.${id}`));

    expect(
      screen.getAllByTestId(/^field-guide\.section\./).map((node) => node.props.testID),
    ).toEqual([
      'field-guide.section.healthy',
      'field-guide.section.disease',
      'field-guide.section.pest',
    ]);
    expect(screen.getByText('Baseline')).toBeOnTheScreen();
    expect(screen.getByText('Diseases')).toBeOnTheScreen();
    expect(screen.getByText('Pests')).toBeOnTheScreen();
  });

  it('wires every launch entry to a bundled photo, and the drop fills the old empty frames', async () => {
    await render(<FieldGuideIndexScreen />);

    expect(screen.getByText('Healthy')).toBeOnTheScreen();
    expect(screen.getByText('Mosaic')).toBeOnTheScreen();
    expect(screen.getByText('Rust')).toBeOnTheScreen();
    expect(screen.getByText('Smut')).toBeOnTheScreen();

    for (const id of FIELD_GUIDE_LAUNCH_ENTRY_IDS) {
      expect(screen.getByTestId(`field-guide.entry.${id}.media`)).toBeOnTheScreen();
    }

    // Smut and RSSI used to render the description-only frame; the captain's
    // dropped photos now fill them on the card as well.
    expect(screen.getByLabelText('Smut reference photo')).toBeOnTheScreen();
    expect(
      screen.getByLabelText('Red-Striped Soft Scale Insect reference photo'),
    ).toBeOnTheScreen();
    expect(screen.queryByText('No photo available · description only')).not.toBeOnTheScreen();
  });

  it('states which entries the app can check and which it cannot', async () => {
    await render(<FieldGuideIndexScreen />);

    expect(screen.getAllByText(FIELD_GUIDE_APP_CAN_CHECK)).toHaveLength(4);
    expect(screen.getByText(FIELD_GUIDE_APP_CANNOT_CHECK)).toBeOnTheScreen();
  });

  it('opens an entry when its card is pressed', async () => {
    await render(<FieldGuideIndexScreen />);

    await fireEvent.press(screen.getByTestId('field-guide.entry.rssi'));

    expect(mockPush).toHaveBeenCalledWith('/field-guide/rssi');
  });
});

describe('FieldGuideEntryScreen', () => {
  it('renders the five reading sections in order for a model-linked entry', async () => {
    showEntry('rust');
    await render(<FieldGuideEntryScreen />);

    expect(screen.getByTestId('field-guide.detail.screen')).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.detail.rust.signs')).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.detail.rust.where-to-look')).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.detail.rust.impact')).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.detail.rust.management')).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.detail.rust.detail')).toBeOnTheScreen();

    expect(screen.getByText(FIELD_GUIDE_SECTION_SIGNS)).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_SECTION_WHERE_TO_LOOK)).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_SECTION_IMPACT)).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_SECTION_MANAGEMENT)).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_SECTION_DETAIL)).toBeOnTheScreen();

    expect(screen.getByText(DECISION_SUPPORT_DISCLAIMER)).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.detail.rust.app-check')).toHaveTextContent(
      FIELD_GUIDE_APP_CAN_CHECK,
    );
    expect(screen.queryByText(FIELD_GUIDE_APP_CANNOT_CHECK)).not.toBeOnTheScreen();
  });

  it('tells the reader the app cannot check RSSI and never the possible-condition line', async () => {
    showEntry('rssi');
    await render(<FieldGuideEntryScreen />);

    expect(screen.getByTestId('field-guide.detail.rssi.app-check')).toHaveTextContent(
      FIELD_GUIDE_APP_CANNOT_CHECK,
    );
    expect(screen.queryByText(FIELD_GUIDE_APP_CAN_CHECK)).not.toBeOnTheScreen();
    expect(screen.queryByText(/Possible Condition/i)).not.toBeOnTheScreen();
    expect(screen.getAllByText(/Red-Striped Soft Scale Insect/).length).toBeGreaterThan(0);
  });

  it.each(FIELD_GUIDE_LAUNCH_ENTRY_IDS)(
    'renders a bundled photo for the %s entry instead of the description-only frame',
    async (id) => {
      // No launch entry has an empty photo list any more, so the
      // description-only frame is unreachable from the five entry pages.
      showEntry(id);
      await render(<FieldGuideEntryScreen />);

      expect(screen.getByTestId(`field-guide.detail.${id}.media`)).toBeOnTheScreen();
      expect(screen.getByTestId(`field-guide.detail.${id}.photo.1`)).toBeOnTheScreen();
      expect(screen.queryByText('No photo available · description only')).not.toBeOnTheScreen();
    },
  );

  it.each([
    ['healthy', 'A healthy sugarcane stool with evenly green leaves'],
    ['mosaic', 'Leaf mottling with contrasting light and dark green areas'],
    ['rust', 'Orange-brown rust pustules on the leaf underside'],
  ] as const)('renders the %s reference photo first, with its caption', async (id, caption) => {
    showEntry(id);
    await render(<FieldGuideEntryScreen />);

    expect(screen.getByTestId(`field-guide.detail.${id}.media`)).toBeOnTheScreen();
    expect(screen.getByTestId(`field-guide.detail.${id}.photo.1`)).toHaveProp(
      'source',
      REFERENCE_PHOTOS[id],
    );
    expect(screen.getByLabelText(caption)).toBeOnTheScreen();
    expect(screen.getByText(caption)).toBeOnTheScreen();
  });

  it.each([
    ['smut', 'A single long whip rising above the cane canopy'],
    ['rssi', 'Red-striped scale insects clustered along the leaf blade'],
  ] as const)('renders both %s drop photos with their captions', async (id, caption) => {
    showEntry(id);
    await render(<FieldGuideEntryScreen />);

    DROP_PHOTOS[id].forEach((asset, index) => {
      expect(screen.getByTestId(`field-guide.detail.${id}.photo.${index + 1}`)).toHaveProp(
        'source',
        asset,
      );
    });
    expect(screen.getByText(caption)).toBeOnTheScreen();
    expect(screen.queryByText('No photo available · description only')).not.toBeOnTheScreen();
  });

  it('renders the drop after the reference photo on the healthy entry', async () => {
    showEntry('healthy');
    await render(<FieldGuideEntryScreen />);

    expect(screen.getByTestId('field-guide.detail.healthy.photo.2')).toHaveProp(
      'source',
      DROP_PHOTOS.healthy[0],
    );
    expect(
      screen.getByText('Clean, evenly green leaf blades on a healthy stool'),
    ).toBeOnTheScreen();
  });

  it('renders an honest not-found state for an unknown id instead of throwing', async () => {
    showEntry('not-a-real-entry');
    await render(<FieldGuideEntryScreen />);

    expect(screen.getByTestId('field-guide.detail.not-found')).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_NOT_FOUND_TITLE)).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('field-guide.detail.not-found.action'));
    expect(mockReplace).toHaveBeenCalledWith('/field-guide');
  });
});

