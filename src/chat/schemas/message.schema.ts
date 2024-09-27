import { Schema } from 'mongoose';

export const MessageSchema = new Schema(
  {
    conversationId: { type: String, required: true },
    text: { type: String, required: true },
    senderId: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);
