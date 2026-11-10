import { fireEvent, render, screen } from '@testing-library/react-native';

import { FIELD_SURVEY_COPY } from '@/constants/copy';
import { ReportSurveyCard } from '@/features/reports/components/ReportSurveyCard';
import type { FieldSurveyRow } from '@/database/schema';

// Two quadrilateral plots near 14°N, 121°E, sized so the expected hectares stay
// far from a cent-hectare rounding edge. Expected areas are computed
// independently of the app: the WGS84 ellipsoid zone integral
// dA = a²(1−e²) cosφ / (1−e² sin²φ)² dφ dλ over the plot's latitude and
// longitude spans gives 25,100.8 m² for 0.001° × 0.0021° (2.51 ha) and
// 50,201.6 m² for 0.002° × 0.0021° (5.02 ha).
const MEASURED_HECTARES = '2.51 ha';
const WIDER_HECTARES = '5.02 ha';

const MEASURED_WAYPOINTS = [
  { latitude: 14, longitude: 121, accuracyMeters: null, capturedAt: '2026-01-01T00:00:00.000Z', source: 'map' },
  { latitude: 14, longitude: 121.0021, accuracyMeters: null, capturedAt: '2026-01-01T00:00:01.000Z', source: 'map' },
  { latitude: 14.001, longitude: 121.0021, accuracyMeters: null, capturedAt: '2026-01-01T00:00:02.000Z', source: 'map' },
  { latitude: 14.001, longitude: 121, accuracyMeters: null, capturedAt: '2026-01-01T00:00:03.000Z', source: 'map' },
];

// The same plot redrawn with twice the north-south span, so its area cannot be
// confused with MEASURED_WAYPOINTS.
const WIDER_WAYPOINTS = [
  { latitude: 14, longitude: 121, accuracyMeters: null, capturedAt: '2026-01-02T00:00:00.000Z', source: 'map' },
  { latitude: 14, longitude: 121.0021, accuracyMeters: null, capturedAt: '2026-01-02T00:00:01.000Z', source: 'map' },
  { latitude: 14.002, longitude: 121.0021, accuracyMeters: null, capturedAt: '2026-01-02T00:00:02.000Z', source: 'map' },
  { latitude: 14.002, longitude: 121, accuracyMeters: null, capturedAt: '2026-01-02T00:00:03.000Z', source: 'map' },
];

function hectaresShownFor(testID: string): string {
  const label = String(screen.getByTestId(testID).props.accessibilityLabel);
  return label.split(' · ')[1];
}

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
    const onOpenMeasure = jest.fn();
    await render(
      <ReportSurveyCard
        attachedSurvey={null}
        attachedUuid="gone-survey"
        onAttach={jest.fn()}
        onOpenMeasure={onOpenMeasure}
        surveys={[]}
      />,
    );
    expect(screen.getByText(FIELD_SURVEY_COPY.linkMissing)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('field-report.survey-open'));
    expect(onOpenMeasure).toHaveBeenCalledWith('gone-survey');
  });

  it('offers a drawn draft whose measured area is only in its saved waypoints', async () => {
    const onAttach = jest.fn();
    await render(
      <ReportSurveyCard
        attachedSurvey={null}
        attachedUuid={null}
        onAttach={onAttach}
        onOpenMeasure={jest.fn()}
        surveys={[
          survey({ clientUuid: 'measured-from-polygon' }),
          survey({ clientUuid: 'draft-measured', polygonJson: null, areaSqm: null, status: 'draft' }),
        ]}
      />,
    );

    expect(hectaresShownFor('field-report.survey-attach.draft-measured')).toBe(MEASURED_HECTARES);
    expect(hectaresShownFor('field-report.survey-attach.measured-from-polygon')).toBe(
      MEASURED_HECTARES,
    );

    await fireEvent.press(screen.getByTestId('field-report.survey-attach.draft-measured'));
    expect(onAttach).toHaveBeenCalledWith('draft-measured');
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

  it('measures a corrected boundary from its current waypoints, not a stale polygon', async () => {
    await render(
      <ReportSurveyCard
        attachedSurvey={null}
        attachedUuid={null}
        onAttach={jest.fn()}
        onOpenMeasure={jest.fn()}
        surveys={[
          survey({ clientUuid: 'corrected', status: 'failed', waypointsJson: JSON.stringify(WIDER_WAYPOINTS) }),
          survey({
            clientUuid: 'current',
            polygonJson: null,
            waypointsJson: JSON.stringify(WIDER_WAYPOINTS),
            areaSqm: null,
            status: 'draft',
          }),
        ]}
      />,
    );

    expect(hectaresShownFor('field-report.survey-attach.corrected')).toBe(WIDER_HECTARES);
    expect(hectaresShownFor('field-report.survey-attach.current')).toBe(WIDER_HECTARES);
  });

  it('hides a boundary whose current waypoints are no longer usable', async () => {
    await render(
      <ReportSurveyCard
        attachedSurvey={null}
        attachedUuid={null}
        onAttach={jest.fn()}
        onOpenMeasure={jest.fn()}
        surveys={[
          survey({
            clientUuid: 'corrected-but-broken',
            status: 'failed',
            waypointsJson: JSON.stringify(MEASURED_WAYPOINTS.slice(0, 2)),
          }),
        ]}
      />,
    );

    expect(screen.queryByTestId('field-report.survey-attach.corrected-but-broken')).toBeNull();
  });

  it('labels a boundary that could not be sent without calling it pending', async () => {
    await render(
      <ReportSurveyCard
        attachedSurvey={null}
        attachedUuid={null}
        onAttach={jest.fn()}
        onOpenMeasure={jest.fn()}
        surveys={[survey({ clientUuid: 'failed-survey', status: 'failed' })]}
      />,
    );

    const label = String(
      screen.getByTestId('field-report.survey-attach.failed-survey').props.accessibilityLabel,
    );
    expect(label).toContain('Not sent');
    expect(label).not.toContain('Waiting to send');
  });
});
