import type { ModelLabel } from '@/features/detection/constants/modelContract';

export const CHECKLIST_OBSERVATIONS = [
  {
    id: 'mosaic',
    label: 'Mosaic-like irregular discoloration or mottling',
  },
  {
    id: 'rust',
    label: 'Rust-colored or orange-brown spots or pustules',
  },
  {
    id: 'none',
    label: 'No visible symptom from Mosaic or Rust',
  },
  {
    id: 'unable-to-tell',
    label: 'Unable to tell from the image or plant',
  },
] as const;

export type ChecklistObservationId =
  (typeof CHECKLIST_OBSERVATIONS)[number]['id'];

export type ChecklistConsistency =
  | 'consistent'
  | 'inconsistent'
  | 'not-applicable'
  | 'not-enough-information';

export function getChecklistConsistency(
  predictedLabel: ModelLabel,
  selectedObservations: readonly ChecklistObservationId[],
): ChecklistConsistency {
  const observations = new Set(selectedObservations);

  if (observations.size === 0 || observations.has('unable-to-tell')) {
    return 'not-enough-information';
  }

  if (observations.size !== 1) {
    return 'not-applicable';
  }

  const [reportedObservation] = observations;
  const expectedObservation =
    predictedLabel === 'healthy' ? 'none' : predictedLabel;

  return reportedObservation === expectedObservation
    ? 'consistent'
    : 'inconsistent';
}
