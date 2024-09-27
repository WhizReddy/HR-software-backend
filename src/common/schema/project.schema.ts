import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import muv from 'mongoose-unique-validator';
import { User } from './user.schema';
import { ProjectStatus } from '../enum/project.enum';

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, type: String })
  name: string;

  @Prop({ required: true, type: String })
  description: string;

  @Prop({ required: true, type: Date })
  startDate: Date;

  @Prop({ required: true, enum: ProjectStatus, type: String })
  status: ProjectStatus;

  @Prop({ type: Types.ObjectId, required: true, ref: User.name })
  projectManager: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], required: true, ref: User.name })
  teamMembers: Types.ObjectId[];

  @Prop({ required: false, type: Boolean, default: false })
  isDeleted: boolean;
}

const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.plugin(muv);
export { ProjectSchema };
