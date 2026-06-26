import { plainToInstance } from 'class-transformer';
import { ValidationPipe } from '@nestjs/common';
import { validate } from 'class-validator';
import { CreateApplicantDto } from './create-applicant.dto';
import { UpdateApplicantDto } from './update-applicant.dto';

const createApplicantPayload = (phoneNumber: string) => ({
  firstName: 'Redi',
  lastName: 'Balla',
  experience: '1-2 years',
  applicationMethod: 'Career page',
  dob: '2000-01-01',
  phoneNumber,
  email: 'redi@example.com',
  positionApplied: 'Frontend Developer',
  technologiesUsed: JSON.stringify(['React']),
  salaryExpectations: '1000 EUR',
});

const phoneErrors = async (phoneNumber: string) => {
  const dto = plainToInstance(
    CreateApplicantDto,
    createApplicantPayload(phoneNumber),
  );
  const errors = await validate(dto);

  return {
    dto,
    errors: errors.filter((error) => error.property === 'phoneNumber'),
  };
};

describe('Applicant phone DTO validation', () => {
  it.each([
    ['691234567', '691234567'],
    ['069 123 4567', '691234567'],
    ['04 234 5678', '42345678'],
    ['+355 69 123 4567', '+355691234567'],
    ['00355 69 123 4567', '+355691234567'],
    ['355 69 123 4567', '+355691234567'],
    ['+44 7911 123456', '+447911123456'],
  ])('accepts and normalizes %s', async (input, expected) => {
    const { dto, errors } = await phoneErrors(input);

    expect(errors).toHaveLength(0);
    expect(dto.phoneNumber).toBe(expected);
  });

  it.each(['12345', '0000000', '+0123456789', 'phone-number'])(
    'rejects invalid phone number %s',
    async (input) => {
      const { errors } = await phoneErrors(input);

      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('matches');
    },
  );

  it('normalizes phone updates with the same rule', async () => {
    const dto = plainToInstance(UpdateApplicantDto, {
      phoneNumber: '00355 69 123 4567',
    });
    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.phoneNumber).toBe('+355691234567');
  });

  it('normalizes multipart-style body values through the Nest validation pipe', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const result = await pipe.transform(
      createApplicantPayload('00355 69 123 4567'),
      {
        type: 'body',
        metatype: CreateApplicantDto,
      },
    );

    expect(result).toBeInstanceOf(CreateApplicantDto);
    expect((result as CreateApplicantDto).phoneNumber).toBe('+355691234567');
  });
});
