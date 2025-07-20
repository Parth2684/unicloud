import passport from "passport";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { BACKEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } from "../config";
import { prisma } from "@repo/db"

passport.serializeUser((user: any,  done) => {
    done(null, user.id)
})

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        })

        if(!user) {
            return done(null, false)
        }

        done(null, user)
    } catch (error) {
        done(error)
    }
})

passport.use(
    new GoogleStrategy(
        {
            clientID: GOOGLE_CLIENT_ID as string,
            clientSecret: GOOGLE_CLIENT_SECRET as string,
            callbackURL: `${BACKEND_URL}/auth/google/callback`
        },
        async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value
                if(!email) {
                    return done(null, false)
                }

                let user = await prisma.user.findUnique({ where: { email } });

                if (!user) {
                    user = await prisma.user.create({
                        data: {
                        email,
                        name: profile.displayName,
                        image: profile.photos?.[0]?.value || null,
                        },
                    });
                } 

                if(user){
                    done(null, user)
                }else {
                    throw new Error("user couldn't be signned in")
                }
                
            } catch (error) {
                console.error(error)
                done(error)
            }
        }
    )
)