import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { OfficeFieldMapCard } from '@/features/assignments/components/OfficeFieldMapCard';
import { fetchAssignmentFieldMap } from '@/features/surveys/api/fieldSurveysApi';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/surveys/api/fieldSurveysApi', () => ({ fetchAssignmentFieldMap: jest.fn() }));

const map = {
  fieldSurveyId: 41,
  source: 'confirmed' as const,
  label: 'North lot',
  polygon: { type: 'Polygon' as const, coordinates: [[[121, 14], [121.002, 14], [121.002, 14.002], [121, 14]]] },
  areaSqm: 12_000,
  inspectorName: 'Ana Original',
};

describe('OfficeFieldMapCard', () => {
  beforeEach(() => jest.clearAllMocks());

  // Intent: a handed-off visit shows the case's map and starts the survey from its outline.
  it('shows the case map and starts a survey from its outline', async () => {
    jest.mocked(fetchAssignmentFieldMap).mockResolvedValue(map);
    await render(<OfficeFieldMapCard accessToken="token" assignmentId="assignment-1" />);

    expect(await screen.findByText('North lot · 1.20 ha plot · measured by Ana Original')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('field-validation.office-field-map.use'));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/field-survey', params: { outlineFrom: 'assignment-1' } });
  });

  // Intent: no map, no connection or no token mean no card, never a broken one.
  it('shows nothing when the case has no map, the read fails, or there is no token', async () => {
    jest.mocked(fetchAssignmentFieldMap).mockResolvedValue(null);
    const { rerender } = await render(<OfficeFieldMapCard accessToken="token" assignmentId="a" />);
    await waitFor(() => expect(fetchAssignmentFieldMap).toHaveBeenCalled());
    expect(screen.queryByTestId('field-validation.office-field-map')).toBeNull();

    jest.mocked(fetchAssignmentFieldMap).mockRejectedValue(new Error('offline'));
    await rerender(<OfficeFieldMapCard accessToken="other" assignmentId="a" />);
    await waitFor(() => expect(fetchAssignmentFieldMap).toHaveBeenCalledTimes(2));
    expect(screen.queryByTestId('field-validation.office-field-map')).toBeNull();

    jest.mocked(fetchAssignmentFieldMap).mockClear();
    await rerender(<OfficeFieldMapCard accessToken={null} assignmentId="a" />);
    expect(fetchAssignmentFieldMap).not.toHaveBeenCalled();
  });
});
