import { Schema, model, Types, Document } from 'mongoose';
import { handleSaveError } from './hooks';

export const MessageStatus = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

export interface IMessage extends Document {
  from: Types.ObjectId;
  to: Types.ObjectId;
  message: string;
  status: MessageStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    from: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    to: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' },
  },
  { versionKey: false, timestamps: true }
);

messageSchema.post("save", handleSaveError);

export default model<IMessage>('message', messageSchema);

