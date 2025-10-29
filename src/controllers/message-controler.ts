import cntrWrapper from '../decorators/ctrlWrapper';
import Message from '../models/Message';
import { Request, Response } from 'express';

const getMessages = async (req: Request, res: Response) => {
  const { _id: owner } = req.user;
  const { page, per_page } = req.query;
  const { id: to } = req.params;

  const skip = (Number(page) - 1) * Number(per_page);

  const messages = await Message.find({
    $or: [
      { from: owner, to },
      { from: to, to: owner },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(per_page));

  const total = await Message.countDocuments({
    $or: [
      { from: owner, to },
      { from: to, to: owner },
    ],
  });

  res.json({
    data: messages,
    meta: {
      total,
      page: Number(page),
      per_page: Number(per_page),
      totalPages: Math.ceil(total / Number(per_page)),
    },
  });
};

const getUnreadMessagesCount = async (req: Request, res: Response) => {
  const { _id: owner } = req.user;

  const count = await Message.countDocuments({
    to: owner,
    status: { $in: ['sent', 'delivered'] },
  });

  res.json({ unreadCount: count });
};

export default {
  getMessages: cntrWrapper(getMessages),
  getUnreadMessagesCount: cntrWrapper(getUnreadMessagesCount),
};
