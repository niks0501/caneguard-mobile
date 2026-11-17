import type { ModelLabel } from '@/features/detection/constants/modelContract';

export type DiseaseThemeToken = {
  foreground: 'healthy' | 'mosaic' | 'rust' | 'smut' | 'info';
  background: 'healthyBg' | 'mosaicBg' | 'rustBg' | 'smutBg' | 'infoBg';
};

export type DiseaseCatalogEntry = {
  label: ModelLabel;
  displayName: string;
  shortDescription: string;
  resultMessage: string;
  decisionSupportWording: string;
  icon: 'check-circle' | 'grid' | 'sun' | 'alert-triangle' | 'eye';
  themeToken: DiseaseThemeToken;
};

export const diseaseCatalog: Record<ModelLabel, DiseaseCatalogEntry> = {
  healthy: {
    label: 'healthy',
    displayName: 'No supported disease detected',
    shortDescription:
      'The model did not assign its highest score to Mosaic, Rust, Smut, or RSSI.',
    resultMessage:
      'The model assigned its highest score to Healthy based on the submitted image.',
    decisionSupportWording:
      'Possible Condition only. The model did not assign its highest score to Mosaic, Rust, Smut, or RSSI. This output does not confirm a disease.',
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
    decisionSupportWording:
      'Possible Condition only. Mosaic may appear as irregular light and dark discoloration or mottling. This output does not confirm a disease.',
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
    decisionSupportWording:
      'Possible Condition only. Rust may appear as orange-brown or rust-colored spots or pustules. This output does not confirm a disease.',
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
      'Smut may be associated with a dark, whip-like growth emerging from the central shoot or stalk. This visible pattern is observational and does not confirm the disease.',
    resultMessage:
      'The model assigned its highest score to Smut based on the submitted image.',
    decisionSupportWording:
      'Possible Condition only. Look for a dark, whip-like growth emerging from the central shoot or stalk, but do not treat this observation or the model output as confirmation.',
    icon: 'alert-triangle',
    themeToken: {
      foreground: 'smut',
      background: 'smutBg',
    },
  },
  rssi: {
    label: 'rssi',
    displayName: 'RSSI (Red-Striped Soft Scale Insect)',
    shortDescription:
      'RSSI is a sap-sucking insect pest, not a leaf disease. It may be associated with small red-striped insects, sticky honeydew, or black sooty mold, mostly on the underside of lower leaves. This visible pattern is observational and does not confirm an infestation.',
    resultMessage:
      'The model assigned its highest score to RSSI based on the submitted image.',
    decisionSupportWording:
      'Possible Condition only. Check the underside of the lower leaves for small red-striped insects, sticky honeydew, or black sooty mold, but do not treat this observation or the model output as confirmation. Ask your agriculture officer before acting.',
    icon: 'eye',
    themeToken: {
      foreground: 'info',
      background: 'infoBg',
    },
  },
};
