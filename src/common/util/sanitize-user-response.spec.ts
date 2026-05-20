import { sanitizeUserResponse } from './sanitize-user-response';

describe('sanitizeUserResponse', () => {
  it('removes sensitive auth fields from populated user objects', () => {
    const user = {
      _id: 'user-id',
      firstName: 'Jane',
      lastName: 'Doe',
      auth: {
        email: 'jane@example.com',
        password: 'hashed-password',
        resetPasswordToken: 'token',
        resetPasswordExpires: 123,
      },
      toObject() {
        return { ...this };
      },
    };

    const sanitized = sanitizeUserResponse(user, 'jane@example.com');

    expect(sanitized.password).toBeUndefined();
    expect(sanitized.resetPasswordToken).toBeUndefined();
    expect(sanitized.resetPasswordExpires).toBeUndefined();
    expect(sanitized.auth).toEqual({ email: 'jane@example.com' });
    expect(sanitized.email).toBe('jane@example.com');
  });
});
