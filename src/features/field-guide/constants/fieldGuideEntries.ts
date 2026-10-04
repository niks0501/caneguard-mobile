import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import {
  MODEL_LABELS,
  type ModelLabel,
} from '@/features/detection/constants/modelContract';
import { referenceMedia } from '@/features/detection/constants/referenceMedia';

import {
  FIELD_GUIDE_LAUNCH_ENTRY_IDS,
  type FieldGuideCategory,
  type FieldGuideEntry,
  type FieldGuideEntryId,
  type FieldGuideImage,
  type FieldGuideLaunchEntryId,
} from '../domain/fieldGuideTypes';
import { fieldGuideEntryContent } from './fieldGuideEntryContent';

/**
 * The gallery's own content module.
 *
 * It exists because the gallery holds one entry the model can never produce a
 * label for: RSSI is a pest and a reporter-observed concern
 * (`REPORTER_OBSERVED_CONCERN_RSSI`), never a `MODEL_LABELS` member. Adding it
 * to `diseaseCatalog` would break the catalog-completeness guard, so the four
 * model-linked entries are *projected* from `referenceMedia` (name and bundled
 * reference photo) and `diseaseCatalog` (the app's own observational wording)
 * instead of being duplicated, and the pest entry lives in its own data block
 * below. Every entry's `images` is that reference photo (where the class ships
 * one) followed by the captain's dropped field photos from
 * `assets/images/field-guide/`.
 */
export const FIELD_GUIDE_PEST_ENTRY_ID = 'rssi';

/** Provenance key for a bundled photo; matches `MANIFEST.csv`'s `local_filename`. */
function bundledImage(
  label: ModelLabel,
  caption: string,
  subject: FieldGuideImage['subject'],
): readonly FieldGuideImage[] {
  const photo = referenceMedia[label].photo;
  if (!photo) {
    return [];
  }
  return [{ source: photo, caption, subject, assetKey: `reference_${label}.jpg` }];
}

/**
 * The captain's dropped field photos, wired in by an explicit `require` per
 * file: `assets/images/field-guide/` is a drop folder, not a scan, so a file
 * that is not required here never reaches a build. `assetKey` is that file's
 * `local_filename` in `MANIFEST.csv`, and the caption is the label the entry
 * page shows under the photo. Order is reading order.
 */
const FIELD_GUIDE_DROP_PHOTOS: Record<FieldGuideLaunchEntryId, readonly FieldGuideImage[]> = {
  healthy: [
    {
      source: require('../../../../assets/images/field-guide/healthy/01-healthy.jpg'),
      caption: 'Clean, evenly green leaf blades on a healthy stool',
      subject: 'leaf',
      assetKey: 'healthy/01-healthy.jpg',
    },
  ],
  mosaic: [
    {
      source: require('../../../../assets/images/field-guide/mosaic/01-mosaic.jpg'),
      caption: 'Paler green streaking along an otherwise green leaf blade',
      subject: 'leaf',
      assetKey: 'mosaic/01-mosaic.jpg',
    },
  ],
  rust: [
    {
      source: require('../../../../assets/images/field-guide/rust/01-rust.jpg'),
      caption: 'Orange-brown rust pustules scattered over the leaf blade',
      subject: 'leaf',
      assetKey: 'rust/01-rust.jpg',
    },
  ],
  smut: [
    {
      source: require('../../../../assets/images/field-guide/smut/01-smut.jpg'),
      caption: 'A single long whip rising above the cane canopy',
      subject: 'shoot',
      assetKey: 'smut/01-smut.jpg',
    },
    {
      source: require('../../../../assets/images/field-guide/smut/02-smut.jpg'),
      caption: 'Several whips curling over a smut-affected block',
      subject: 'shoot',
      assetKey: 'smut/02-smut.jpg',
    },
  ],
  rssi: [
    {
      source: require('../../../../assets/images/field-guide/rssi/01-rssi.jpg'),
      caption: 'Red-striped scale insects clustered along the leaf blade',
      subject: 'insect',
      assetKey: 'rssi/01-rssi.jpg',
    },
    {
      source: require('../../../../assets/images/field-guide/rssi/02-rssi.jpg'),
      caption: 'A heavy colony of wax-covered scale insects on a leaf',
      subject: 'insect',
      assetKey: 'rssi/02-rssi.jpg',
    },
  ],
};

