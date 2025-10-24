import jwt, { TokenExpiredError } from "jsonwebtoken"
import User from '../models/User'
import { HttpError } from "../helpers"

import { Request, Response, NextFunction } from "express";

declare module 'express' {
    interface Request {
      user?: any;
    }
  }

const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization = '' } = req.headers;
    const [bearer, token] = authorization.split(' ');
    if (bearer !== 'Bearer') {
        return next(HttpError(401, 'not bearer'));
    }
    try {
        if (!process.env.SECRET_KEY) {
            throw new Error("SECRET_KEY is not defined");
        }
        const { id } = jwt.verify(token, process.env.SECRET_KEY as string) as { id: string };
        const user = await User.findById(id)
        if (!user || !user.token || user.token !== token) {
          next(HttpError(401)) 
          return 
        }
        req.user = user
        next()   
    } catch(error) {
      if (error instanceof TokenExpiredError) {
        return next(HttpError(401, "Token has expired"));
    }
        next(HttpError(401))
    }
}

export default authenticate