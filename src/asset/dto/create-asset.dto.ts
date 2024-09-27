import {
  IsString,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
  IsAlphanumeric,
  IsMongoId,
} from 'class-validator';
import { AssetStatus } from '../../common/enum/asset.enum';
import { Types } from 'mongoose';

export class CreateAssetDto {
  @IsString()
  type: string;

  @IsString()
  @MinLength(8)
  @MaxLength(12)
  @IsAlphanumeric()
  serialNumber: string;

  @IsEnum(AssetStatus)
  @IsOptional()
  status: AssetStatus;

  @IsOptional()
  takenDate?: Date;

  @IsOptional()
  returnDate?: Date;

  @IsMongoId()
  @IsOptional()
  userId?: Types.ObjectId;
}
