import { Document } from 'mongoose';

export interface Message extends Document {
  conversationId: string;
  text: string;
  senderId: string;
  createdAt: Date;
}
