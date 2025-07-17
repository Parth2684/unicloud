import dotenv from 'dotenv'
dotenv.config()

export const FRONTEND_URL = process.env.FRONTEND_URL as string 
export const SESSION_SECRET = process.env.SESSION_SECRET as string  
export const NODE_ENV = process.env.NODE_ENV as string
export const DOMAIN = process.env.DOMAIN as string
export const MONGO_URL = process.env.MONGO_URL as string