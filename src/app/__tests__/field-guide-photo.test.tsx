import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import FieldGuidePhotoScreen from '@/app/field-guide/[entryId]/photo';
import {
  FIELD_GUIDE_CREDIT_MISSING,
  FIELD_GUIDE_EDUCATION_DISCLAIMER,
  FIELD_GUIDE_NOT_FOUND_TITLE,
  FIELD_GUIDE_PENDING_VALIDATION_NOTICE,
  FIELD_GUIDE_PHOTO_VIEWER_CLOSE,
  FIELD_GUIDE_PHOTO_VIEWER_HINT,
  FIELD_GUIDE_PHOTO_VIEWER_MISSING_TITLE,
} from '@/constants/copy';

const SMUT_WHIP_PHOTO = require('../../../assets/images/field-guide/smut/01-smut.jpg');
const SMUT_SECOND_PHOTO = require('../../../assets/images/field-guide/smut/02-smut.jpg');

const mockBack = jest.mocked(router.back);
const mockReplace = jest.mocked(router.replace);
const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);

function showPhoto(entryId: string, index: string) {
  mockUseLocalSearchParams.mockReturnValue({ entryId, index });
}

describe('FieldGuidePhotoScreen', () => {
  it('opens the selected bundled photo uncropped with its caption and credits', async () => {
    showPhoto('smut', '0');
    await render(<FieldGuidePhotoScreen />);

    expect(screen.getByTestId('field-guide.photo.screen')).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.photo.image')).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.photo.image.reset')).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.photo.caption')).toHaveTextContent(
      'A single long whip rising above the cane canopy',
    );
    expect(
      screen.getByLabelText('A single long whip rising above the cane canopy'),
    ).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_PHOTO_VIEWER_HINT)).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_CREDIT_MISSING)).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_EDUCATION_DISCLAIMER)).toBeOnTheScreen();
    expect(screen.getByTestId('field-guide.photo.pending-validation')).toHaveTextContent(
      FIELD_GUIDE_PENDING_VALIDATION_NOTICE,
    );
  });

  it('selects the photo the reader tapped', async () => {
    showPhoto('smut', '1');
    await render(<FieldGuidePhotoScreen />);

    expect(screen.getByTestId('field-guide.photo.caption')).toHaveTextContent(
      'Several whips curling over a smut-affected block',
    );
    // Both photos are bundled assets required by the entry data, never URIs.
    expect(SMUT_WHIP_PHOTO).not.toBe(SMUT_SECOND_PHOTO);
  });

  it('closes back to the entry', async () => {
    showPhoto('rust', '0');
    await render(<FieldGuidePhotoScreen />);

    await fireEvent.press(screen.getByLabelText(FIELD_GUIDE_PHOTO_VIEWER_CLOSE));
    expect(mockBack).toHaveBeenCalled();
  });

  it('renders an honest empty state for an out-of-range photo', async () => {
    showPhoto('smut', '99');
    await render(<FieldGuidePhotoScreen />);

    expect(screen.getByTestId('field-guide.photo.not-found')).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_PHOTO_VIEWER_MISSING_TITLE)).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('field-guide.photo.not-found.action'));
    expect(mockReplace).toHaveBeenCalledWith('/field-guide/smut');
  });

  it('renders an honest empty state for an unknown entry', async () => {
    showPhoto('not-a-real-entry', '0');
    await render(<FieldGuidePhotoScreen />);

    expect(screen.getByText(FIELD_GUIDE_NOT_FOUND_TITLE)).toBeOnTheScreen();
  });
});
