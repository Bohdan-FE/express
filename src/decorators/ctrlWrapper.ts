import { Request, Response, NextFunction } from 'express';

const cntrWrapper = (cntr: (req: Request, res: Response, next: NextFunction) => Promise<void>) => {
    const func = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await cntr(req,res,next)
        } catch (error) {
            next(error)
        }
    }
    return func
}

export default cntrWrapper