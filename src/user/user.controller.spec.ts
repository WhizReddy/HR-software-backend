import { ForbiddenException } from '@nestjs/common';
import { Role } from '../common/enum/role.enum';
import { ROLES_KEY } from '../common/decorator/roles.decorator';
import { User } from '../common/schema/user.schema';
import { UserController } from './user.controller';
import { UserService } from './user.service';

jest.mock('mongoose-unique-validator', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('UserController authorization', () => {
  const user = {
    _id: 'user-1',
    firstName: 'Redi',
    lastName: 'Balla',
    role: Role.DEV,
  } as unknown as User;

  let controller: UserController;
  let userService: jest.Mocked<Pick<UserService, 'findOne'>>;

  beforeEach(() => {
    userService = {
      findOne: jest.fn().mockResolvedValue(user),
    };

    controller = new UserController(userService as unknown as UserService);
  });

  it('keeps user list endpoints limited to HR and Admin', () => {
    expect(Reflect.getMetadata(ROLES_KEY, controller.findAll)).toEqual([
      Role.HR,
      Role.ADMIN,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.searchUser)).toEqual([
      Role.HR,
      Role.ADMIN,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller.findRemoteUsers)).toEqual([
      Role.HR,
      Role.ADMIN,
    ]);
  });

  it('allows a user to read their own profile', async () => {
    await expect(
      controller.findOne('user-1', {
        user: { sub: 'user-1', role: Role.DEV },
      } as any),
    ).resolves.toBe(user);
  });

  it("blocks a normal user from reading another user's profile", async () => {
    await expect(
      controller.findOne('user-2', {
        user: { sub: 'user-1', role: Role.DEV },
      } as any),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows HR to read another user's profile", async () => {
    await expect(
      controller.findOne('user-2', {
        user: { sub: 'user-1', role: Role.HR },
      } as any),
    ).resolves.toBe(user);
  });
});
