import cntrWrapper from '../decorators/ctrlWrapper';
import { HttpError } from '../helpers';
import Message from '../models/Message';
import { Request, Response } from 'express';

const getMessages = async (req: Request, res: Response) => {
  const { _id: owner } = req.user;
  const { page = 1, per_page = 20, updatedAfter } = req.query;
  const { id: to } = req.params;

  const skip = (Number(page) - 1) * Number(per_page);

  const query: any = {
    $or: [
      { from: owner, to },
      { from: to, to: owner },
    ],
  };

  if (updatedAfter) {
    query.updatedAt = {
      $gt: new Date(updatedAfter as string),
    };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(per_page));

  const total = await Message.countDocuments(query);

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

const uploadMessageImage = async (req: Request, res: Response) => {
  if (!req.file) {
    throw HttpError(409, 'File not uploaded');
  }

  res.status(201).json({
    imageUrl: (req.file as any).location,
  });
};

export default {
  getMessages: cntrWrapper(getMessages),
  getUnreadMessagesCount: cntrWrapper(getUnreadMessagesCount),
  uploadMessageImage: cntrWrapper(uploadMessageImage),
};
