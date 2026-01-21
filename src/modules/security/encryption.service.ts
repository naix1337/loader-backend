import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionService {
    private readonly rsaPrivateKey: string;
    private readonly rsaPublicKey: string;

    constructor(private config: ConfigService) {
        // In production, load from secure key storage
        this.generateRSAKeys();
    }

    /**
     * Generate RSA key pair (2048-bit)
     */
    private generateRSAKeys() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem',
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem',
            },
        });

        (this as any).rsaPublicKey = publicKey;
        (this as any).rsaPrivateKey = privateKey;
    }

    /**
     * Get public RSA key for client
     */
    getPublicKey(): string {
        return this.rsaPublicKey;
    }

    /**
     * Decrypt data with RSA private key
     */
    rsaDecrypt(encryptedData: string): string {
        try {
            const buffer = Buffer.from(encryptedData, 'base64');
            const decrypted = crypto.privateDecrypt(
                {
                    key: this.rsaPrivateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                },
                buffer,
            );
            return decrypted.toString('utf8');
        } catch (error) {
            throw new Error('RSA decryption failed');
        }
    }

    /**
     * Encrypt data with RSA public key
     */
    rsaEncrypt(data: string, publicKey?: string): string {
        const keyToUse = publicKey || this.rsaPublicKey;
        const buffer = Buffer.from(data, 'utf8');
        const encrypted = crypto.publicEncrypt(
            {
                key: keyToUse,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            },
            buffer,
        );
        return encrypted.toString('base64');
    }

    /**
     * Generate AES-256 session key
     */
    generateAESKey(): string {
        return crypto.randomBytes(32).toString('hex'); // 256-bit key
    }

    /**
     * Encrypt data with AES-256-GCM
     */
    aesEncrypt(data: string, key: string): { encrypted: string; iv: string; tag: string } {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            'aes-256-gcm',
            Buffer.from(key, 'hex'),
            iv,
        );

        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const tag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
        };
    }

    /**
     * Decrypt data with AES-256-GCM
     */
    aesDecrypt(encrypted: string, key: string, iv: string, tag: string): string {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                Buffer.from(key, 'hex'),
                Buffer.from(iv, 'hex'),
            );

            decipher.setAuthTag(Buffer.from(tag, 'hex'));

            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');

            return decrypted;
        } catch (error) {
            throw new Error('AES decryption failed');
        }
    }

    /**
     * Generate HMAC-SHA256 signature
     */
    generateHMAC(data: string, secret: string): string {
        return crypto
            .createHmac('sha256', secret)
            .update(data)
            .digest('hex');
    }

    /**
     * Verify HMAC-SHA256 signature
     */
    verifyHMAC(data: string, signature: string, secret: string): boolean {
        const expectedSignature = this.generateHMAC(data, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature),
        );
    }

    /**
     * Generate random nonce
     */
    generateNonce(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Hash data with SHA256
     */
    sha256(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Generate random challenge
     */
    generateChallenge(): string {
        return crypto.randomBytes(64).toString('hex');
    }
}
