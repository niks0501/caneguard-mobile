import { fireEvent, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import FieldGuideGuideScreen from '@/app/field-guide/[entryId]/guide';
import {
  FIELD_GUIDE_CREDIT_MISSING,
  FIELD_GUIDE_EDUCATION_DISCLAIMER,
  FIELD_GUIDE_GUIDE_SOURCES_TITLE,
  FIELD_GUIDE_NOT_FOUND_TITLE,
  FIELD_GUIDE_PENDING_VALIDATION_NOTICE,
  FIELD_GUIDE_SOURCE_AWAITING_SUPPLY,
} from '@/constants/copy';
import { findFieldGuideEntry } from '@/features/field-guide/constants/fieldGuideEntries';
import { findFieldGuideSource } from '@/features/field-guide/constants/fieldGuideSources';
import { FIELD_GUIDE_LAUNCH_ENTRY_IDS } from '@/features/field-guide/domain/fieldGuideTypes';

const mockReplace = jest.mocked(router.replace);
const mockUseLocalSearchParams = jest.mocked(useLocalSearchParams);

function showEntry(entryId: string) {
  mockUseLocalSearchParams.mockReturnValue({ entryId });
}

describe('FieldGuideGuideScreen', () => {
  it.each(FIELD_GUIDE_LAUNCH_ENTRY_IDS)(
    'renders the complete offline guide for the %s entry',
    async (id) => {
      showEntry(id);
      await render(<FieldGuideGuideScreen />);

      const entry = findFieldGuideEntry(id);
      expect(entry).not.toBeNull();
      expect(screen.getByTestId('field-guide.guide.screen')).toBeOnTheScreen();
      expect(screen.getByTestId('field-guide.guide.disclaimer')).toHaveTextContent(
        FIELD_GUIDE_EDUCATION_DISCLAIMER,
      );
      expect(screen.getByTestId('field-guide.guide.pending-validation')).toHaveTextContent(
        FIELD_GUIDE_PENDING_VALIDATION_NOTICE,
      );
      expect(screen.getByTestId('field-guide.guide.intro')).toHaveTextContent(
        entry?.guide.intro ?? '',
      );

      for (const section of entry?.guide.sections ?? []) {
        const node = screen.getByTestId(`field-guide.guide.${id}.section.${section.id}`);
        expect(node).toBeOnTheScreen();
        for (const paragraph of section.paragraphs) {
          expect(screen.getByText(paragraph)).toBeOnTheScreen();
        }
      }

      // Every chapter is rendered, in the authored order.
      expect(
        screen
          .getAllByTestId(/^field-guide\.guide\.[a-z0-9-]+\.section\.[a-z0-9-]+$/)
          .map((node) => node.props.testID),
      ).toEqual(
        (entry?.guide.sections ?? []).map(
          (section) => `field-guide.guide.${id}.section.${section.id}`,
        ),
      );

      expect(entry?.guide.sections.length ?? 0).toBeGreaterThanOrEqual(4);
      expect(screen.getByTestId(`field-guide.guide.${id}.sources`)).toBeOnTheScreen();
    },
  );

  it('shows bundled sources and photo credits with no internet', async () => {
    showEntry('rssi');
    await render(<FieldGuideGuideScreen />);

    await fireEvent.press(screen.getByLabelText('Show Sources and photo credits'));

    expect(screen.getByText(FIELD_GUIDE_GUIDE_SOURCES_TITLE)).toBeOnTheScreen();
    // The 2025 and 2026 brochures are cited but marked as not supplied.
    expect(
      screen.getAllByText(FIELD_GUIDE_SOURCE_AWAITING_SUPPLY).length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(FIELD_GUIDE_CREDIT_MISSING)).toHaveLength(2);
  });

  it('lists each cited source once on the page, not once per chapter', async () => {
    showEntry('rssi');
    await render(<FieldGuideGuideScreen />);

    await fireEvent.press(screen.getByLabelText('Show Sources and photo credits'));

    const entry = findFieldGuideEntry('rssi');
    const citedTitles = (entry?.sourceIds ?? []).map(
      (id) => findFieldGuideSource(id)?.title ?? id,
    );

    expect(citedTitles.length).toBeGreaterThan(1);
    for (const title of citedTitles) {
      expect(screen.getAllByText(title)).toHaveLength(1);
    }
  });

  it('marks a not-yet-supplied document instead of linking a dead page', async () => {
    showEntry('smut');
    await render(<FieldGuideGuideScreen />);

    await fireEvent.press(screen.getByLabelText('Show Sources and photo credits'));

    expect(screen.getAllByText(FIELD_GUIDE_SOURCE_AWAITING_SUPPLY).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/pages 21-22/).length).toBeGreaterThan(0);
  });

  it('renders an honest not-found state for an unknown id', async () => {
    showEntry('not-a-real-entry');
    await render(<FieldGuideGuideScreen />);

    expect(screen.getByTestId('field-guide.guide.not-found')).toBeOnTheScreen();
    expect(screen.getByText(FIELD_GUIDE_NOT_FOUND_TITLE)).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('field-guide.guide.not-found.action'));
    expect(mockReplace).toHaveBeenCalledWith('/field-guide');
  });
});
