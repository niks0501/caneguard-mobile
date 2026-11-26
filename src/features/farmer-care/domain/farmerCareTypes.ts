/** One-tap concerns the phone offers instead of free typing. Mirrors the API's allowed values. */
export const FARMER_CONCERNS = [
  'spreading',
  'changed_since_last',
  'new_leaves',
  'want_to_be_sure',
] as const;
export type FarmerConcern = (typeof FARMER_CONCERNS)[number];

export function isFarmerConcern(value: unknown): value is FarmerConcern {
  return typeof value === 'string' && (FARMER_CONCERNS as readonly string[]).includes(value);
}

/** The office's progress on a request, as the farmer sees it: Sent, Looking, Advice ready. */
export type FarmerInquiryRemoteStatus = 'new' | 'reviewing' | 'replied';

export interface FarmerInquiryReply {
  id: string;
  kind: 'advice' | 'note';
  body: string;
  advisoryTitle: string | null;
  createdAt: string | null;
}

/** Labels the on-device model can give, in the form the API accepts. */
export const FARMER_AI_LABELS = ['healthy', 'mosaic', 'rust', 'smut', 'uncertain'] as const;

export type FarmerInquiryStage = 'queued' | 'sent' | 'looking' | 'advice';

/**
 * Where a request is, for the 3-step tracker. A request that has not reached
 * the office yet is "queued": never an error, just waiting for signal.
 */
export function inquiryStage(input: {
  syncStatus: string;
  remoteStatus: string | null;
}): FarmerInquiryStage {
  if (input.remoteStatus === 'replied') return 'advice';
  if (input.remoteStatus === 'reviewing') return 'looking';
  if (input.syncStatus === 'synced' || input.remoteStatus === 'new') return 'sent';
  return 'queued';
}
