import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import muv from 'mongoose-unique-validator';
import { EventType } from '../enum/event.enum';

export class PollOption {
  @Prop({ required: true, type: String })
  option: string;

  @Prop({ default: 0, type: Number })
  votes: number;

  @Prop({
    type: [{ _id: Types.ObjectId, firstName: String, lastName: String }],
    default: [],
  })
  voters: { _id: Types.ObjectId; firstName: string; lastName: string }[];
}

export class Poll {
  @Prop({ required: true })
  question: string;

  @Prop({ type: [PollOption], default: [] })
  options: PollOption[];
}

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

  @Prop({ type: Poll, required: false })
  poll?: Poll;

  @Prop({ default: false })
  isDeleted: boolean;
}

const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.plugin(muv);
export { EventSchema };
