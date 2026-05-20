import {
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateNoteDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsNotEmpty()
  @IsBoolean()
  willBeReminded: boolean;

  @IsOptional()
  @IsDateString()
  date?: Date;
}
