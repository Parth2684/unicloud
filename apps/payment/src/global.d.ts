import { Request } from "express";
import type { DecodedUser } from "./middleware/auth";

declare global {
  namespace Express {
    interface Request {
      user: DecodedUser
    }
  }
}