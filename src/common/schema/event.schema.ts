import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { EventType } from '../enum/event.enum';
import { mongooseUniqueValidator } from './unique-validator.plugin';

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({
    required: false,
    type: String,
    enum: EventType,
    default: EventType.OTHER,
  })
  type: EventType;

  @Prop({ required: false, type: Date })
  startDate: Date;

  @Prop({ required: false, type: Date })
  endDate: Date;

  @Prop({ required: false, type: String })
  location: string;

  @Prop({ type: [Types.ObjectId], required: false, default: [] })
  participants: Types.ObjectId[] | string[];

  @Prop({ type: [String], required: false })
  photo?: [string];

  @Prop({ default: false })
  isDeleted: boolean;
}

const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.plugin(mongooseUniqueValidator);
export { EventSchema };
