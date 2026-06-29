import { NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

const hashResetToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

describe('AuthService resetPassword', () => {
  const now = 1710000000000;
  const token = 'plain-reset-token';
  const newPassword = 'NewPass123!';
  const hashedToken = hashResetToken(token);
  let authModel: { findOne: jest.Mock };
  let service: AuthService;
  let dateSpy: jest.SpyInstance;
  let genSaltSpy: jest.SpyInstance;
  let hashSpy: jest.SpyInstance;

  const createAuthRecord = (overrides: Record<string, unknown> = {}) => ({
    password: 'old-password',
    resetPasswordToken: hashedToken,
    resetPasswordExpires: now + 60_000,
    save: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  });

  beforeEach(() => {
    authModel = {
      findOne: jest.fn(),
    };

    service = new AuthService(
      {} as any,
      authModel as any,
      {} as any,
      {} as any,
    );

    dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now);
    genSaltSpy = jest
      .spyOn(bcrypt, 'genSalt')
      .mockResolvedValue('salt' as never);
    hashSpy = jest
      .spyOn(bcrypt, 'hash')
      .mockResolvedValue('hashed-password' as never);
  });

  afterEach(() => {
    dateSpy.mockRestore();
    genSaltSpy.mockRestore();
    hashSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('resets the password when the stored reset token is hashed', async () => {
    const authRecord = createAuthRecord();
    authModel.findOne.mockResolvedValue(authRecord);

    await expect(service.resetPassword({ token, newPassword })).resolves.toBe(
      'Password reset successfully',
    );

    expect(authModel.findOne).toHaveBeenCalledWith({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: now },
    });
    expect(authModel.findOne).not.toHaveBeenCalledWith(
      expect.objectContaining({ resetPasswordToken: token }),
    );
    expect(authRecord.password).toBe('hashed-password');
    expect(authRecord.save).toHaveBeenCalledTimes(1);
  });

  it('rejects a reset token stored in raw/plain form', async () => {
    const rawStoredRecord = createAuthRecord({
      resetPasswordToken: token,
    });

    authModel.findOne.mockImplementation((query) =>
      query.resetPasswordToken === rawStoredRecord.resetPasswordToken &&
      rawStoredRecord.resetPasswordExpires > query.resetPasswordExpires.$gt
        ? Promise.resolve(rawStoredRecord)
        : Promise.resolve(null),
    );

    await expect(service.resetPassword({ token, newPassword })).rejects.toThrow(
      NotFoundException,
    );

    expect(rawStoredRecord.save).not.toHaveBeenCalled();
  });

  it('rejects an expired reset token', async () => {
    const expiredRecord = createAuthRecord({
      resetPasswordExpires: now - 1,
    });

    authModel.findOne.mockImplementation((query) =>
      query.resetPasswordToken === expiredRecord.resetPasswordToken &&
      expiredRecord.resetPasswordExpires > query.resetPasswordExpires.$gt
        ? Promise.resolve(expiredRecord)
        : Promise.resolve(null),
    );

    await expect(service.resetPassword({ token, newPassword })).rejects.toThrow(
      NotFoundException,
    );

    expect(expiredRecord.save).not.toHaveBeenCalled();
  });

  it('clears reset token fields after a successful password reset', async () => {
    const authRecord = createAuthRecord();
    authModel.findOne.mockResolvedValue(authRecord);

    await service.resetPassword({ token, newPassword });

    expect(authRecord.resetPasswordToken).toBeNull();
    expect(authRecord.resetPasswordExpires).toBeNull();
    expect(authRecord.save).toHaveBeenCalledTimes(1);
  });
});
