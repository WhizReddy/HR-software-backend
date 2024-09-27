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

export class UpdateAssetDto {
  @IsOptional()
  @IsString()
  type: string;

  @IsString()
  @IsOptional()
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
