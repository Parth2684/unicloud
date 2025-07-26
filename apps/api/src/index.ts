import dotenv from 'dotenv'
dotenv.config()
import express from "express"
import cookieParser from "cookie-parser"
import './auth/passport'
import cors from "cors"
import { FRONTEND_URL } from './config'
import sessionMiddleware from './middlewares/session'
import passport from 'passport'
import signinRouter from './auth/googleAuthRouter'
import { requireAuthMiddleware } from './middlewares/requireAuth'
import googleDriveConnect from "./routes/linkCloud/googleDrive"



const port = 4000
const app = express()

app.set('trust proxy', 1);


app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie', 'Origin'],
    exposedHeaders: ['Set-Cookie'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}))
app.use(express.json())
app.use(cookieParser())
app.use(sessionMiddleware)
app.use(passport.initialize())
app.use(passport.session())
// Google single sign on 
app.use("/api/v1/auth", signinRouter)

// require auth middleware 
app.use(requireAuthMiddleware)
// add google drive account or update token if it's expired
app.use("/api/v1/auth", googleDriveConnect)



app.listen(port, (() => {
    console.log(`App is listening on port ${port}`)
}))