import type { User as PrismaUser } from "@repo/db";

declare global {
    namespace Express {
        interface User extends PrismaUser {}
    }
}