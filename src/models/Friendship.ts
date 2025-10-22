import mongoose, { Schema, Document, Types } from 'mongoose';
import { handleSaveError } from './hooks';
import Joi from 'joi';

export interface IFriendship extends Document {
  requester: Types.ObjectId;
  recipient: Types.ObjectId;
  status: 'pending' | 'accepted' | 'blocked';
  createdAt: Date;
}

const friendshipSchema = new Schema<IFriendship>(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending' },
  },
  { timestamps: true }
);

friendshipSchema.post("save", handleSaveError);

export const sendFriendRequestSchema = Joi.object({
  targetId: Joi.string().required(),
});

export const acceptFriendRequestSchema = Joi.object({
  requesterId: Joi.string().required(),
});



export default mongoose.model<IFriendship>('friendship', friendshipSchema);
