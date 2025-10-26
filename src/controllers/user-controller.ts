import cntrWrapper from "../decorators/ctrlWrapper";
import Friendship from "../models/Friendship";
import User from "../models/User";
import { Request, Response } from 'express'


const getUsers = async (req: Request, res: Response) => {
  const { _id: owner } = req.user;
  const {
    page = "1",
    per_page = "10",
    filter = "all",
    search = "",
  } = req.query as {
    page?: string;
    per_page?: string;
    filter?: "all" | "friends" | "non-friends" | "request_sent" | "request_received";
    search?: string;
  };

  const skip = (Number(page) - 1) * Number(per_page);
  const limit = Number(per_page);


  // --- 1️⃣ FRIENDS FILTER ---
  if (filter === "friends") {
    const searchCondition = search
      ? {
        $or: [
          { requesterName: { $regex: search, $options: "i" } },
          { recipientName: { $regex: search, $options: "i" } },
        ],
      }
      : {};

    const friendships = await Friendship.aggregate([
      {
        $match: {
          $and: [
            { status: "accepted" },
            { $or: [{ requester: owner }, { recipient: owner }] },
            searchCondition,
          ],
        },
      },
      {
        $project: {
          friendId: {
            $cond: [{ $eq: ["$requester", owner] }, "$recipient", "$requester"],
          },
        },
      },
      {
        $lookup: {
          from: 'messages',
          let: { friendId: '$friendId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ['$from', owner] }, { $eq: ['$to', '$$friendId'] }] },
                    { $and: [{ $eq: ['$from', '$$friendId'] }, { $eq: ['$to', owner] }] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: 'lastMessage'
        }
      },
      { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
      { $sort: { "lastMessage.createdAt": -1, "_id": 1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const friendIds = friendships.map((f) => f.friendId);

    const users = await User.find(
      { _id: { $in: friendIds } },
      "_id name email avatarURL isOnline lastSeen"
    );

    const sortedUsers = friendIds.map(id =>
      users.find(u => u._id.toString() === id.toString())
    ).filter(u => u !== undefined);

    const total = await Friendship.countDocuments({
      status: "accepted",
      $or: [{ requester: owner }, { recipient: owner }],
      ...searchCondition,
    });

    res.json({
      data: sortedUsers.map((u) => ({ ...u.toObject(), relationshipStatus: "friend" })),
      meta: {
        total,
        page: Number(page),
        per_page: limit,
        totalPages: Math.ceil(total / limit),
        filter,
        search,
      },
    });
    return;
  }

  // --- 2️⃣ REQUEST_SENT FILTER ---
  if (filter === "request_sent") {
    const searchCondition = search
      ? { recipientName: { $regex: search, $options: "i" } }
      : {};

    const friendships = await Friendship.aggregate([
      { $match: { requester: owner, status: "pending", ...searchCondition } },
      {
        $project: {
          recipient: 1,
        },
      },
      {
        $lookup: {
          from: 'messages',
        let: { friendId: '$friendId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ['$from', owner] }, { $eq: ['$to', '$$friendId'] }] },
                    { $and: [{ $eq: ['$from', '$$friendId'] }, { $eq: ['$to', owner] }] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: 'lastMessage'
        }
      },
      { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
      { $sort: { "lastMessage.createdAt": -1 } },
      { $skip: skip },
      { $limit: limit },
    ]
    );

    const targetIds = friendships.map((f) => f.recipient);

    const users = await User.find(
      { _id: { $in: targetIds } },
      "_id name email avatarURL isOnline lastSeen"
    );

    const sortedUsers = targetIds.map(id =>
      users.find(u => u._id.toString() === id.toString())
    ).filter(u => u !== undefined);

    const total = await Friendship.countDocuments({
      requester: owner,
      status: "pending",
      ...searchCondition,
    });

    res.json({
      data: sortedUsers.map((u) => ({
        ...u.toObject(),
        relationshipStatus: "request_sent",
      })),
      meta: {
        total,
        page: Number(page),
        per_page: limit,
        totalPages: Math.ceil(total / limit),
        filter,
        search,
      },
    });
    return;
  }

  // --- 3️⃣ REQUEST_RECEIVED FILTER ---
  if (filter === "request_received") {
    const searchCondition = search
      ? { requesterName: { $regex: search, $options: "i" } }
      : {};

    const friendships = await Friendship.aggregate([
      { $match: { recipient: owner, status: "pending", ...searchCondition } },
      {
        $project: {
          requester: 1,
        },
      },
      {
        $lookup: {
          from: 'messages',
         let: { friendId: '$friendId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ['$from', owner] }, { $eq: ['$to', '$$friendId'] }] },
                    { $and: [{ $eq: ['$from', '$$friendId'] }, { $eq: ['$to', owner] }] }
                  ]
                }
              }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: 'lastMessage'
        }
      },
      { $unwind: { path: "$lastMessage", preserveNullAndEmptyArrays: true } },
      { $sort: { "lastMessage.createdAt": -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    const targetIds = friendships.map((f) => f.requester);

    const users = await User.find(
      { _id: { $in: targetIds } },
      "_id name email avatarURL isOnline lastSeen"
    );

    const sortedUsers = targetIds.map(id =>
      users.find(u => u._id.toString() === id.toString())
    ).filter(u => u !== undefined);

    const total = await Friendship.countDocuments({
      recipient: owner,
      status: "pending",
      ...searchCondition,
    });

    res.json({
      data: sortedUsers.map((u) => ({
        ...u.toObject(),
        relationshipStatus: "request_received",
      })),
      meta: {
        total,
        page: Number(page),
        per_page: limit,
        totalPages: Math.ceil(total / limit),
        filter,
        search,
      },
    });
    return;
  }

  // --- 4️⃣ NON-FRIENDS + ALL ---
      const searchCondition = search
      ? { requesterName: { $regex: search, $options: "i" } }
      : {};

      
  const friendships = await Friendship.aggregate([
    { $match: { $or: [{ requester: owner }, { recipient: owner }], ...searchCondition } },
    {
      $lookup: {
      from: 'messages',
      let: { friendId: '$friendId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $and: [{ $eq: ['$from', owner] }, { $eq: ['$to', '$$friendId'] }] },
                    { $and: [{ $eq: ['$from', '$$friendId'] }, { $eq: ['$to', owner] }] }
                  ]
                }
              }
            },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: 'lastMessage'
      }
    },
    { $sort: { "lastMessage.createdAt": -1, "_id": 1 } },
    { $skip: skip },
    { $limit: limit },
  ]);

  const friendshipMap = new Map<string, { status: string; isRequester: boolean }>();
  const friendIds = new Set<string>();

    const targetIds = friendships.map((f) => f.recipient);

  for (const f of friendships) {
    const friendId =
      f.requester.toString() === owner.toString()
        ? f.recipient.toString()
        : f.requester.toString();

    friendshipMap.set(friendId, {
      status: f.status,
      isRequester: f.requester.toString() === owner.toString(),
    });

    if (f.status === "accepted") friendIds.add(friendId);
  }

  const userQuery: Record<string, any> = {
    _id: { $ne: owner },
    ...(search ? { name: { $regex: search, $options: "i" } } : {}),
  };

  if (filter === "non-friends") {
    userQuery._id.$nin = Array.from(friendIds);
  }


 const users = await User.find(userQuery, "_id name email avatarURL isOnline lastSeen");
 const total = await User.countDocuments(userQuery);

 const sortedUsers = targetIds.map(id =>
      users.find(u => u._id.toString() === id.toString())
    ).filter(u => u !== undefined);

  const enrichedUsers = sortedUsers.map((user) => {
    const relation = friendshipMap.get(user._id.toString());
    let relationshipStatus: string = "none";

    if (relation) {
      switch (relation.status) {
        case "accepted":
          relationshipStatus = "friend";
          break;
        case "pending":
          relationshipStatus = relation.isRequester
            ? "request_sent"
            : "request_received";
          break;
      }
    }

    return { ...user.toObject(), relationshipStatus };
  });

  res.json({
    data: enrichedUsers,
    meta: {
      total,
      page: Number(page),
      per_page: limit,
      totalPages: Math.ceil(total / limit),
      filter,
      search,
    },
  });
};




export default {
  getUsers: cntrWrapper(getUsers),
}