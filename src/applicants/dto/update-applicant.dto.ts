import {
  IsNotEmpty,
  IsDateString,
  ValidateIf,
  IsOptional,
  IsString,
  IsEnum,
  Matches,
  IsEmail,
} from 'class-validator';
import { DateTime } from 'luxon';
import { ApplicantStatus } from 'src/common/enum/applicant.enum';

export class UpdateApplicantDto {
  @IsOptional()
  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  experience: string;

  @IsOptional()
  @IsString()
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

  @IsOptional()
  @IsString()
  @Matches(/^6[6-9]\d{7}$/, { message: 'Invalid phone number' })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  positionApplied: string;

  @IsOptional()
  @IsString()
  technologiesUsed: string;

  @IsOptional()
  @IsDateString()
  firstInterviewDate?: Date;

  @IsOptional()
  @IsDateString()
  secondInterviewDate?: Date;

  @IsOptional()
  @IsString()
  notes: string;

  @IsOptional()
  @IsString()
  salaryExpectations: string;

  @IsOptional()
  @IsString()
  cvAttachment?: string;

  @IsOptional()
  @IsEnum(ApplicantStatus)
  status?: ApplicantStatus;

  @IsOptional()
  @IsString()
  currentPhase?: string;

  @IsOptional()
  @IsString()
  customSubject?: string;

  @IsOptional()
  @IsString()
  customMessage?: string;
}
