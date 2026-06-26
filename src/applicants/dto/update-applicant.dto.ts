import {
  IsDateString,
  IsOptional,
  IsString,
  IsEnum,
  Matches,
  IsEmail,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApplicantStatus } from 'src/common/enum/applicant.enum';
import {
  APPLICANT_PHONE_REGEX,
  normalizeApplicantPhoneNumber,
} from '../utils/phone';

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

  @IsOptional()
  @IsDateString()
  dob?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeApplicantPhoneNumber(value))
  @Matches(APPLICANT_PHONE_REGEX, {
    message: 'Invalid phone number',
  })
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
