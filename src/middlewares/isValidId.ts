import { isValidObjectId } from "mongoose"
import { HttpError } from "../helpers"

import { Request, Response, NextFunction } from "express";

const isValidId = (req: Request, res: Response, next: NextFunction) => {
    const { contactId } = req.params
    if (!isValidObjectId(contactId)) {
        return  next(HttpError(404, `${contactId} is not valid id`))
    }
    next()
}

export default isValidId