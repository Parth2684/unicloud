import crypto from "crypto"
import { ENCRYPTION_KEY } from "../config";

const algorithm = 'aes-256-gcm';
const key = Buffer.from(ENCRYPTION_KEY as string, "hex");
const iv = crypto.randomBytes(12)

export const encrypt = (text: string) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted.toString('hex') 
}

export const decrypt = (encrypted: string) => {
    const [ivHex, tagHex, encryptedHex] = encrypted.split(":");
    const iv = Buffer.from(ivHex as string, 'hex')
    const tag = Buffer.from(tagHex as string, 'hex')
    const encryptedText = Buffer.from(encryptedHex as string, 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv) 
    decipher.setAuthTag(tag)
    return decipher.update(encryptedText, undefined, 'utf-8') + decipher.final('utf8')
}