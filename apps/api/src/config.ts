import dotenv from 'dotenv'
dotenv.config()
export { prisma } from '@repo/db'
export type {
    User,
    Prisma
} from "@repo/db"

export const POSTGRES_DATABASE_URL = process.env.POSTGRES_DATABASE_URL 
export const FRONTEND_URL = process.env.FRONTEND_URL  
export const SESSION_SECRET = process.env.SESSION_SECRET   
export const NODE_ENV = process.env.NODE_ENV
export const DOMAIN = process.env.DOMAIN 
export const MONGO_URL = process.env.MONGO_URL 
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID 
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
export const BACKEND_URL = process.env.BACKEND_URL

