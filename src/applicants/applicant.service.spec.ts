jest.mock('mongoose-unique-validator', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { ApplicantsService } from './applicant.service';
import {
  ApplicantPhase,
  ApplicantStatus,
} from 'src/common/enum/applicant.enum';

const createService = (applicants: any[]) => {
  const sort = jest.fn().mockResolvedValue(applicants);
  const find = jest.fn().mockReturnValue({ sort });
  const service = new ApplicantsService(
    { find } as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  );

  return { service, find, sort };
};

describe('ApplicantsService upcoming interviews', () => {
  it('returns only active interviews from the requested date forward', async () => {
    const from = new Date('2026-06-14T00:00:00.000Z');
    const to = new Date('2026-06-30T23:59:59.999Z');
    const { service, find } = createService([
      {
        _id: { toString: () => 'active-one' },
        firstName: 'Redi',
        lastName: 'Balla',
        email: 'redi@example.com',
        positionApplied: 'Frontend Developer',
        status: ApplicantStatus.ACTIVE,
        firstInterviewDate: new Date('2026-06-15T09:00:00.000Z'),
        secondInterviewDate: new Date('2026-06-20T10:00:00.000Z'),
      },
      {
        _id: { toString: () => 'past-active' },
        firstName: 'Past',
        lastName: 'Candidate',
        email: 'past@example.com',
        positionApplied: 'Designer',
        status: ApplicantStatus.ACTIVE,
        firstInterviewDate: new Date('2026-06-10T09:00:00.000Z'),
      },
      {
        _id: { toString: () => 'rejected-one' },
        firstName: 'Rejected',
        lastName: 'Candidate',
        email: 'rejected@example.com',
        positionApplied: 'QA',
        status: ApplicantStatus.REJECTED,
        firstInterviewDate: new Date('2026-06-16T09:00:00.000Z'),
      },
      {
        _id: { toString: () => 'employed-one' },
        firstName: 'Employed',
        lastName: 'Candidate',
        email: 'employed@example.com',
        positionApplied: 'Backend Developer',
        status: ApplicantStatus.EMPLOYED,
        firstInterviewDate: new Date('2026-06-17T09:00:00.000Z'),
      },
    ]);

    const result = await service.findUpcomingInterviews(from, to, 0, 10);

    expect(find).toHaveBeenCalledWith({
      isDeleted: false,
      status: ApplicantStatus.ACTIVE,
      $or: [
        { firstInterviewDate: { $gte: from, $lte: to } },
        { secondInterviewDate: { $gte: from, $lte: to } },
      ],
    });
    expect(result.all).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.data.map((item) => item.id)).toEqual([
      'active-one-first_interview',
      'active-one-second_interview',
    ]);
    expect(result.data.map((item) => item.phase)).toEqual([
      ApplicantPhase.FIRST_INTERVIEW,
      ApplicantPhase.SECOND_INTERVIEW,
    ]);
  });

  it('paginates flattened interview meetings without changing the item count', async () => {
    const { service } = createService([
      {
        _id: { toString: () => 'first' },
        firstName: 'First',
        lastName: 'Candidate',
        email: 'first@example.com',
        positionApplied: 'HR',
        status: ApplicantStatus.ACTIVE,
        firstInterviewDate: new Date('2026-06-15T09:00:00.000Z'),
      },
      {
        _id: { toString: () => 'second' },
        firstName: 'Second',
        lastName: 'Candidate',
        email: 'second@example.com',
        positionApplied: 'HR',
        status: ApplicantStatus.ACTIVE,
        firstInterviewDate: new Date('2026-06-16T09:00:00.000Z'),
      },
    ]);

    const result = await service.findUpcomingInterviews(
      new Date('2026-06-14T00:00:00.000Z'),
      undefined,
      1,
      1,
    );

    expect(result.all).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('second-first_interview');
  });
});

describe('ApplicantsService applicant updates', () => {
  it('allows interview notes to be cleared', async () => {
    const applicant = {
      isDeleted: false,
      notes: 'Old interview note',
      save: jest.fn().mockResolvedValue(undefined),
    };
    applicant.save.mockResolvedValue(applicant);

    const service = new ApplicantsService(
      { findById: jest.fn().mockResolvedValue(applicant) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.updateApplicant('applicant-id', { notes: '' } as any),
    ).resolves.toBe(applicant);

    expect(applicant.notes).toBe('');
    expect(applicant.save).toHaveBeenCalledTimes(1);
  });
});
