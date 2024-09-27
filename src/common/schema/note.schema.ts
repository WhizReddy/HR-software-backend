import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import muv from 'mongoose-unique-validator';
import { User } from './user.schema';

@Schema({ timestamps: true })
export class Note extends Document {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: false, type: Date })
  date: Date;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: User.name,
  })
  userId: Types.ObjectId;

  @Prop({ default: false, type: Boolean })
  willBeReminded: boolean;

  @Prop({ default: false, type: Boolean })
  isDeleted: boolean;
}

const NoteSchema = SchemaFactory.createForClass(Note);
NoteSchema.plugin(muv);
export { NoteSchema };
