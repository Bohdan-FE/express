import cntrWrapper from "../decorators/ctrlWrapper";
import User from "../models/User";
import { Request, Response } from 'express'


const getUsers = async (req: Request, res: Response) => {
    const { _id: owner } = req.user;
    const { page = 1, per_page = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(per_page);

    const users = await User.find(
        { _id: { $ne: owner } },
        '_id name email avatarURL'
    )
    .skip(skip)
    .limit(Number(per_page));

    const total = await User.countDocuments({ _id: { $ne: owner } });

    res.json({
        data: users,
        meta: {
        total,
        page: Number(page),
        per_page: Number(per_page),
        totalPages: Math.ceil(total / Number(per_page))
    }
    });
}


export default {
    getUsers: cntrWrapper(getUsers),
}