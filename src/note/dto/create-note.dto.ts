import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateNoteDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsString()
  userId: Types.ObjectId;

  @IsNotEmpty()
  @IsBoolean()
  willBeReminded: boolean;

  @IsOptional()
  @IsDateString()
  date: Date;
}
