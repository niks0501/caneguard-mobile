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

/** One published or expected document behind an entry's wording. */
export type FieldGuideSource = {
  id: FieldGuideSourceId;
  title: string;
  publisher: string;
  /** Null for a document the office has not supplied yet. */
  url: string | null;
  /** Exact page or passage used, when the document is paginated. */
  passage: string | null;
  /** What this source is used for on the entry. */
  supports: string;
  /** `awaiting-supply` renders an honest "not supplied yet" row, never a dead link. */
  availability: 'published' | 'awaiting-supply';
  publishedDate: string | null;
};

export type FieldGuideSourceId = string;

/**
 * Provenance for one bundled photo. A blank placeholder is not approval: the
 * record stays `recorded: false` until creator, licence and source page are
 * all taken from evidence, and the UI says so rather than inventing a credit.
 */
export type FieldGuideImageCredit = {
  creator: string | null;
  licenseName: string | null;
  sourcePageUrl: string | null;
  attribution: string | null;
  recorded: boolean;
};

export type FieldGuideImage = {
  /** Bundled asset (require(...)) in the seed, or a downloaded local file URI after a refresh. */
  source: number | string;
  /** One line describing what the photo shows; used as the accessible label. */
  caption: string;
  /** Which part of the plant is in frame. */
  subject: 'leaf' | 'leaf-underside' | 'stalk' | 'shoot' | 'whole-plant' | 'insect';
  /** Provenance key into MANIFEST.csv; NEVER rendered in the UI. */
  assetKey: string;
  /** Visible credit data; rendered only in the read-only credits disclosure. */
  credit: FieldGuideImageCredit;
};

/** One long-form chapter of the offline full guide. */
export type FieldGuideGuideSection = {
  /** Stable, URL-safe id used for testIDs and future deep links. */
  id: string;
  heading: string;
  paragraphs: readonly string[];
};

/** The long-form reading page bundled with every entry. */
export type FieldGuideGuide = {
  intro: string;
  sections: readonly FieldGuideGuideSection[];
};

/**
 * Editorial status for one entry. While it is `pending-expert-review` the app
 * shows a reader-visible marker beside the education disclaimer on the gallery
 * index, the entry screen, the full guide and the photo viewer; the same record
 * keeps the structured validation note and review date.
 */
export type FieldGuideEditorial = {
  validationStatus: 'pending-expert-review' | 'expert-reviewed';
  validationNote: string;
  reviewedAt: string | null;
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
  /** Reader-facing kind, for example "Viral disease" or "Insect pest". */
  conditionLabel: string;
  /** Cautious scientific name, or null when no name is confirmed for this app. */
  scientificName: string | null;
  /** Actions that keep the problem out of the field. No dosage, no brand name. */
  prevention: readonly string[];
  /** Non-chemical actions first. No dosage, no brand name. */
  management: readonly string[];
  /** Long free text; clamped to 3 lines with "Show more". */
  detail: string;
  /** The offline long-form guide behind "Read the full guide". */
  guide: FieldGuideGuide;
  /** Sources cited by this entry, in display order. */
  sourceIds: readonly FieldGuideSourceId[];
  /** Structured validation status, also rendered as the pending-review marker. */
  editorial: FieldGuideEditorial;
  images: readonly FieldGuideImage[];
  /** True only when the AI model can produce this as a possible condition. */
  detectableByApp: boolean;
  /** Content revision, for the "last updated" line and for cache invalidation. */
  contentVersion: string;
  /** Null for the bundled seed; ISO date once refreshed from the office. */
  updatedAt: string | null;
};