const BUNDLED_PHOTO_DESCRIPTIONS: Record<
  Exclude<ModelLabel, 'smut'>,
  { caption: string; subject: FieldGuideImage['subject'] }
> = {
  healthy: {
    caption: 'A healthy sugarcane stool with evenly green leaves',
    subject: 'whole-plant',
  },
  mosaic: {
    caption: 'Leaf mottling with contrasting light and dark green areas',
    subject: 'leaf',
  },
  rust: {
    caption: 'Orange-brown rust pustules on the leaf underside',
    subject: 'leaf-underside',
  },
};

function projectModelEntry(label: ModelLabel): FieldGuideEntry {
  const content = fieldGuideEntryContent[label];
  const photoDescription = label === 'smut' ? undefined : BUNDLED_PHOTO_DESCRIPTIONS[label];

  return {
    id: label,
    category: label === 'healthy' ? 'healthy' : 'disease',
    displayName: referenceMedia[label].name,
    shortName: referenceMedia[label].name,
    modelLabel: label,
    summary: content.summary,
    signs: content.signs,
    whereToLook: content.whereToLook,
    impact: content.impact,
    management: content.management,
    detail: content.detail,
    images: [
      ...(photoDescription
        ? bundledImage(label, photoDescription.caption, photoDescription.subject)
        : []),
      ...FIELD_GUIDE_DROP_PHOTOS[label],
    ],
    detectableByApp: true,
    contentVersion: content.contentVersion,
    updatedAt: content.updatedAt,
  };
}

function projectPestEntry(): FieldGuideEntry {
  const content = fieldGuideEntryContent[FIELD_GUIDE_PEST_ENTRY_ID];

  return {
    id: FIELD_GUIDE_PEST_ENTRY_ID,
    category: 'pest',
    displayName: 'Red-Striped Soft Scale Insect',
    shortName: content.shortName,
    // The model has four classes and RSSI is not one of them.
    modelLabel: null,
    summary: content.summary,
    signs: content.signs,
    whereToLook: content.whereToLook,
    impact: content.impact,
    management: content.management,
    detail: content.detail,
    images: FIELD_GUIDE_DROP_PHOTOS[FIELD_GUIDE_PEST_ENTRY_ID],
    // The app can only record RSSI as something the reporter says they saw.
    detectableByApp: false,
    contentVersion: content.contentVersion,
    updatedAt: content.updatedAt,
  };
}

/**
 * The bundled seed: one entry per model label, plus the pest, ordered as
 * `FIELD_GUIDE_LAUNCH_ENTRY_IDS` so a missing or extra entry is visible.
 */
export const fieldGuideEntries: readonly FieldGuideEntry[] = FIELD_GUIDE_LAUNCH_ENTRY_IDS.map(
  (id) => (id === FIELD_GUIDE_PEST_ENTRY_ID ? projectPestEntry() : projectModelEntry(id)),
);

const entriesById = new Map<FieldGuideEntryId, FieldGuideEntry>(
  fieldGuideEntries.map((entry) => [entry.id, entry]),
);

/** `null` for an unknown id, so the detail screen can render an honest empty state. */
export function findFieldGuideEntry(id: FieldGuideEntryId | undefined): FieldGuideEntry | null {
  if (!id) {
    return null;
  }
  return entriesById.get(id) ?? null;
}

/** Entries of one category, in launch-set order. */
export function fieldGuideEntriesForCategory(
  category: FieldGuideCategory,
): readonly FieldGuideEntry[] {
  return fieldGuideEntries.filter((entry) => entry.category === category);
}

/** The four entries the model can produce, for the catalog/gallery drift test. */
export function modelLinkedFieldGuideEntries(): readonly FieldGuideEntry[] {
  return fieldGuideEntries.filter(
    (entry) => entry.modelLabel !== null && MODEL_LABELS.includes(entry.modelLabel),
  );
}

/**
 * The app's existing observational wording for a class, kept behind this
 * module so screens never reach into `diseaseCatalog` themselves.
 */
export function catalogObservationalWording(label: ModelLabel): string {
  return diseaseCatalog[label].shortDescription;
}
