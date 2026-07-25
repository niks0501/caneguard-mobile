import {
  getSessionStateErrorMessage,
  SessionStateError,
} from '@/features/detection/context/sessionErrors';

describe('SessionStateError', () => {
  it('identifies a recoverable missing-result session failure', () => {
    const error = new SessionStateError(
      'RESULT_MISSING',
      'A completed result is required.',
    );

    expect(error).toMatchObject({
      name: 'SessionStateError',
      stage: 'session-state',
      code: 'RESULT_MISSING',
    });
    expect(getSessionStateErrorMessage(error)).toBe(
      'Analyze a sugarcane image before opening the result screen.',
    );
  });
});
