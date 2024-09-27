import { Optional } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';
import { GradeType, PositionType } from 'src/common/enum/position.enum';

export class UpdatePromotionDto {
  @Optional()
  @IsNotEmpty()
  position: PositionType;

  @Optional()
  @IsNotEmpty()
  startDate: Date;

  @Optional()
  @IsNotEmpty()
  grade: GradeType;
}
