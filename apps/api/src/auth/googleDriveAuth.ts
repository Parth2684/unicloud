import { google } from "googleapis";
import { BACKEND_URL, GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET } from "../config";
import { Credentials } from "google-auth-library";
import axios from "axios";



const oauth2client = new google.auth.OAuth2(
    GOOGLE_DRIVE_CLIENT_ID,
    GOOGLE_DRIVE_CLIENT_SECRET,
    `${BACKEND_URL}/auth/drive/callback`
);

const SCOPES = [
    "https://www.googleapis.com/auth/drive", 
    "https://www.googleapis.com/auth/userinfo.email"
]

export function getAuthUrl() {
    return oauth2client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES
    })
}

export async function getDriveTokens (code: string): Promise<{tokens: Credentials, email: string}> {
    const { tokens } = await oauth2client.getToken(code)
    if(!tokens.access_token) {
        throw new Error("Access token not received")
    }

    const response  = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo`, {
        headers: {
            Authorization: `Bearer ${tokens.access_token}`
        }
    })
     const data = response.data;

    if (!data.email) {
        throw new Error("Could not retrieve email from Google");
    }

    return {
        tokens,
        email: data.email,
    };
}