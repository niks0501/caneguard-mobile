import type { ModelLabel } from '@/features/detection/constants/modelContract';

export type DiseaseThemeToken = {
  foreground: 'healthy' | 'mosaic' | 'rust' | 'smut';
  background: 'healthyBg' | 'mosaicBg' | 'rustBg' | 'smutBg';
};

export type DiseaseCatalogEntry = {
  label: ModelLabel;
  displayName: string;
  shortDescription: string;
  resultMessage: string;
  icon: 'check-circle' | 'grid' | 'sun' | 'alert-triangle';
  themeToken: DiseaseThemeToken;
};

export const diseaseCatalog: Record<ModelLabel, DiseaseCatalogEntry> = {
  healthy: {
    label: 'healthy',
    displayName: 'No supported disease detected',
    shortDescription:
      'The model did not assign its highest score to Mosaic or Rust.',
    resultMessage:
      'The model assigned its highest score to Healthy based on the submitted image.',
    icon: 'check-circle',
    themeToken: {
      foreground: 'healthy',
      background: 'healthyBg',
    },
  },
  mosaic: {
    label: 'mosaic',
    displayName: 'Mosaic',
    shortDescription:
      'Mosaic can appear as irregular light and dark discoloration or mottling on the leaf.',
    resultMessage:
      'The model assigned its highest score to Mosaic based on the submitted image.',
    icon: 'grid',
    themeToken: {
      foreground: 'mosaic',
      background: 'mosaicBg',
    },
  },
  rust: {
    label: 'rust',
    displayName: 'Rust',
    shortDescription:
      'Rust can appear as orange-brown or rust-colored spots and pustules on the leaf.',
    resultMessage:
      'The model assigned its highest score to Rust based on the submitted image.',
    icon: 'sun',
    themeToken: {
      foreground: 'rust',
      background: 'rustBg',
    },
  },
  smut: {
    label: 'smut',
    displayName: 'Smut',
    shortDescription:
      'The model assigned its highest score to Smut based on the submitted image.',
    resultMessage:
      'The model assigned its highest score to Smut based on the submitted image.',
    icon: 'alert-triangle',
    themeToken: {
      foreground: 'smut',
      background: 'smutBg',
    },
  },
};
