import {
  IsNumber,
  IsString,
  IsOptional,
  IsMongoId,
  Min,
  Max,
  IsNotEmpty,
  Length,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateSalaryDto {
  @IsNumber()
  @Min(1)
  @Max(31)
  workingDays: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  bonus?: number;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  bonusDescription?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  socialSecurity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  healthInsurance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsNumber()
  @Min(40000)
  grossSalary?: number;

  @IsNumber()
  @Min(0)
  extraHours: number;

  @IsNotEmpty()
  @IsMongoId()
  userId: Types.ObjectId;
}
