import {
  IsNotEmpty,
  IsMongoId,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateRatingDto {
  @IsNotEmpty()
  @IsMongoId()
  projectId: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  userId: Types.ObjectId;

  @IsNotEmpty()
  @IsMongoId()
  raterId: Types.ObjectId;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  productivityScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  teamCollaborationScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  technicalSkillLevel?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  clientFeedbackRating?: number;
}
