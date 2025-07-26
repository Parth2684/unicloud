import { Request, Response, NextFunction } from "express"


export const requireAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    if(!req.user) {
        res.status(401).json({
            message: "Unauthorised"
        })
    }
    next()
}