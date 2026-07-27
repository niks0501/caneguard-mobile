import {
  loginMobile,
  logoutMobile,
  verifyMobileSession,
} from '@/features/auth/api/mobileAuthApi';

const fetchMock = jest.fn();

function response(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: jest.fn(async () => JSON.stringify(body)),
  } as unknown as Response;
}

describe('mobile authentication API', () => {
  beforeEach(() => {
    global.fetch = fetchMock;
  });

  it('logs in with the locked mobile contract', async () => {
    fetchMock.mockResolvedValueOnce(
      response(200, {
        token: 'secret-token',
        token_type: 'Bearer',
        expires_at: null,
        user: {
          uuid: 'user-uuid',
          name: 'Field Reporter',
          email: 'field@caneguard.test',
          role: 'field_reporter',
        },
      }),
    );

    await expect(
      loginMobile({
        email: ' FIELD@caneguard.test ',
        password: 'entered-password',
        deviceName: 'Android test phone',
      }),
    ).resolves.toMatchObject({
      token: 'secret-token',
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
        }),
      }),
    );
  });

  it('verifies and revokes a bearer session', async () => {
    const user = {
      uuid: 'user-uuid',
      name: 'Field Reporter',
      email: 'field@caneguard.test',
      role: 'field_reporter',
    };
    fetchMock
      .mockResolvedValueOnce(response(200, user))
      .mockResolvedValueOnce(response(204, null));

    await expect(verifyMobileSession('secret-token')).resolves.toEqual(user);
    await expect(logoutMobile('secret-token')).resolves.toBeUndefined();

    for (const call of fetchMock.mock.calls) {
      const headers = call[1]?.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer secret-token');
    }
  });

  it('maps invalid credentials without exposing the server payload', async () => {
    fetchMock.mockResolvedValueOnce(
      response(401, { message: 'Sensitive server detail' }),
    );

    await expect(
      loginMobile({
        email: 'field@caneguard.test',
        password: 'wrong',
        deviceName: 'Phone',
      }),
    ).rejects.toMatchObject({
      code: 'INVALID_CREDENTIALS',
      message: 'The email or password is incorrect.',
    });
  });
});
