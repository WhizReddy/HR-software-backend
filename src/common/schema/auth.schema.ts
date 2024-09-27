import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import muv from 'mongoose-unique-validator';

@Schema({
  timestamps: true,
})
export class Auth {
  @Prop({ required: true, unique: true, sparse: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ default: false, type: Boolean })
  isDeleted: boolean;
  @Prop({ type: String, default: null })
  resetPasswordToken: string;

  @Prop({ type: Number, default: null })
  resetPasswordExpires: number;
}

const AuthSchema = SchemaFactory.createForClass(Auth);

AuthSchema.plugin(muv);

export { AuthSchema };
