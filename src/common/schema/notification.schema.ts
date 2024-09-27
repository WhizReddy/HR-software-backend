import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import muv from 'mongoose-unique-validator';
import { NotificationType } from '../enum/notification.enum';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: String })
  title: string;

  @Prop({ required: true, type: String })
  content: string;

  @Prop({ required: true, enum: NotificationType, type: String })
  type: NotificationType;

  @Prop({ required: true })
  typeId: Types.ObjectId;

  @Prop({ required: true, type: Date })
  date: Date;

  @Prop({ default: false, type: Boolean })
  isRead: boolean;

  @Prop({ default: false, type: Boolean })
  isDeleted: boolean;

  @Prop({ type: [Types.ObjectId] })
  readers: Types.ObjectId[];
}

const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.plugin(muv);
export { NotificationSchema };
