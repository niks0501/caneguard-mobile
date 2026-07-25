import parityReference from '../../../../../docs/model-v0/parity-reference.json';

import {
  compareModelOutputToParity,
  comparePreprocessingToParity,
} from '@/features/detection/preprocessing/compareParityReference';
import type { PreprocessingResult } from '@/features/detection/preprocessing/preprocessImage';

describe('parity-reference comparison', () => {
  it('compares preprocessing metadata, statistics, and first values', () => {
    const tensor = new Float32Array(parityReference.input.element_count);
    tensor.set(parityReference.input.first_20_values);
    const result: PreprocessingResult = {
      processedUri: 'file:///parity-processed.jpg',
      inputBuffer: tensor.buffer,
      width: 224,
      height: 224,
      channels: 3,
      dataType: 'float32',
      minValue: parityReference.input.min,
      maxValue: parityReference.input.max,
      meanValue: parityReference.input.mean,
      qualityAssessment: {
        warnings: [],
        meanLuminance: 120,
        luminanceStandardDeviation: 40,
      },
      preprocessMs: 1,
    };

    const comparison = comparePreprocessingToParity(result);

    expect(comparison).toMatchObject({
      modelShaMatches: true,
      shapeMatches: true,
      dataTypeMatches: true,
      elementCountMatches: true,
      byteLengthMatches: true,
      classOrderMatches: true,
      first20MaxAbsoluteDelta: 0,
    });
    expect(comparison.statistics.min.absoluteDelta).toBe(0);
    expect(comparison.statistics.max.absoluteDelta).toBe(0);
    expect(comparison.statistics.mean.absoluteDelta).toBe(0);
  });

  it('compares class order and raw model probabilities without another softmax', () => {
    const comparison = compareModelOutputToParity(
      parityReference.output.raw_probabilities,
    );

    expect(comparison).toMatchObject({
      modelShaMatches: true,
      classOrderMatches: true,
      outputLengthMatches: true,
      maxAbsoluteDelta: 0,
      topIndexMatches: true,
      topLabelMatches: true,
    });
    expect(comparison.values).toHaveLength(3);
  });
});
