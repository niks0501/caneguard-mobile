import { Pill } from '@/components/ui/Pill';

export type DiseasePillVariant = 'smut' | 'rust' | 'mosaic' | 'healthy' | 'unclear';

type DiseasePillProps = {
  variant: DiseasePillVariant;
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

export function DiseasePill({ testID, variant }: DiseasePillProps) {
  return (
    <Pill
      label={VARIANT_MAP[variant]}
      testID={testID}
      variant={variant}
    />
  );
}
