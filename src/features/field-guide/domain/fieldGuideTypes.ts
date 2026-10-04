import type { ModelLabel } from '@/features/detection/constants/modelContract';

/** What kind of thing an entry describes. A pest is never a model label. */
export type FieldGuideCategory = 'healthy' | 'disease' | 'pest';

/** Stable, URL-safe identifier, never reused. Examples: 'rust', 'rssi'. */
export type FieldGuideEntryId = string;

/** The launch set, in reading order. Asserted by the gallery tests. */
export const FIELD_GUIDE_LAUNCH_ENTRY_IDS = [
  'healthy',
  'mosaic',
  'rust',
  'smut',
  'rssi',
] as const;

export type FieldGuideLaunchEntryId = (typeof FIELD_GUIDE_LAUNCH_ENTRY_IDS)[number];

export const FIELD_GUIDE_CATEGORY_ORDER = ['healthy', 'disease', 'pest'] as const;

export type FieldGuideImage = {
  /** Bundled asset (require(...)) in the seed, or a downloaded local file URI after a refresh. */
  source: number | string;
  /** One line describing what the photo shows; used as the accessible label. */
  caption: string;
  /** Which part of the plant is in frame. */
  subject: 'leaf' | 'leaf-underside' | 'stalk' | 'shoot' | 'whole-plant' | 'insect';
  /** Provenance key into MANIFEST.csv; NEVER rendered in the UI. */
  assetKey: string;
};

export type FieldGuideEntry = {
  id: FieldGuideEntryId;
  category: FieldGuideCategory;
  /** Reader-facing name, for example "Rust" or "Red-Striped Soft Scale Insect". */
  displayName: string;
  /** Short name for compact surfaces such as the index card pill. */
  shortName: string;
  /** The model label this entry corresponds to, when one exists. Null for RSSI. */
  modelLabel: ModelLabel | null;
  /** One line for the index card. */
  summary: string;
  /** 3-6 short observable signs, in plain language. */
  signs: readonly string[];
  whereToLook: string;
  impact: string;
  /** Non-chemical actions first. No dosage, no brand name. */
  management: readonly string[];
  /** Long free text; clamped to 3 lines with "Show more". */
  detail: string;
  images: readonly FieldGuideImage[];
  /** True only when the AI model can produce this as a possible condition. */
  detectableByApp: boolean;
  /** Content revision, for the "last updated" line and for cache invalidation. */
  contentVersion: string;
  /** Null for the bundled seed; ISO date once refreshed from the office. */
  updatedAt: string | null;
};
