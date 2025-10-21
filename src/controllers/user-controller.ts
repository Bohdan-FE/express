import cntrWrapper from "../decorators/ctrlWrapper";
import User from "../models/User";
import { Request, Response } from 'express'


const getUsers = async (req: Request, res: Response) => {
    const { _id: owner } = req.user;
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(
        { _id: { $ne: owner } },
        '_id name email avatarURL'
    )
    .skip(skip)
    .limit(Number(limit));

    const total = await User.countDocuments({ _id: { $ne: owner } });

    res.json({
        users,
        meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
    }
    });
}


export default {
    getUsers: cntrWrapper(getUsers),
}