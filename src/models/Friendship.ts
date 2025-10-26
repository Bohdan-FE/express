import mongoose, { Schema, Document, Types } from 'mongoose';
import { handleSaveError } from './hooks';

export interface IFriendship extends Document {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  requesterName: string;
  recipientName: string;
  lastMessageAt: Date | null;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'user', required: true },
    requesterName: { type: String, required: true },
    recipientName: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true, versionKey: false }
);

// 🔒 Prevent duplicate friend relationships
friendshipSchema.index(
  { requester: 1, recipient: 1 },
  { unique: true }
);

// ⚡ For fast queries in getUsers()
friendshipSchema.index({ requester: 1 });
friendshipSchema.index({ recipient: 1 });

friendshipSchema.post("save", handleSaveError);


export default mongoose.model<IFriendship>('friendship', friendshipSchema);
