import type { FarmerCopyBlock, FarmerResultName } from '@/constants/copy';

/** The result name in the farmer's language; an unlisted label shows as it was saved. */
export function farmerResultName(copy: FarmerCopyBlock, predictedLabel: string): string {
  return predictedLabel in copy.results
    ? copy.results[predictedLabel as FarmerResultName]
    : predictedLabel;
}

/** "Possible Condition: Rust" with the heading and name in the farmer's language. */
export function possibleConditionLine(copy: FarmerCopyBlock, predictedLabel: string): string {
  return `${copy.checkAgain.possibleCondition}: ${farmerResultName(copy, predictedLabel)}`;
}
