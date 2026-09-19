import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DiseasePill } from '@/components/ui/DiseasePill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Row } from '@/components/ui/Row';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Status } from '@/components/ui/Status';
import { TextField } from '@/components/ui/TextField';

describe('Consolidated UI components', () => {
  describe('Card', () => {
    it('renders children with flat variant by default', async () => {
      await render(
        <Card testID="test-card">
          <Text>Card Content</Text>
        </Card>,
      );
      expect(screen.getByTestId('test-card')).toBeOnTheScreen();
      expect(screen.getByText('Card Content')).toBeOnTheScreen();
    });

    it('handles interactive onPress when provided', async () => {
      const onPress = jest.fn();
      await render(
        <Card testID="interactive-card" onPress={onPress}>
          <Text>Clickable Card</Text>
        </Card>,
      );
      await fireEvent.press(screen.getByTestId('interactive-card'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('SectionHeading', () => {
    it('renders sentence-case title and optional eyebrow', async () => {
      await render(
        <SectionHeading
          title="Section title"
          eyebrow="Eyebrow text"
          testID="section-heading"
        />,
      );
      expect(screen.getByText('Section title')).toBeOnTheScreen();
      expect(screen.getByText('Eyebrow text')).toBeOnTheScreen();
    });
  });

  describe('Row', () => {
    it('renders label and value with divider option', async () => {
      await render(
        <Row
          label="Farm location"
          value="Batangas"
          valueTestID="row-value"
          withDivider
        />,
      );
      expect(screen.getByText('Farm location')).toBeOnTheScreen();
      expect(screen.getByTestId('row-value')).toHaveTextContent('Batangas');
    });

    it('renders custom ReactNode values', async () => {
      await render(
        <Row
          label="Status"
          value={<View testID="custom-badge"><Text>Active</Text></View>}
        />,
      );
      expect(screen.getByText('Status')).toBeOnTheScreen();
      expect(screen.getByTestId('custom-badge')).toBeOnTheScreen();
    });
  });

  describe('TextField hints', () => {
    it('shows a persistent hint and announces it with the input', async () => {
      await render(
        <TextField
          hint="What you physically saw on this visit."
          label="Fresh field observation"
          onChangeText={() => undefined}
          testID="observational-input"
          value=""
        />,
      );

      expect(screen.getByText('What you physically saw on this visit.')).toBeOnTheScreen();
      expect(screen.getByTestId('observational-input')).toHaveProp(
        'accessibilityHint',
        'What you physically saw on this visit.',
      );
    });

    it('omits the hint element when no hint is supplied', async () => {
      await render(
        <TextField
          label="Fresh field observation"
          onChangeText={() => undefined}
          testID="observational-input"
          value=""
        />,
      );

      expect(
        screen.getByTestId('observational-input').props.accessibilityHint,
      ).toBeUndefined();
    });
  });

  describe('Pill & DiseasePill', () => {
    it('renders Pill with variant styling and label', async () => {
      await render(<Pill label="Healthy" variant="healthy" testID="healthy-pill" />);
      expect(screen.getByTestId('healthy-pill')).toBeOnTheScreen();
      expect(screen.getByText('Healthy')).toBeOnTheScreen();
    });

    it('renders DiseasePill for all supported variants', async () => {
      const { rerender } = await render(<DiseasePill variant="mosaic" testID="disease-pill" />);
      expect(screen.getByText('Possible Condition: Mosaic')).toBeOnTheScreen();

      await rerender(<DiseasePill variant="rust" testID="disease-pill" />);
      expect(screen.getByText('Possible Condition: Rust')).toBeOnTheScreen();
    });
  });

  describe('Status', () => {
    it('renders status badge with appropriate semantic token mapping', async () => {
      await render(<Status label="Synced with office" status="synced" testID="status-badge" />);
      expect(screen.getByTestId('status-badge')).toBeOnTheScreen();
      expect(screen.getByText('Synced with office')).toBeOnTheScreen();
    });
  });

  describe('EmptyState', () => {
    it('renders empty icon, title, message, and action', async () => {
      const onAction = jest.fn();
      await render(
        <EmptyState
          icon="activity"
          title="No activity yet"
          message="Complete a scan to see activity here."
          action={{ label: 'Start scan', onPress: onAction }}
          testID="empty-state"
        />,
      );
      expect(screen.getByTestId('empty-state')).toBeOnTheScreen();
      expect(screen.getByText('No activity yet')).toBeOnTheScreen();
      expect(screen.getByText('Complete a scan to see activity here.')).toBeOnTheScreen();

      await fireEvent.press(screen.getByText('Start scan'));
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('ConfirmDialog', () => {
    it('renders nothing when visible is false', async () => {
      await render(
        <ConfirmDialog
          visible={false}
          title="Delete record?"
          message="Cannot be undone."
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />,
      );
      expect(screen.queryByTestId('confirm-dialog')).not.toBeOnTheScreen();
    });

    it('renders confirmation card and handles actions when visible', async () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      await render(
        <ConfirmDialog
          visible={true}
          title="Delete record?"
          message="This action cannot be undone."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          destructive
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
      );

      expect(screen.getByTestId('confirm-dialog')).toBeOnTheScreen();
      expect(screen.getByText('Delete record?')).toBeOnTheScreen();
      expect(screen.getByText('This action cannot be undone.')).toBeOnTheScreen();

      await fireEvent.press(screen.getByTestId('confirm-dialog.cancel'));
      expect(onCancel).toHaveBeenCalledTimes(1);

      await fireEvent.press(screen.getByTestId('confirm-dialog.confirm'));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });
});
