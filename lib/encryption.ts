// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm'; // Recommended algorithm
const SECRET_KEY = Buffer.from(process.env.ENCRYPTION_SECRET || '', 'base64'); // Load key from env
const IV_LENGTH = 16; // For AES GCM

if (!process.env.ENCRYPTION_SECRET || SECRET_KEY.length !== 32) {
    throw new Error('Invalid ENCRYPTION_SECRET. Must be a base64 encoded 32-byte key.');
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    // Prepend IV and AuthTag to the encrypted text for storage
    // Format: iv:authTag:encryptedData (hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted text format.');
        }
        const [ivHex, authTagHex, encryptedDataHex] = parts;
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error("Decryption failed:", error);
        // Handle decryption errors appropriately, maybe return null or throw specific error
        throw new Error("Failed to decrypt token.");
    }
}