import type { ModelLabel } from '@/features/detection/constants/modelContract';

export type ReferenceMediaEntry = {
  /** Class name shown to the inspector. */
  name: string;
  /**
   * Bundled photo for this class, or `undefined` when no licence-evidenced
   * photo exists yet. The reference screen renders an equally sized
   * description-only state in that case instead of a smaller placeholder.
   */
  photo?: number;
  /** How the class looks in the field, in observational language. */
  patternDescription: string;
};

/**
 * Single source of truth for the disease-reference media. Both the Home entry
 * card and the reference screen read from here so a class can never be
 * presented with different media in two places.
 *
 * Provenance for every photo is recorded in
 * `docs/features/caneguard-uiux-enhancement-handoff/assets-to-provide/ASSET-MANIFEST.csv`.
 * Provenance never appears in the UI.
 */
export const referenceMedia: Record<ModelLabel, ReferenceMediaEntry> = {
  healthy: {
    name: 'Healthy',
    patternDescription: 'No visible symptoms',
    photo: require('../../../../assets/images/sugarcane-diseases/reference_healthy.jpg'),
  },
  mosaic: {
    name: 'Mosaic',
    patternDescription: 'Mottling or irregular discoloration',
    photo: require('../../../../assets/images/sugarcane-diseases/reference_mosaic.jpg'),
  },
  rust: {
    name: 'Rust',
    patternDescription: 'Orange-brown spots or pustules',
    photo: require('../../../../assets/images/sugarcane-diseases/reference_rust.jpg'),
  },
  smut: {
    name: 'Smut',
    patternDescription:
      'Dark, whip-like growth emerging from the central shoot or stalk',
  },
};
