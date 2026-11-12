import { UNRECOGNIZED_LABEL_TEXT } from '@/constants/copy';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';

export function canonicalResultName(predictedLabel: string): string {
  if (predictedLabel === 'unknown') return UNRECOGNIZED_LABEL_TEXT;
  return Object.prototype.hasOwnProperty.call(diseaseCatalog, predictedLabel)
    ? diseaseCatalog[predictedLabel as keyof typeof diseaseCatalog].displayName
    : predictedLabel;
}
