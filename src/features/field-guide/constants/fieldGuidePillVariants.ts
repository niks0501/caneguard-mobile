import type { PillVariant } from '@/components/ui/Pill';
import type { FieldGuideEntryId } from '@/features/field-guide/domain/fieldGuideTypes';

export const FIELD_GUIDE_PILL_VARIANTS: Record<FieldGuideEntryId, PillVariant> = {
  healthy: 'healthy',
  mosaic: 'mosaic',
  rust: 'rust',
  smut: 'smut',
  rssi: 'warning',
};
