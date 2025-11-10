import cntrWrapper from '../decorators/ctrlWrapper';
import { HttpError } from '../helpers';
import Friendship from '../models/Friendship';
import User from '../models/User';
import { Request, Response } from 'express';

export const sendFriendRequest = async (req: Request, res: Response) => {
  const { id: targetId } = req.params;
  const { _id: userId, name: requesterName } = req.user;

  const targetUser = await User.findById(targetId);

  if (!targetUser) {
    throw HttpError(404, 'Target user not found');
  }

  const existing = await Friendship.findOne({
    $or: [
      { requester: userId, recipient: targetId },
      { requester: targetId, recipient: userId },
    ],
  });

  if (existing) {
    throw HttpError(
      401,
      'Friend request already exists or you are already friends',
    );
  }

  const friendship = await Friendship.create({
    requester: userId,
    recipient: targetId,
    recipientName: targetUser?.name,
    requesterName,
    status: 'pending',
  });

  res.status(201).json({
    message: 'Friend request sent',
    data: friendship,
  });
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  const { id: requesterId } = req.params;
  const userId = req.user._id;

  const friendship = await Friendship.findOneAndUpdate(
    { requester: requesterId, recipient: userId, status: 'pending' },
    { status: 'accepted' },
    { new: true },
  );

  res.json({
    message: 'Friend request accepted',
    data: friendship,
  });
};

export const rejectFriendRequest = async (req: Request, res: Response) => {
  const { id: requesterId } = req.params;
  const userId = req.user._id;

  await Friendship.findOneAndDelete({
    $or: [
      { requester: userId, recipient: requesterId },
      { requester: requesterId, recipient: userId },
    ],
    status: 'pending',
  });

  res.json({
    message: 'Friend request rejected',
  });
};

export const removeFriend = async (req: Request, res: Response) => {
  const { id: friendId } = req.params;
  const userId = req.user._id;

  await Friendship.findOneAndDelete({
    status: 'accepted',
    $or: [
      { requester: userId, recipient: friendId },
      { requester: friendId, recipient: userId },
    ],
  });

  res.json({
    message: 'Friend removed',
  });
};

export default {
  sendFriendRequest: cntrWrapper(sendFriendRequest),
  acceptFriendRequest: cntrWrapper(acceptFriendRequest),
  rejectFriendRequest: cntrWrapper(rejectFriendRequest),
  removeFriend: cntrWrapper(removeFriend),
};
