import {
  IsString,
  IsDateString,
  IsOptional,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  })
  @IsArray()
  participants: string[];

  @IsOptional()
  @IsString()
  location: string;
}
