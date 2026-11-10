import { Pill } from '@/components/ui/Pill';

export type DiseasePillVariant = 'smut' | 'rust' | 'mosaic' | 'healthy' | 'unclear';

type DiseasePillProps = {
  variant: DiseasePillVariant;
  /** Replaces the default text for the variant, e.g. for a label this app version does not know. */
  label?: string;
  testID?: string;
};

/**
 * Disease name only. Callers that need the "Possible Condition" label keep it
 * on their own detail rows, because opening a card already states it.
 */
const VARIANT_MAP: Record<DiseasePillVariant, string> = {
  smut: 'Smut',
  rust: 'Rust',
  mosaic: 'Mosaic',
  healthy: 'No supported disease detected',
  unclear: 'Unclear',
};

export function DiseasePill({ label, testID, variant }: DiseasePillProps) {
  return (
    <Pill
      label={label ?? VARIANT_MAP[variant]}
      testID={testID}
      variant={variant}
    />
  );
}
