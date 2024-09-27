import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsMongoId,
  IsDateString,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsMongoId()
  @IsNotEmpty()
  projectManager: Types.ObjectId;

  @IsDateString()
  @IsOptional()
  startDate: Date;

  @IsArray()
  @IsMongoId({ each: true })
  @IsNotEmpty()
  teamMembers: Types.ObjectId[];
}
