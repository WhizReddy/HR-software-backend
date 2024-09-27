import {
  IsArray,
  IsDateString,
  IsMongoId,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  status: string;

  @IsMongoId()
  @IsOptional()
  projectManager: Types.ObjectId;

  @IsDateString()
  @IsOptional()
  startDate: Date;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  teamMembers: Types.ObjectId[];
}
