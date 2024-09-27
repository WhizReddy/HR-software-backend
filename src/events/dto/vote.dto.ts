import { IsString } from 'class-validator';
import { Types } from 'mongoose';

export class VoteDto {
  @IsString()
  option: string;

  @IsString()
  userId: Types.ObjectId;
}
