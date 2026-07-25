import { PROTOTYPE_IMAGE_QUALITY_THRESHOLDS } from '@/features/detection/validation/imageQualityThresholds';

export type QualityWarning =
  | 'low-resolution'
  | 'too-dark'
  | 'too-bright'
  | 'low-contrast';

export interface ImageQualityAssessment {
  warnings: QualityWarning[];
  meanLuminance: number;
  luminanceStandardDeviation: number;
}

export interface ImageQualitySourceDimensions {
  width: number | null;
  height: number | null;
}

const QUALITY_WARNING_MESSAGES: Record<QualityWarning, string> = {
  'low-resolution':
    'The image resolution is low. Move closer and keep the affected area in focus.',
  'too-dark':
    'The image may be too dark. Retake the photo in better lighting for a more reliable input.',
  'too-bright':
    'The image may be too bright. Avoid glare and direct overexposure when retaking it.',
  'low-contrast':
    'The image has low contrast. Use even lighting and keep the affected area clearly visible.',
};

export function getQualityWarningMessage(warning: QualityWarning): string {
  return QUALITY_WARNING_MESSAGES[warning];
}

export function assessImageQuality(
  rgbPixels: Uint8Array,
  sourceDimensions: ImageQualitySourceDimensions,
): ImageQualityAssessment {
  const pixelCount = rgbPixels.length / 3;
  let luminanceSum = 0;
  let luminanceSquaredSum = 0;

  for (let index = 0; index < rgbPixels.length; index += 3) {
    const luminance =
      0.2126 * rgbPixels[index] +
      0.7152 * rgbPixels[index + 1] +
      0.0722 * rgbPixels[index + 2];
    luminanceSum += luminance;
    luminanceSquaredSum += luminance * luminance;
  }

  const meanLuminance = pixelCount > 0 ? luminanceSum / pixelCount : 0;
  const variance =
    pixelCount > 0
      ? Math.max(0, luminanceSquaredSum / pixelCount - meanLuminance ** 2)
      : 0;
  const luminanceStandardDeviation = Math.sqrt(variance);
  const warnings: QualityWarning[] = [];
  const { width, height } = sourceDimensions;

  if (
    width !== null &&
    height !== null &&
    Math.min(width, height) <
      PROTOTYPE_IMAGE_QUALITY_THRESHOLDS.minimumShortSidePixels
  ) {
    warnings.push('low-resolution');
  }

  if (
    meanLuminance <
    PROTOTYPE_IMAGE_QUALITY_THRESHOLDS.tooDarkMeanLuminance
  ) {
    warnings.push('too-dark');
  } else if (
    meanLuminance >
    PROTOTYPE_IMAGE_QUALITY_THRESHOLDS.tooBrightMeanLuminance
  ) {
    warnings.push('too-bright');
  }

  if (
    luminanceStandardDeviation <
    PROTOTYPE_IMAGE_QUALITY_THRESHOLDS.lowContrastLuminanceStandardDeviation
  ) {
    warnings.push('low-contrast');
  }

  return {
    warnings,
    meanLuminance,
    luminanceStandardDeviation,
  };
}
