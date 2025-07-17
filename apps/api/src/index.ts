import dotenv from 'dotenv'
dotenv.config()
import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import { FRONTEND_URL } from './config'



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
app.use()





app.listen(port, (() => {
    console.log(`App is listening on port ${port}`)
}))