import type { FarmerCopyBlock } from '@/constants/copy';
import { canonicalResultName } from '@/features/records/domain/canonicalResultName';

/** Localizes the farmer-facing heading while retaining the catalog's English result name. */
export function possibleConditionLine(copy: FarmerCopyBlock, predictedLabel: string): string {
  return `${copy.checkAgain.possibleCondition}: ${canonicalResultName(predictedLabel)}`;
}
