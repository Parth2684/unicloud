import { google } from "googleapis";
import { BACKEND_URL, GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET } from "../config";
import { Credentials } from "google-auth-library";



const oauth2client = new google.auth.OAuth2(
    GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET,
    `${BACKEND_URL}/auth/drive/callback`
);

const SCOPES = ["https://www.googleapis.com/auth/drive"]

export function getAuthUrl() {
    return oauth2client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES
    })
}

export async function getDriveTokens (code: string): Promise<Credentials> {
    const { tokens } = await oauth2client.getToken(code)
    return tokens
}