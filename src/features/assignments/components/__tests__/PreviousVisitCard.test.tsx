import { render, screen } from '@testing-library/react-native';

import { PreviousVisitCard } from '@/features/assignments/components/PreviousVisitCard';

const previousVisit = {
  referenceCode: 'CG-2026-0000',
  visitedAt: '2026-09-10T08:30:00.000Z',
  reporterSuspectedCondition: 'RSSI',
  authorityClassifiedCondition: 'RSSI',
  actionTaken: 'Previous action',
  followUpOutcome: 'improved' as const,
  fieldObservation: 'Previous observation',
  fieldFinding: 'Previous finding',
  freshPhotoAvailable: true,
};

describe('PreviousVisitCard', () => {
  it('fills the previous visit rows and loads the authorized evidence photo path', async () => {
    await render(
      <PreviousVisitCard
        photoAccessToken="session-token"
        previousVisit={previousVisit}
        previousVisitPhotoUrl="http://127.0.0.1:8000/api/v1/mobile/assignments/3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f/previous-evidence-photo"
      />,
    );

    expect(screen.getByText(/Previous visit.*CG-2026-0000/)).toBeOnTheScreen();
    expect(screen.getByText('RSSI · reported concern')).toBeOnTheScreen();
    expect(screen.getByText('Previous action')).toBeOnTheScreen();
    expect(screen.getByText('Follow-up outcome')).toBeOnTheScreen();
    expect(screen.getByText('Improved')).toBeOnTheScreen();
    expect(screen.getByText('Previous observation · Previous finding')).toBeOnTheScreen();
    expect(screen.getByLabelText('Previous field evidence photo')).toHaveProp('source', {
      headers: { Authorization: 'Bearer session-token' },
      uri: 'http://127.0.0.1:8000/api/v1/mobile/assignments/3fbd7f77-7d6b-4eb0-a1c7-b673f5a2f39f/previous-evidence-photo',
    });
  });

  it('omits the outcome row when the previous visit has no outcome', async () => {
    await render(<PreviousVisitCard previousVisit={{ ...previousVisit, followUpOutcome: null }} />);

    expect(screen.queryByText('Follow-up outcome')).not.toBeOnTheScreen();
    expect(screen.queryByText('Improved')).not.toBeOnTheScreen();
  });

  it('renders the null previous visit state without evidence rows', async () => {
    await render(<PreviousVisitCard previousVisit={null} />);

    expect(screen.getByText('No previous visit recorded for this farm on this device')).toBeOnTheScreen();
    expect(screen.queryByText('Previous field evidence')).not.toBeOnTheScreen();
    expect(screen.queryByLabelText('Previous field evidence photo')).not.toBeOnTheScreen();
  });
});
