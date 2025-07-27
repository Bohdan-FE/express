import { HttpError } from "../helpers"

import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

const validateBody = (schema: Schema) => {
    const func = (req: Request, res: Response, next: NextFunction) => {
     console.log('validateBody', req.body)
     console.log('validateBody', schema)
        const { error } = schema.validate(req.body)
        console.log('validateBody', error)
        if (error) {
            return next(HttpError(400, error.message))
        }
        next()
    }
    return func
}
 
export default validateBody