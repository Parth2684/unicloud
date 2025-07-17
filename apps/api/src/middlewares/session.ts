import session from 'express-session'
import MongoStore from 'connect-mongo'
import { DOMAIN, MONGO_URL, NODE_ENV, SESSION_SECRET } from '../config'

const sessionMiddleware: ReturnType<typeof session> = session({
    secret: SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV === 'production',
        httpOnly: true,
        sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
        domain: DOMAIN || undefined,
        maxAge: 24 * 60 * 60 * 1000,
        path: '/'
    },
    store: MongoStore.create({
        mongoUrl: MONGO_URL,
        collectionName: 'session',
        ttl: 60 * 60 * 24
    }),
    proxy: NODE_ENV === 'production'
})

export default sessionMiddleware