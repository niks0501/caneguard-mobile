import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import { MODEL_LABELS } from '@/features/detection/constants/modelContract';

describe('diseaseCatalog', () => {
  it('defines one complete metadata entry for every Model v0 label', () => {
    expect(Object.keys(diseaseCatalog)).toEqual(MODEL_LABELS);

    for (const label of MODEL_LABELS) {
      expect(diseaseCatalog[label]).toEqual(
        expect.objectContaining({
          label,
          displayName: expect.any(String),
          shortDescription: expect.any(String),
          resultMessage: expect.any(String),
          icon: expect.any(String),
          themeToken: {
            foreground: expect.any(String),
            background: expect.any(String),
          },
        }),
      );
    }
  });

  it('uses non-disease wording for the healthy result', () => {
    expect(diseaseCatalog.healthy.displayName).toBe(
      'No supported disease detected',
    );
  });
});
