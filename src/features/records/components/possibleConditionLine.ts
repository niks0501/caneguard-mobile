import { UNRECOGNIZED_LABEL_TEXT, type FarmerCopyBlock } from '@/constants/copy';
import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';

export function farmerResultName(predictedLabel: string): string {
  if (predictedLabel === 'unknown') return UNRECOGNIZED_LABEL_TEXT;
  return Object.prototype.hasOwnProperty.call(diseaseCatalog, predictedLabel)
    ? diseaseCatalog[predictedLabel as keyof typeof diseaseCatalog].displayName
    : predictedLabel;
}

/** Localizes the farmer-facing heading while retaining the catalog's English result name. */
export function possibleConditionLine(copy: FarmerCopyBlock, predictedLabel: string): string {
  return `${copy.checkAgain.possibleCondition}: ${farmerResultName(predictedLabel)}`;
}
