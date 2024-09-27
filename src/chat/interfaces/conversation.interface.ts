import { Document } from 'mongoose';

export interface Conversation extends Document {
  participants: string[];
}
