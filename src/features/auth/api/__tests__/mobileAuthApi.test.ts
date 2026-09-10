import {
  changeEmail,
  changePassword,
  disableBiometric,
  enrollMobileDevice,
  loginMobile,
  logoutMobile,
  registerMobile,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  verifyEmail,
  verifyMobileSession,
} from '@/features/auth/api/mobileAuthApi';

const fetchMock = jest.fn();

function response(
  status: number,
  body: unknown,
  headers = new Headers(),
): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    text: jest.fn(async () => (body === null ? '' : JSON.stringify(body))),
  } as unknown as Response;
}

function csrfResponse(): Response {
  return response(
    204,
    null,
    new Headers({ 'set-cookie': 'XSRF-TOKEN=csrf-token%3D; Path=/' }),
  );
}

const USER = {
  uuid: 'user-uuid',
  name: 'Field Reporter',
  email: 'field@caneguard.test',
  role: 'field_reporter' as const,
};

const TOKEN_RESPONSE = {
  token: 'test-session-value',
  token_type: 'Bearer',
  expires_at: null,
  user: USER,
};

describe('mobile authentication API', () => {
  beforeEach(() => {
    global.fetch = fetchMock;
    fetchMock.mockReset();
  });

  it('logs in with the locked mobile contract and an opaque device identity', async () => {
    fetchMock.mockResolvedValueOnce(response(200, TOKEN_RESPONSE));

    await expect(
      loginMobile({
        deviceId: 'installation-uuid',
        email: ' FIELD@caneguard.test ',
        password: 'entered-password',
        deviceName: 'Android test phone',
      }),
    ).resolves.toMatchObject({
      deviceId: 'installation-uuid',
      expiresAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      user: { role: 'field_reporter' },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:8000/api/v1/mobile/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'field@caneguard.test',
          password: 'entered-password',
          device_name: 'Android test phone',
          device_id: 'installation-uuid',
        }),
      }),
    );
  });

  it('rejects a token response with an explicit expired expiry', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, {
        ...TOKEN_RESPONSE,
        expires_at: '2020-01-01T00:00:00.000Z',
      }),
    );

    await expect(
      loginMobile({
        deviceId: 'installation-uuid',
        email: 'field@caneguard.test',
        password: 'entered-password',
        deviceName: 'Phone',
      }),
    ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it('verifies and revokes a bearer session', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, { user: USER }))
      .mockResolvedValueOnce(response(204, null));

    await expect(verifyMobileSession('test-session-value')).resolves.toEqual(USER);
    await expect(logoutMobile('test-session-value')).resolves.toBeUndefined();

    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://127.0.0.1:8000/api/v1/mobile/auth/me',
    );
    for (const call of fetchMock.mock.calls) {
      const headers = call[1]?.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer test-session-value');
    }
  });

  it('maps authoritative session rejection responses separately from outages', async () => {
    fetchMock.mockResolvedValueOnce(response(401, { message: 'Expired' }));
    await expect(verifyMobileSession('test-session-value')).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });

    fetchMock.mockResolvedValueOnce(response(403, { code: 'FORBIDDEN' }));
    await expect(verifyMobileSession('test-session-value')).rejects.toMatchObject({
      code: 'FORBIDDEN_ROLE',
      message: 'Only field-reporter accounts can use mobile synchronization.',
    });
  });

  it('rejects malformed user DTOs without misclassifying them as a role denial', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, { user: { role: 'field_reporter' } }),
    );

    await expect(verifyMobileSession('test-session-value')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    });
  });

  it('maps unverified login without exposing the server payload', async () => {
    fetchMock.mockResolvedValueOnce(
      response(403, {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Sensitive server detail',
      }),
    );

    await expect(
      loginMobile({
        deviceId: 'installation-uuid',
        email: 'field@caneguard.test',
        password: 'entered-password',
        deviceName: 'Phone',
      }),
    ).rejects.toMatchObject({
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Verify your email address before using Mobile.',
    });
  });

  it('explains when the mobile auth route is unavailable', async () => {
    fetchMock.mockResolvedValueOnce(
      response(404, { message: 'The requested resource was not found.' }),
    );

    await expect(
      loginMobile({
        deviceId: 'installation-uuid',
        email: 'field@caneguard.test',
        password: 'entered-password',
        deviceName: 'Phone',
      }),
    ).rejects.toMatchObject({
      code: 'SERVER_UNAVAILABLE',
      message: 'The mobile auth endpoint is unavailable on the server.',
    });
  });

  it('parses registration and sends only the approved fields', async () => {
    fetchMock
      .mockResolvedValueOnce(csrfResponse())
      .mockResolvedValueOnce(
        response(201, {
          message: 'Account created.',
          code: 'REGISTRATION_CREATED',
          user: { ...USER, email_verified: false },
        }),
      );

    await expect(
      registerMobile({
        email: ' NEW@caneguard.test ',
        name: 'New Reporter',
        password: 'long-enough-passphrase',
      }),
    ).resolves.toMatchObject({
      code: 'REGISTRATION_CREATED',
      user: { email: 'field@caneguard.test', emailVerified: false },
    });
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://127.0.0.1:8000/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'New Reporter',
          email: 'new@caneguard.test',
          password: 'long-enough-passphrase',
        }),
      }),
    );
  });

  it('keeps verification and recovery responses generic', async () => {
    fetchMock
      .mockResolvedValueOnce(csrfResponse())
      .mockResolvedValueOnce(
        response(202, {
          message: 'If the address is eligible, a verification link will be sent.',
          code: 'VERIFICATION_LINK_SENT',
        }),
      )
      .mockResolvedValueOnce(csrfResponse())
      .mockResolvedValueOnce(
        response(202, {
          message: 'If an account matches, a password recovery link will be sent.',
          code: 'PASSWORD_RESET_LINK_SENT',
        }),
      );

    await expect(resendVerification(' REPORTER@caneguard.test ')).resolves.toEqual({
      message: 'If the address is eligible, a verification link will be sent.',
      code: 'VERIFICATION_LINK_SENT',
    });
    await expect(requestPasswordReset(' REPORTER@caneguard.test ')).resolves.toEqual({
      message: 'If an account matches, a password recovery link will be sent.',
      code: 'PASSWORD_RESET_LINK_SENT',
    });

    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({ email: 'reporter@caneguard.test' }),
    );
    expect(fetchMock.mock.calls[3]?.[1]?.body).toBe(
      JSON.stringify({ email: 'reporter@caneguard.test' }),
    );
  });

  it('hands signed verification parameters to the API without persisting them', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, { message: 'Email address verified.', code: 'EMAIL_VERIFIED' }),
    );

    await expect(
      verifyEmail({
        expires: '123',
        hash: 'email-hash',
        id: 'user id',
        signature: 'signed-value',
      }),
    ).resolves.toMatchObject({ code: 'EMAIL_VERIFIED' });
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'http://127.0.0.1:8000/email/verify/user%20id/email-hash?expires=123&signature=signed-value',
    );
  });

  it('uses an authenticated password step-up request', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, { message: 'Updated.', code: 'PASSWORD_CHANGED' }),
    );

    await expect(
      changePassword('test-session-value', {
        currentPassword: 'current-password',
        password: 'new-password-value',
      }),
    ).resolves.toMatchObject({ code: 'PASSWORD_CHANGED' });

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/v1/auth/password');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(
      (fetchMock.mock.calls[0]?.[1]?.headers as Headers).get('Authorization'),
    ).toBe('Bearer test-session-value');
  });

  it('uses an authenticated email step-up request', async () => {
    fetchMock.mockResolvedValueOnce(
      response(202, {
        message: 'Verify the new email address.',
        code: 'EMAIL_VERIFICATION_REQUIRED',
      }),
    );

    await expect(
      changeEmail('test-session-value', {
        currentPassword: 'current-password',
        email: 'new@caneguard.test',
      }),
    ).resolves.toMatchObject({ code: 'EMAIL_VERIFICATION_REQUIRED' });

    expect(fetchMock.mock.calls[0]?.[0]).toContain('/api/v1/auth/email');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PATCH');
    expect(
      (fetchMock.mock.calls[0]?.[1]?.headers as Headers).get('Authorization'),
    ).toBe('Bearer test-session-value');
  });

  it('sends authenticated step-up requests and parses device enrollment rotation', async () => {
    fetchMock
      .mockResolvedValueOnce(
        response(200, { message: 'Biometric sign-in is disabled.', code: 'BIOMETRIC_DISABLED' }),
      )
      .mockResolvedValueOnce(response(200, TOKEN_RESPONSE));

    await expect(
      disableBiometric('test-session-value', 'current-password'),
    ).resolves.toMatchObject({ code: 'BIOMETRIC_DISABLED' });
    await expect(
      enrollMobileDevice('test-session-value', {
        currentPassword: 'current-password',
        deviceId: 'new-installation-uuid',
        deviceName: 'New Android',
      }),
    ).resolves.toMatchObject({
      deviceId: 'new-installation-uuid',
      expiresAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });

    expect(fetchMock.mock.calls[0]?.[1]?.headers).toEqual(expect.any(Headers));
    expect((fetchMock.mock.calls[0]?.[1]?.headers as Headers).get('Authorization')).toBe(
      'Bearer test-session-value',
    );
    expect(fetchMock.mock.calls[1]?.[1]?.body).toBe(
      JSON.stringify({
        current_password: 'current-password',
        device_name: 'New Android',
        device_id: 'new-installation-uuid',
      }),
    );
  });

  it('maps step-up and already-used reset links to stable errors', async () => {
    fetchMock.mockResolvedValueOnce(response(422, { code: 'STEP_UP_REQUIRED' }));
    await expect(
      changePassword('test-session-value', {
        currentPassword: 'wrong',
        password: 'new-password-value',
      }),
    ).rejects.toMatchObject({ code: 'STEP_UP_REQUIRED' });

    fetchMock
      .mockResolvedValueOnce(csrfResponse())
      .mockResolvedValueOnce(response(422, { code: 'INVALID_RESET_TOKEN' }));
    await expect(
      resetPassword({
        email: 'reporter@caneguard.test',
        password: 'new-password-value',
        token: 'one-time-value',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_RESET_TOKEN',
      message: 'This recovery link is invalid, expired, or already used. Request a new link.',
    });
  });
});
