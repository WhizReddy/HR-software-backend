import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { EventType } from 'src/common/enum/event.enum';
import { Poll } from 'src/common/schema/event.schema';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  @IsEnum(EventType)
  type: string;

  @IsOptional()
  @IsArray()
  participants: string[];

  @IsOptional()
  @IsDateString()
  startDate: Date;

  @IsOptional()
  @IsDateString()
  endDate: Date;

  @IsOptional()
  @IsString()
  location: string;

  @IsOptional()
  poll: Poll;
}
