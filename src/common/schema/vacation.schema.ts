import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { VacationStatus, VacationType } from '../enum/vacation.enum';
import { mongooseUniqueValidator } from './unique-validator.plugin';
import { User } from './user.schema';

@Schema({
  timestamps: true,
})
export class Vacation {
  @Prop({ required: true, enum: VacationType, type: String })
  type: VacationType;

  @Prop({ required: false, type: String })
  description: string;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, type: Date })
  endDate: Date;

  @Prop({ enum: VacationStatus, default: VacationStatus.PENDING, type: String })
  status: VacationStatus;

  @Prop({
    type: Types.ObjectId,
    required: true,
    ref: User.name,
  })
  userId: Types.ObjectId;

  @Prop({ default: false, type: Boolean })
  isDeleted: boolean;
}

const VacationSchema = SchemaFactory.createForClass(Vacation);
VacationSchema.plugin(mongooseUniqueValidator);
export { VacationSchema };
