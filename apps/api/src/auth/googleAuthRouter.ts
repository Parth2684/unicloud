import { Router } from "express";
import passport from "passport";
import { FRONTEND_URL } from "../config";

const router:Router = Router()

router.get("/google/callback", 
    passport.authenticate('google', {
        scope: ["profile", "email"],
        failureRedirect: '/login',
        successRedirect: `${FRONTEND_URL}/home`
    })
)

export default router