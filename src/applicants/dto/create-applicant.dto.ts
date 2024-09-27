import {
  IsNotEmpty,
  IsDateString,
  ValidateIf,
  IsOptional,
  IsEmail,
  Matches,
} from 'class-validator';
import { DateTime } from 'luxon';

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
  @ValidateIf((obj) => {
    const now = DateTime.now();
    const dob = DateTime.fromISO(obj.dob);
    const age = now.diff(dob, 'years').years;

    return dob <= now && age >= 16;
  })
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
