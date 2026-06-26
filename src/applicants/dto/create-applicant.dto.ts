import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEmail,
  Matches,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DateTime } from 'luxon';
import {
  APPLICANT_PHONE_REGEX,
  normalizeApplicantPhoneNumber,
} from '../utils/phone';

@ValidatorConstraint({ name: 'isValidDob', async: false })
class IsValidDobConstraint implements ValidatorConstraintInterface {
  validate(value: string) {
    if (!value) return false;
    const dob = DateTime.fromISO(value);
    if (!dob.isValid) return false;
    const now = DateTime.now();
    const age = now.diff(dob, 'years').years;
    return dob < now && age >= 16;
  }

  defaultMessage() {
    return 'Date of birth must be a past date and applicant must be at least 16 years old';
  }
}

export class CreateApplicantDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsNotEmpty()
  experience: string;

  @IsNotEmpty()
  applicationMethod: string;

  @IsNotEmpty()
  @IsDateString()
  @Validate(IsValidDobConstraint)
  dob: string;

  @IsNotEmpty()
  @Transform(({ value }) => normalizeApplicantPhoneNumber(value))
  @Matches(APPLICANT_PHONE_REGEX, {
    message: 'Invalid phone number',
  })
  phoneNumber: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  positionApplied: string;

  @IsNotEmpty()
  technologiesUsed: string;

  @IsNotEmpty()
  salaryExpectations: string;

  @IsOptional()
  currentPhase?: string;
}
