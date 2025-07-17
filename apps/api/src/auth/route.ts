import { Router } from "express";
import passport from "passport";
import { FRONTEND_URL } from "../config";

const router:Router = Router()

router.get("/google", 
    passport.authenticate('google', {
        failureRedirect: '/login',
        successRedirect: `${FRONTEND_URL}/home`
    })
)

export default router