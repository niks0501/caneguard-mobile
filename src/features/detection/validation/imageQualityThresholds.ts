/**
 * Prototype-only values. Tune these against representative CaneGuard field
 * images before treating the warnings as stable product behavior. The current
 * bundled JPEG references measured mean luminance 111.6–133.7 and luminance
 * standard deviation 48.1–81.1; these warning boundaries leave clear margin
 * around that small prototype sample.
 */
export const PROTOTYPE_IMAGE_QUALITY_THRESHOLDS = {
  minimumShortSidePixels: 512,
  tooDarkMeanLuminance: 45,
  tooBrightMeanLuminance: 215,
  lowContrastLuminanceStandardDeviation: 25,
} as const;
