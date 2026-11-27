import {
  clearReplacedReportSurveys,
  consumeReplacedReportSurvey,
  recordReplacedReportSurvey,
} from '../reportSurveyHandoff';

describe('reportSurveyHandoff', () => {
  afterEach(() => {
    clearReplacedReportSurveys();
  });

  it('stores and consumes a replacement survey UUID exactly once', () => {
    recordReplacedReportSurvey('original-uuid', 'replacement-uuid');

    expect(consumeReplacedReportSurvey('original-uuid')).toBe('replacement-uuid');
    expect(consumeReplacedReportSurvey('original-uuid')).toBeNull();
  });

  it('ignores empty or self-referential replacements', () => {
    recordReplacedReportSurvey('', 'replacement-uuid');
    recordReplacedReportSurvey('same-uuid', 'same-uuid');

    expect(consumeReplacedReportSurvey('')).toBeNull();
    expect(consumeReplacedReportSurvey('same-uuid')).toBeNull();
  });
});
