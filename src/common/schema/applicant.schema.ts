import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import muv from 'mongoose-unique-validator';
import { ApplicantPhase, ApplicantStatus } from '../enum/applicant.enum';

export type ApplicantDocument = Applicant & Document;

@Schema({ timestamps: true })
export class Applicant {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ nullable: true })
  confirmationToken: string;

  @Prop({ required: true })
  experience: string;

  @Prop({ required: true })
  applicationMethod: string;

  @Prop({ type: Date, required: true })
  dob: Date;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  positionApplied: string;

  @Prop({ required: true })
  technologiesUsed: string;

  @Prop({ type: Date, default: null })
  firstInterviewDate?: Date;

  @Prop({ type: Date, default: null })
  secondInterviewDate?: Date;

  @Prop({ required: false, default: '' })
  notes: string;

  @Prop({ required: true })
  salaryExpectations: string;

  @Prop()
  cvAttachment?: string;

  @Prop({
    type: String,
    enum: ApplicantStatus,
    default: ApplicantStatus.ACTIVE,
  })
  status: ApplicantStatus;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({
    required: false,
    default: ApplicantPhase.APPLICANT,
    enum: ApplicantPhase,
  })
  currentPhase?: string;
  static firstInterviewDate: Date;
  static secondInterviewDate: Date;
  static notes: string;
}

const ApplicantSchema = SchemaFactory.createForClass(Applicant);
ApplicantSchema.plugin(muv);
export { ApplicantSchema };
