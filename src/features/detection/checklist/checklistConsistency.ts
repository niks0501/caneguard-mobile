import {
  MODEL_LABELS,
  type ModelLabel,
} from '@/features/detection/constants/modelContract';

const MOSAIC_OBSERVATION = {
  id: 'mosaic',
  label: 'Contrasting islands or streaks of normal green among paler green or yellowish leaf areas',
} as const;

const RUST_OBSERVATION = {
  id: 'rust',
  label: 'Raised rust-colored or orange-brown spots or pustules, mainly on the leaf underside',
} as const;

const YELLOW_MIDRIB_OBSERVATION = {
  id: 'yellow-midrib',
  label: 'Bright yellow midrib on lower or older leaves, or yellowing spreading outward from the midrib',
} as const;

const NO_SUPPORTED_PATTERN_OBSERVATION = {
  id: 'none',
  label: 'No visible symptom from Mosaic or Rust',
} as const;

const SOMETHING_ELSE_OBSERVATION = {
  id: 'something-else',
  label: 'Something else',
} as const;

const UNABLE_TO_TELL_OBSERVATION = {
  id: 'unable-to-tell',
  label: 'Unable to tell',
} as const;

/**
 * Guided options are visible patterns, not disease diagnoses.
 * The wording is derived from these peer-reviewed or university-extension
 * references approved for this ticket:
 * - UF/IFAS EDIS SC009, Sugarcane Mosaic, DOI 10.32473/edis-sc009-2015.
 * - UF/IFAS EDIS PI207, Florida Crop/Pest Profile: Sugarcane,
 *   https://edis.ifas.ufl.edu/publication/PI207.
 * - UF/IFAS EDIS SC099, Sugarcane Orange Rust, DOI 10.32473/edis-sc099-2014.
 * - APS Plant Health Progress sugarcane disease profile,
 *   DOI 10.1094/PHP-02-24-0013-DG.
 * - UF/IFAS EDIS SS-AGR-256, Sugarcane Yellow Leaf Disease.
 * These sources guide neutral pattern descriptions only. A field observation
 * is not diagnostic proof and must remain separate from model evidence.
 */
export const CHECKLIST_OBSERVATIONS = [
  MOSAIC_OBSERVATION,
  RUST_OBSERVATION,
  YELLOW_MIDRIB_OBSERVATION,
  NO_SUPPORTED_PATTERN_OBSERVATION,
  SOMETHING_ELSE_OBSERVATION,
  UNABLE_TO_TELL_OBSERVATION,
] as const;

export type ChecklistObservation = (typeof CHECKLIST_OBSERVATIONS)[number];

export type ChecklistObservationId = ChecklistObservation['id'];

export const GUIDED_VALIDATION_QUESTIONS = [
  {
    id: 'visible-pattern',
    prompt: 'What visible pattern, if any, best describes the area you are checking?',
    helperText:
      'Choose the closest description. This is your observation and does not change the AI result.',
    relevantModelLabels: MODEL_LABELS,
    options: [
      MOSAIC_OBSERVATION,
      RUST_OBSERVATION,
      YELLOW_MIDRIB_OBSERVATION,
      NO_SUPPORTED_PATTERN_OBSERVATION,
      SOMETHING_ELSE_OBSERVATION,
      UNABLE_TO_TELL_OBSERVATION,
    ],
  },
] as const;

export type GuidedValidationQuestion =
  (typeof GUIDED_VALIDATION_QUESTIONS)[number];

export const GUIDED_VALIDATION_MAX_QUESTIONS = 4;

export function getGuidedValidationQuestions(
  modelLabel: ModelLabel,
): readonly GuidedValidationQuestion[] {
  return GUIDED_VALIDATION_QUESTIONS.filter((question) =>
    question.relevantModelLabels.includes(modelLabel),
  ).slice(0, GUIDED_VALIDATION_MAX_QUESTIONS);
}

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

  // The yellow-midrib reference and "Something else" are observations outside
  // the supported model classes. They are visible as disagreement, but never
  // change model output.
  if (observations.has('yellow-midrib') || observations.has('something-else')) {
    return 'inconsistent';
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
