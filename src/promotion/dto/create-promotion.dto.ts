import { IsNotEmpty, IsEnum, IsDateString, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';
import { PositionType, GradeType } from '../../common/enum/position.enum';

export class CreatePromotionDto {
  @IsNotEmpty()
  @IsMongoId()
  userId: Types.ObjectId;

  @IsNotEmpty()
  @IsDateString()
  startDate: Date;

  @IsNotEmpty()
  @IsEnum(PositionType)
  position: PositionType;

  @IsNotEmpty()
  @IsEnum(GradeType)
  grade: GradeType;
}
