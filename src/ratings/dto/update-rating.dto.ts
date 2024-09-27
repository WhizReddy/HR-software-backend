import { Optional } from '@nestjs/common';
import { IsNumber } from 'class-validator';

export class UpdateRatingDto {
  @Optional()
  @IsNumber()
  productivityScore: number;

  @Optional()
  @IsNumber()
  teamCollaborationScore: number;

  @Optional()
  @IsNumber()
  technicalSkillLevel: number;

  @Optional()
  @IsNumber()
  clientFeedbackRating: number;
}
