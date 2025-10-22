import { isValidObjectId } from "mongoose"
import { HttpError } from "../helpers"

import { Request, Response, NextFunction } from "express";

const isValidId = (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params
    if (!isValidObjectId(id)) {
        return  next(HttpError(404, `${id} is not valid id`))
    }
    next()
}

export default isValidId