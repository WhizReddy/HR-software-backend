import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateSalaryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(22)
  workingDays: number;

  @IsOptional()
  @IsString()
  @Min(0)
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
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

  @IsOptional()
  @IsNumber()
  @Min(40000)
  grossSalary?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extraHours: number;
}
