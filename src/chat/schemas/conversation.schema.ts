import { Schema } from 'mongoose';

export const ConversationSchema = new Schema(
  {
    participants: [{ type: String, required: true }],
  },
  { timestamps: true },
);
