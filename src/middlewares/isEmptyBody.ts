import { HttpError } from "../helpers"

import { Request, Response, NextFunction } from "express";

const isEmptyBody = (req: Request, res: Response, next: NextFunction) => {
    const keys = Object.keys(req.body)
    if (!keys.length) {
        next(HttpError(400, 'Body must contain fields' ))
    }
    next()
}

export default isEmptyBody