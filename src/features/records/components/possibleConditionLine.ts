import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import type { ModelLabel } from '@/features/detection/constants/modelContract';

/** "Possible Condition: Rust" with the heading in the farmer's language. */
export function possibleConditionLine(heading: string, predictedLabel: string): string {
  const name =
    predictedLabel in diseaseCatalog
      ? diseaseCatalog[predictedLabel as ModelLabel].displayName
      : predictedLabel;
  return `${heading}: ${name}`;
}
