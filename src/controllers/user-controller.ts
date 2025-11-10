import cntrWrapper from '../decorators/ctrlWrapper';
import User from '../models/User';
import { Request, Response } from 'express';
import { PipelineStage } from 'mongoose';

const getUsers = async (req: Request, res: Response) => {
  const { _id: owner } = req.user;
  const {
    page = '1',
    per_page = '10',
    filter = 'all',
    search = '',
  } = req.query;

  const skip = (Number(page) - 1) * Number(per_page);
  const limit = Number(per_page);

  const pipeline: PipelineStage[] = [
    { $match: { _id: { $ne: owner } } },

    ...(search
      ? [
          {
            $match: {
              $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
              ],
            },
          },
        ]
      : []),

    {
      $lookup: {
        from: 'friendships',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      { $eq: ['$requester', '$$userId'] },
                      { $eq: ['$recipient', owner] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ['$recipient', '$$userId'] },
                      { $eq: ['$requester', owner] },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: 'friendship',
      },
    },

    { $unwind: { path: '$friendship', preserveNullAndEmptyArrays: true } },

    {
      $addFields: {
        friendshipStatus: '$friendship.status',
        relationshipId: '$friendship._id',
        requester: '$friendship.requester',
        recipient: '$friendship.recipient',
        relationshipStatus: {
          $switch: {
            branches: [
              {
                case: { $eq: ['$friendship', null] },
                then: 'none',
              },
              {
                case: { $and: [{ $eq: ['$friendship.status', 'accepted'] }] },
                then: 'friend',
              },
              {
                case: { $eq: ['$friendship.requester', owner] },
                then: 'request_sent',
              },
              {
                case: { $eq: ['$friendship.recipient', owner] },
                then: 'request_received',
              },
            ],
            default: 'none',
          },
        },
      },
    },
  ];

  if (filter === 'friends') {
    pipeline.push({ $match: { friendshipStatus: 'accepted' } });
  } else if (filter === 'request_sent') {
    pipeline.push({
      $match: {
        requester: owner,
        friendshipStatus: 'pending',
      },
    });
  } else if (filter === 'request_received') {
    pipeline.push({
      $match: {
        recipient: owner,
        friendshipStatus: 'pending',
      },
    });
  } else if (filter === 'non-friends') {
    pipeline.push({ $match: { friendshipStatus: null } });
  }

  pipeline.push(
    {
      $lookup: {
        from: 'messages',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      { $eq: ['$from', '$$userId'] },
                      { $eq: ['$to', owner] },
                    ],
                  },
                  {
                    $and: [
                      { $eq: ['$to', '$$userId'] },
                      { $eq: ['$from', owner] },
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: 'lastMessage',
      },
    },
    { $unwind: { path: '$lastMessage', preserveNullAndEmptyArrays: true } },
  );

  pipeline.push(
    {
      $lookup: {
        from: 'messages',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$to', owner] },
                  { $eq: ['$from', '$$userId'] },
                  {
                    $or: [
                      { $eq: ['$status', 'sent'] },
                      { $eq: ['$status', 'delivered'] },
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: 'unreadMessages',
      },
    },
    { $addFields: { unreadCount: { $size: '$unreadMessages' } } },
    { $project: { unreadMessages: 0 } },
  );

  pipeline.push({
    $project: {
      password: 0,
      token: 0,
    },
  });

  pipeline.push(
    { $skip: skip },
    { $limit: limit },
    { $sort: { 'lastMessage.createdAt': -1 } },
  );

  const users = await User.aggregate(pipeline);

  res.status(200).json({
    data: users,
    meta: {
      page: Number(page),
      per_page: Number(per_page),
      total: users.length,
      totalPages: Math.ceil(users.length / limit),
    },
  });
};

export default {
  getUsers: cntrWrapper(getUsers),
};
