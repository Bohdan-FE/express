import { Request, Response } from 'express';
import Friendship from '../models/Friendship';
import cntrWrapper from '../decorators/ctrlWrapper';

export const getFriends = async (req: Request, res: Response) => {
    const { _id: userId } = req.user;
    const { page = 1, per_page = 10 } = req.query as { page?: string; per_page?: string };

    const skip = (Number(page) - 1) * Number(per_page);

    const friendships = await Friendship.find({
      status: 'accepted',
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate('requester recipient', '_id name email avatarURL')
      .skip(skip)
      .limit(Number(per_page));

    const total = await Friendship.countDocuments({
      status: 'accepted',
      $or: [{ requester: userId }, { recipient: userId }],
    });

    const friends = friendships.map((f) =>
      f.requester._id.toString() === userId.toString()
        ? f.recipient
        : f.requester
    );

    res.json({
      data: friends,
      meta: {
        total,
        page: Number(page),
        per_page: Number(per_page),
        totalPages: Math.ceil(total / Number(per_page)),
      },
    });
};


export const sendFriendRequest = async (req: Request, res: Response) => {
  const { id: targetId } = req.params;
  const userId = req.user._id;

  const existing = await Friendship.findOne({
    $or: [
      { requester: userId, recipient: targetId },
      { requester: targetId, recipient: userId },
    ],
  });

  const friendship = await Friendship.create({
    requester: userId,
    recipient: targetId,
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
    { new: true }
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
    requester: requesterId,
    recipient: userId,
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
    getFriends: cntrWrapper(getFriends),
    sendFriendRequest: cntrWrapper(sendFriendRequest),
    acceptFriendRequest: cntrWrapper(acceptFriendRequest),
    rejectFriendRequest: cntrWrapper(rejectFriendRequest),
    removeFriend: cntrWrapper(removeFriend),
}