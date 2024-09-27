import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Poll } from '../../common/schema/event.schema';
import { EventType } from 'src/common/enum/event.enum';
export class CreateEventDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @IsEnum(EventType)
  type: string;

  @IsOptional()
  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate: Date;

  @IsOptional()
  poll: Poll;

  @IsOptional()
  @IsArray()
  participants: string[];

  @IsOptional()
  @IsString()
  location: string;
}
