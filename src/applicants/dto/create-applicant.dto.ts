import {
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEmail,
  Matches,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
} from 'class-validator';
import { DateTime } from 'luxon';

@ValidatorConstraint({ name: 'isValidDob', async: false })
class IsValidDobConstraint implements ValidatorConstraintInterface {
  validate(value: string, _args: ValidationArguments) {
    if (!value) return false;
    const dob = DateTime.fromISO(value);
    if (!dob.isValid) return false;
    const now = DateTime.now();
    const age = now.diff(dob, 'years').years;
    return dob < now && age >= 16;
  }

  defaultMessage(_args: ValidationArguments) {
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
  @Matches(/^6[6-9]\d{7}$/, { message: 'Invalid phone number' })
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
