import { prisma } from "@repo/database";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken"
import { z } from "zod/v4";


const JwtDecode = z.object({
  id: z.uuid().nonempty(),
  exp: z.number().nonoptional()
})

export type DecodedUser = z.infer<typeof JwtDecode>

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const JWT_SECRET = process.env.JWT_SECRET!
  const token = req.headers.authorization
  if (!token) {
    res.status(401).json({
      message: "Unauthorized"
    })
    return
  }
  token.replace(/^Bearer\s+/i, "");

  const decoded = jwt.verify(token, JWT_SECRET);
  const parsedDecoded = JwtDecode.safeParse(decoded);
  if (!parsedDecoded.success) {
    res.status(401).json({
      message: "Unauthorized"
    })
    return;
  }
  if (parsedDecoded.data.exp < new Date().getTime()) {
    res.status(401).json({
      message: "Token is expired"
    })
    return
  }
  try {
    const userExists = await prisma.users.findUnique({
      where: {
        id: parsedDecoded.data.id
      },
      select: {
        id: true
      }
    })

    if (!userExists) {
      res.status(401).json({
        message: "User not found in database"
      });
      return
    }
    req.user = parsedDecoded.data;
    next()
  } catch (err) {
    console.error("Error finding user", err)
    res.status(500).json({
      messahe: "Internal Server error: could not find user in the database"
    })
    return
  }
}
