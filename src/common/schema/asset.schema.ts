import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import muv from 'mongoose-unique-validator';
import { AssetStatus } from '../enum/asset.enum';
import { User } from './user.schema';
import { IsDate, IsEnum, IsOptional } from 'class-validator';

declare global {
  var AssetType: string[];
}
global.AssetType = ['laptop', 'monitor'];

@Schema({ _id: false })
export class AssetHistory {
  @Prop()
  @IsDate()
  updatedAt: Date;

  @Prop()
  @IsDate()
  @IsOptional()
  takenDate?: Date;

  @Prop()
  @IsDate()
  @IsOptional()
  returnDate?: Date;

  @Prop({
    type: { _id: Types.ObjectId, firstName: String, lastName: String },
    ref: 'User',
  })
  @IsOptional()
  user?: { _id: Types.ObjectId; firstName: string; lastName: string };

  @Prop({ type: String, enum: AssetStatus })
  @IsEnum(AssetStatus)
  status: AssetStatus;
}
//SKU = Stock Keeping Unit is a unique code that identifies each asset
// Get Date is the date when the asset was takenDate
// Return Date is the date when the asset was returned
@Schema({ timestamps: true })
export class Asset {
  @Prop({ required: true, type: String })
  type: string;

  @Prop({ required: true, unique: true })
  serialNumber: string;

  @Prop({ enum: AssetStatus, default: AssetStatus.AVAILABLE, type: String })
  status: AssetStatus;

  @Prop()
  takenDate: Date;

  @Prop()
  returnDate: Date;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
    default: null,
  })
  userId: Types.ObjectId;

  @Prop({ type: [AssetHistory], default: [] })
  history: AssetHistory[];

  @Prop({ default: false })
  isDeleted: boolean;
}
const AssetSchema = SchemaFactory.createForClass(Asset);
AssetSchema.plugin(muv);
export { AssetSchema };
