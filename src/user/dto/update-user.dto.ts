import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  EngagementType,
  GradeType,
  PositionType,
} from 'src/common/enum/position.enum';
import { Role } from 'src/common/enum/role.enum';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  firstName: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  lastName: string;

  @IsOptional()
  @IsString()
  @Matches(/^6[6-9]\d{7}$/, {
    message: 'Invalid phone number',
  })
  phone: string;

  @IsOptional()
  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @Matches(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, {
    message: 'Invalid email address',
  })
  email: string;

  @IsOptional()
  @IsString()
  dob?: string;

  @IsOptional()
  @IsString()
  pob?: string;

  @IsOptional()
  @IsEnum(PositionType)
  position: PositionType;

  @IsOptional()
  @IsEnum(GradeType)
  grade: GradeType;

  @IsOptional()
  @IsEnum(EngagementType)
  engagement: EngagementType;
}
