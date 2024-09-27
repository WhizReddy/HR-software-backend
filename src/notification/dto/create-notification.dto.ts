import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsDate,
  IsMongoId,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { NotificationType } from '../../common/enum/notification.enum';
import { Types } from 'mongoose';

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsDate()
  date: Date;

  @IsOptional()
  @IsBoolean()
  isRead: boolean;

  @IsNotEmpty()
  @IsMongoId()
  typeId: Types.ObjectId;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  readers: Types.ObjectId[];
}
