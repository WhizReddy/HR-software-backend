jest.mock('mongoose-unique-validator', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { ApplicantsController } from './applicants/applicant.controller';
import { AssetController } from './asset/asset.controller';
import { SalaryController } from './salary/salary.controller';
import { UserController } from './user/user.controller';

describe('table filter query params', () => {
  it('passes employee role filters to the user service', async () => {
    const findAll = jest.fn().mockResolvedValue([]);
    const controller = new UserController({ findAll } as any);

    await controller.findAll(0, 5, 'redi', 'hr');

    expect(findAll).toHaveBeenCalledWith(0, 5, 'redi', 'hr');
  });

  it('passes candidate status filters to the applicant service', async () => {
    const findAll = jest.fn().mockResolvedValue({ data: [] });
    const controller = new ApplicantsController({ findAll } as any);

    await controller.findAll(
      0,
      5,
      undefined,
      undefined,
      undefined,
      'frontend',
      'active',
    );

    expect(findAll).toHaveBeenCalledWith(
      0,
      5,
      undefined,
      undefined,
      undefined,
      'frontend',
      'active',
    );
  });

  it('passes upcoming interview filters to the applicant service', async () => {
    const findUpcomingInterviews = jest.fn().mockResolvedValue({ data: [] });
    const controller = new ApplicantsController({
      findUpcomingInterviews,
    } as any);
    const from = new Date('2026-06-14T00:00:00.000Z');
    const to = new Date('2026-07-14T00:00:00.000Z');

    await controller.findUpcomingInterviews(from, to, 0, 100);

    expect(findUpcomingInterviews).toHaveBeenCalledWith(from, to, 0, 100);
  });

  it('keeps fullName and supports search for payroll filters', () => {
    const findAll = jest.fn();
    const controller = new SalaryController({ findAll } as any);

    controller.find(
      0,
      5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'redi',
    );

    expect(findAll).toHaveBeenCalledWith(
      0,
      5,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      'redi',
    );
  });

  it('passes inventory status and type filters while preserving availability', () => {
    const findAll = jest.fn();
    const controller = new AssetController({ findAll } as any);

    controller.findAll('available', 'assigned', 'laptop', 'macbook', 0, 5);

    expect(findAll).toHaveBeenCalledWith(
      0,
      5,
      'available',
      'macbook',
      'assigned',
      'laptop',
    );
  });
});
