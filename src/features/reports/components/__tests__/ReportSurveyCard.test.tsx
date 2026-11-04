import { fireEvent, render, screen } from '@testing-library/react-native';

import { ReportSurveyCard } from '@/features/reports/components/ReportSurveyCard';
import type { FieldSurveyRow } from '@/database/schema';

function survey(overrides: Partial<FieldSurveyRow>): FieldSurveyRow {
  return {
    clientUuid: 'survey-1',
    districtCode: 'D1',
    polygonJson: '[]',
    areaSqm: 25_000,
    status: 'synced',
    ...overrides,
  } as FieldSurveyRow;
}

describe('ReportSurveyCard', () => {
  it('attaches a saved survey by its client uuid', async () => {
    const onAttach = jest.fn();
    await render(<ReportSurveyCard attachedUuid={null} onAttach={onAttach} onOpenMeasure={jest.fn()} surveys={[survey({})]} />);
    await fireEvent.press(screen.getByTestId('field-report.survey-attach.survey-1'));
    expect(onAttach).toHaveBeenCalledWith('survey-1');
  });

  it('jumps to the attached survey in Measure and can remove it', async () => {
    const onAttach = jest.fn();
    const onOpenMeasure = jest.fn();
    await render(<ReportSurveyCard attachedUuid="survey-1" onAttach={onAttach} onOpenMeasure={onOpenMeasure} surveys={[survey({})]} />);
    expect(screen.getByTestId('field-report.survey-attached')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('field-report.survey-open'));
    expect(onOpenMeasure).toHaveBeenCalledWith('survey-1');
    await fireEvent.press(screen.getByTestId('field-report.survey-remove'));
    expect(onAttach).toHaveBeenCalledWith(null);
  });

  it('opens a fresh Measure when nothing is attached and hides unmeasured drafts', async () => {
    const onOpenMeasure = jest.fn();
    await render(<ReportSurveyCard attachedUuid={null} onAttach={jest.fn()} onOpenMeasure={onOpenMeasure} surveys={[survey({ clientUuid: 'empty', polygonJson: null })]} />);
    expect(screen.queryByTestId('field-report.survey-attach.empty')).toBeNull();
    await fireEvent.press(screen.getByTestId('field-report.survey-open'));
    expect(onOpenMeasure).toHaveBeenCalledWith(null);
  });
});
