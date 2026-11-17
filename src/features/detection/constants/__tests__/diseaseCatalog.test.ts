import { diseaseCatalog } from '@/features/detection/constants/diseaseCatalog';
import { MODEL_V2_LABELS } from '@/features/detection/constants/modelContract';

describe('diseaseCatalog', () => {
  it('defines one complete metadata entry for every Model V2 label, RSSI included', () => {
    expect(Object.keys(diseaseCatalog)).toEqual(MODEL_V2_LABELS);

    for (const label of MODEL_V2_LABELS) {
      expect(diseaseCatalog[label]).toEqual(
        expect.objectContaining({
          label,
          displayName: expect.any(String),
          shortDescription: expect.any(String),
          resultMessage: expect.any(String),
          decisionSupportWording: expect.any(String),
          icon: expect.any(String),
          themeToken: {
            foreground: expect.any(String),
            background: expect.any(String),
          },
        }),
      );
    }
  });

  it('uses observational, non-diagnostic wording for Smut', () => {
    expect(diseaseCatalog.smut.shortDescription).toMatch(/whip-like/i);
    expect(diseaseCatalog.smut.decisionSupportWording).toMatch(/does not|not.*confirmation/i);
  });

  it('describes RSSI as an observational insect-pest pattern, never a disease or confirmation', () => {
    expect(diseaseCatalog.rssi.displayName).toMatch(/Red-Striped Soft Scale Insect/);
    expect(diseaseCatalog.rssi.shortDescription).toMatch(/not a leaf disease/i);
    expect(diseaseCatalog.rssi.shortDescription).toMatch(/does not confirm/i);
    expect(diseaseCatalog.rssi.decisionSupportWording).toMatch(/^Possible Condition only\./);
    expect(diseaseCatalog.rssi.decisionSupportWording).toMatch(/do not treat/i);
  });

  it('uses non-disease wording for the healthy result', () => {
    expect(diseaseCatalog.healthy.displayName).toBe(
      'No supported disease detected',
    );
  });
});
