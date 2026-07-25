import { DetectionError } from '@/features/detection/errors/detectionError';

export type SessionStateErrorCode =
  | 'SOURCE_IMAGE_MISSING'
  | 'RESULT_MISSING';

export class SessionStateError extends DetectionError<SessionStateErrorCode> {
  constructor(code: SessionStateErrorCode, message: string) {
    super('session-state', code, message);
    this.name = 'SessionStateError';
  }
}

export function getSessionStateErrorMessage(
  error: SessionStateError,
): string {
  switch (error.code) {
    case 'SOURCE_IMAGE_MISSING':
      return 'Choose a gallery image or capture a photo before opening the preview.';
    case 'RESULT_MISSING':
      return 'Analyze a sugarcane image before opening the result screen.';
  }
}
