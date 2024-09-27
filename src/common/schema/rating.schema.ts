import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import muv from 'mongoose-unique-validator';

@Schema()
export class Rating extends Document {
  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Project' })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  raterId: Types.ObjectId;

  @Prop({ required: false, type: Number })
  productivityScore?: number;

  @Prop({ required: false, type: Number })
  teamCollaborationScore?: number;

  @Prop({ required: false, type: Number })
  technicalSkillLevel?: number;

  @Prop({ required: false, type: Number })
  clientFeedbackRating?: number;

  @Prop({ required: false, type: Boolean, default: false })
  isDeleted: boolean;
}

const RatingSchema = SchemaFactory.createForClass(Rating);
RatingSchema.index({ userId: 1, projectId: 1 }, { unique: true });
RatingSchema.plugin(muv);
export { RatingSchema };
