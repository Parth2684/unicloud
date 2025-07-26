import { Request, Router, Response } from "express";
import { getAuthUrl, getDriveTokens } from "../../auth/googleDriveAuth";
import { prisma } from "@repo/db";
import { encrypt } from "../../utils/encryption";
import { FRONTEND_URL } from "../../config";

const router: Router = Router()

router.get("/drive", (req: Request, res: Response) => {
    const url = getAuthUrl()
    res.redirect(url)
})

router.get("/drive/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string
    const { id } = req.user!;

    try {
        const { tokens, email } = await getDriveTokens(code);
        await prisma.cloudAccount.upsert({
            where: {
                userId_provider_email: {
                    userId: id,
                    provider: "GOOGLE",
                    email: email
                }              
            },
            update: {
                accessToken: encrypt(tokens.access_token as string),
                expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000),
                ...(tokens.refresh_token ? { refreshToken: encrypt(tokens.refresh_token as string) } : {})
            },
            create: {
                userId: req.user!.id,
                email: email,
                provider: "GOOGLE",
                accessToken: encrypt(tokens.access_token as string),
                refreshToken: encrypt(tokens.refresh_token as string),
                expiresAt: new Date(tokens.expiry_date ?? Date.now() + 3600 * 1000)
            }
        })

        res.redirect(`${FRONTEND_URL}/home`)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            message: "Error connecting to Google Drive"
        })
    }
})

export default router
