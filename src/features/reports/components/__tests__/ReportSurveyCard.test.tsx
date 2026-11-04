import { fireEvent, render, screen } from '@testing-library/react-native';

import { FIELD_SURVEY_COPY } from '@/constants/copy';
import { ReportSurveyCard } from '@/features/reports/components/ReportSurveyCard';
import type { FieldSurveyRow } from '@/database/schema';

// A one-hectare-scale plot near 14°N, 121°E: ~111 m north-south by ~108 m
// east-west, so the geodesic area is about 12,000 m², i.e. 1.20 ha.
const MEASURED_WAYPOINTS = [
  { latitude: 14, longitude: 121, accuracyMeters: null, capturedAt: '2026-01-01T00:00:00.000Z', source: 'map' },
  { latitude: 14, longitude: 121.001, accuracyMeters: null, capturedAt: '2026-01-01T00:00:01.000Z', source: 'map' },
  { latitude: 14.001, longitude: 121.001, accuracyMeters: null, capturedAt: '2026-01-01T00:00:02.000Z', source: 'map' },
  { latitude: 14.001, longitude: 121, accuracyMeters: null, capturedAt: '2026-01-01T00:00:03.000Z', source: 'map' },
];

const MEASURED_DRAFT_LABEL = `${FIELD_SURVEY_COPY.linkAttach}: ${FIELD_SURVEY_COPY.linkOption(
  'D1',
  '1.20',
  FIELD_SURVEY_COPY.linkStatusDraft,
)}`;

function survey(overrides: Partial<FieldSurveyRow>): FieldSurveyRow {
  return {
    clientUuid: 'survey-1',
    districtCode: 'D1',
    polygonJson: JSON.stringify({
      type: 'Polygon',
      coordinates: [[
        ...MEASURED_WAYPOINTS.map(({ longitude, latitude }) => [longitude, latitude]),
        [MEASURED_WAYPOINTS[0].longitude, MEASURED_WAYPOINTS[0].latitude],
      ]],
    }),
    waypointsJson: JSON.stringify(MEASURED_WAYPOINTS),
    areaSqm: 25_000,
    status: 'synced',
    ...overrides,
  } as FieldSurveyRow;
}

describe('ReportSurveyCard', () => {
  it('attaches a saved survey by its client uuid', async () => {
    const onAttach = jest.fn();
    await render(
      <ReportSurveyCard
        attachedSurvey={null}
        attachedUuid={null}
        onAttach={onAttach}
        onOpenMeasure={jest.fn()}
        surveys={[survey({})]}
      />,
    );
    await fireEvent.press(screen.getByTestId('field-report.survey-attach.survey-1'));
    expect(onAttach).toHaveBeenCalledWith('survey-1');
  });

  it('jumps to the attached survey in Measure and can remove it', async () => {
    const onAttach = jest.fn();
    const onOpenMeasure = jest.fn();
    const attached = survey({});
    await render(
      <ReportSurveyCard
        attachedSurvey={attached}
        attachedUuid="survey-1"
        onAttach={onAttach}
        onOpenMeasure={onOpenMeasure}
        surveys={[attached]}
      />,
    );
    expect(screen.getByTestId('field-report.survey-attached')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('field-report.survey-open'));
    expect(onOpenMeasure).toHaveBeenCalledWith('survey-1');
    await fireEvent.press(screen.getByTestId('field-report.survey-remove'));
    expect(onAttach).toHaveBeenCalledWith(null);
  });

  it('keeps showing an attached boundary that is outside the recent survey list', async () => {
    const onOpenMeasure = jest.fn();
    const attached = survey({ clientUuid: 'older-survey' });
    await render(
      <ReportSurveyCard
        attachedSurvey={attached}
        attachedUuid="older-survey"
        onAttach={jest.fn()}
        onOpenMeasure={onOpenMeasure}
        surveys={[]}
      />,
    );
    expect(screen.getByTestId('field-report.survey-attached')).toBeTruthy();
    expect(screen.queryByText(FIELD_SURVEY_COPY.linkMissing)).toBeNull();
    await fireEvent.press(screen.getByTestId('field-report.survey-open'));
    expect(onOpenMeasure).toHaveBeenCalledWith('older-survey');
  });

  it('reports an attached boundary that is no longer saved on this phone', async () => {
    await render(
      <ReportSurveyCard
        attachedSurvey={null}
        attachedUuid="gone-survey"
        onAttach={jest.fn()}
        onOpenMeasure={jest.fn()}
        surveys={[]}
      />,
    );
    expect(screen.getByText(FIELD_SURVEY_COPY.linkMissing)).toBeTruthy();
  });

  it('offers a drawn draft whose measured area is only in its saved waypoints', async () => {
    const onAttach = jest.fn();
    await render(
      <ReportSurveyCard
        attachedSurvey={null}
        attachedUuid={null}
        onAttach={onAttach}
        onOpenMeasure={jest.fn()}
        surveys={[survey({ clientUuid: 'draft-measured', polygonJson: null, areaSqm: null, status: 'draft' })]}
      />,
    );
    await fireEvent.press(screen.getByTestId('field-report.survey-attach.draft-measured'));
    expect(onAttach).toHaveBeenCalledWith('draft-measured');
    expect(screen.getByText(MEASURED_DRAFT_LABEL)).toBeTruthy();
  });

  it('opens a fresh Measure when nothing is attached and hides unmeasured drafts', async () => {
    const onOpenMeasure = jest.fn();
    await render(
      <ReportSurveyCard
        attachedSurvey={null}
        attachedUuid={null}
        onAttach={jest.fn()}
        onOpenMeasure={onOpenMeasure}
        surveys={[
          survey({ clientUuid: 'empty', polygonJson: null, waypointsJson: '[]', areaSqm: null, status: 'draft' }),
          survey({
            clientUuid: 'empty-polygon',
            polygonJson: null,
            waypointsJson: JSON.stringify(MEASURED_WAYPOINTS.slice(0, 2)),
            areaSqm: null,
            status: 'draft',
          }),
        ]}
      />,
    );
    expect(screen.queryByTestId('field-report.survey-attach.empty')).toBeNull();
    expect(screen.queryByTestId('field-report.survey-attach.empty-polygon')).toBeNull();
    expect(screen.getByText(FIELD_SURVEY_COPY.linkEmpty)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('field-report.survey-open'));
    expect(onOpenMeasure).toHaveBeenCalledWith(null);
  });
});
