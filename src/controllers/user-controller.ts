import cntrWrapper from "../decorators/ctrlWrapper";
import Friendship from "../models/Friendship";
import User from "../models/User";
import { Request, Response } from 'express'


const getUsers = async (req: Request, res: Response) => {
  const { _id: owner } = req.user;
  const { page = 1, per_page = 10 } = req.query;

  const skip = (Number(page) - 1) * Number(per_page);

  // Get paginated users (excluding yourself)
  const users = await User.find(
    { _id: { $ne: owner } },
    '_id name email avatarURL'
  )
    .skip(skip)
    .limit(Number(per_page));

  // Get all friendships where the current user is requester or recipient
  const friendships = await Friendship.find({
    $or: [{ requester: owner }, { recipient: owner }],
  });

  // Build a quick map for lookup
  const friendshipMap = new Map();
  friendships.forEach((f) => {
    const friendId =
      f.requester.toString() === owner.toString()
        ? f.recipient.toString()
        : f.requester.toString();
    friendshipMap.set(friendId, {
      status: f.status,
      isRequester: f.requester.toString() === owner.toString(),
    });
  });

  // Enrich each user with relationship info
  const enrichedUsers = users.map((user) => {
    const relation = friendshipMap.get(user._id.toString());
    let relationshipStatus = 'none';

    if (relation) {
      if (relation.status === 'accepted') relationshipStatus = 'friend';
      else if (relation.status === 'pending' && relation.isRequester)
        relationshipStatus = 'request_sent';
      else if (relation.status === 'pending' && !relation.isRequester)
        relationshipStatus = 'request_received';
    }

    return {
      ...user.toObject(),
      relationshipStatus,
    };
  });

  const total = await User.countDocuments({ _id: { $ne: owner } });

  res.json({
    data: enrichedUsers,
    meta: {
      total,
      page: Number(page),
      per_page: Number(per_page),
      totalPages: Math.ceil(total / Number(per_page)),
    },
  });
};


export default {
    getUsers: cntrWrapper(getUsers),
}