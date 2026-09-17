import { Pill } from '@/components/ui/Pill';

export type DiseasePillVariant = 'smut' | 'rust' | 'mosaic' | 'healthy' | 'unclear';

type DiseasePillProps = {
  variant: DiseasePillVariant;
  testID?: string;
};

const VARIANT_MAP: Record<DiseasePillVariant, string> = {
  smut: 'Possible Condition: Smut',
  rust: 'Possible Condition: Rust',
  mosaic: 'Possible Condition: Mosaic',
  healthy: 'Possible Condition: No supported disease detected',
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
