import { Request, Response } from 'express';
import Message from '../models/Message';
import cntrWrapper from '../decorators/ctrlWrapper';


const getMessages = async (req: Request, res: Response) => {
    const {owner} = req.user;
    const { id: to, page, per_page  } = req.query;

    const skip = (Number(page) - 1) * Number(per_page);

    const messages = await Message.find({
        $or: [
            { from: owner, to },
            { from: to, to: owner }
        ]
    }).sort({ createdAt: 1 }).skip(skip).limit(Number(per_page));

    const total = await Message.countDocuments({
        $or: [
            { from: owner, to },
            { from: to, to: owner }
        ]
    });

    res.json({
        data: messages,
        meta: {
            total,
            page: Number(page),
            per_page: Number(per_page),
            totalPages: Math.ceil(total / Number(per_page))
            }
    });
}

export default {
    getMessages: cntrWrapper(getMessages),
}