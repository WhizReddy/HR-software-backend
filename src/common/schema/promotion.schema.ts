import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import muv from 'mongoose-unique-validator';
import { PositionType, GradeType } from '../enum/position.enum';
import { User } from './user.schema';

@Schema()
export class Promotion {
  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: User.name,
  })
  userId: Types.ObjectId;

  @Prop({ required: false, enum: PositionType, type: String })
  position: PositionType;

  @Prop({ required: false, type: Date })
  startDate: Date;

  @Prop({ required: false, enum: GradeType, type: String })
  grade: GradeType;

  @Prop({ required: false, type: Boolean, default: false })
  isDeleted: boolean;
}

const PromotionSchema = SchemaFactory.createForClass(Promotion);
PromotionSchema.plugin(muv);
export { PromotionSchema };
