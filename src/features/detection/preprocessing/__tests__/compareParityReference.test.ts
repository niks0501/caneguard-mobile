import {
  compareModelOutputToParity,
  comparePreprocessingToParity,
} from '@/features/detection/preprocessing/compareParityReference';
import type { PreprocessingResult } from '@/features/detection/preprocessing/preprocessImage';

function createPreprocessingResult(): PreprocessingResult {
  return {
    processedUri: 'file:///v1-healthy.jpg',
    inputBuffer: new ArrayBuffer(602_112),
    width: 224,
    height: 224,
    channels: 3,
    dataType: 'float32',
    minValue: 0,
    maxValue: 255,
    meanValue: 127.5,
    letterbox: {
      resizedWidth: 168,
      resizedHeight: 224,
      paddingLeft: 28,
      paddingTop: 0,
    },
    qualityAssessment: {
      warnings: [],
      meanLuminance: 120,
      luminanceStandardDeviation: 40,
    },
    preprocessMs: 1,
  };
}

describe('Model V1 parity comparison', () => {
  it('compares the V1 preprocessing contract and letterbox geometry', () => {
    const comparison = comparePreprocessingToParity(createPreprocessingResult());

    expect(comparison).toMatchObject({
      modelShaMatches: true,
      shapeMatches: true,
      dataTypeMatches: true,
      elementCountMatches: true,
      byteLengthMatches: true,
      classOrderMatches: true,
      resizePolicyMatches: true,
      interpolationMatches: true,
      letterboxValueMatches: true,
      mobileNormalizationMatches: true,
      letterbox: {
        resizedWidth: 168,
        resizedHeight: 224,
        paddingLeft: 28,
        paddingTop: 0,
      },
    });
  });

  it('compares four-class model probabilities without another softmax', () => {
    const comparison = compareModelOutputToParity([
      0.9999984502792358,
      1.1242434538871748e-6,
      3.297952559933037e-7,
      7.9567350041998e-8,
    ]);

    expect(comparison).toMatchObject({
      fixtureId: 'healthy',
      modelShaMatches: true,
      classOrderMatches: true,
      outputLengthMatches: true,
      topIndexMatches: true,
      topLabelMatches: true,
    });
    expect(comparison.values).toHaveLength(4);
    expect(comparison.maxAbsoluteDelta).toBe(0);
  });
});
