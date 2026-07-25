export type DetectionErrorStage =
  | 'image-acquisition'
  | 'image-manipulation'
  | 'image-decoding'
  | 'tensor-creation'
  | 'model-loading'
  | 'inference-execution'
  | 'output-interpretation'
  | 'session-state';

export class DetectionError<
  Code extends string = string,
> extends Error {
  readonly stage: DetectionErrorStage;
  readonly code: Code;
  readonly originalCause?: unknown;

  constructor(
    stage: DetectionErrorStage,
    code: Code,
    message: string,
    originalCause?: unknown,
  ) {
    super(message);
    this.name = 'DetectionError';
    this.stage = stage;
    this.code = code;
    this.originalCause = originalCause;
  }
}
