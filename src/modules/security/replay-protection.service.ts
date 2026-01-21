import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from './encryption.service';

@Injectable()
export class ReplayProtectionService {
    private readonly NONCE_EXPIRATION_SECONDS = 300; // 5 minutes
    private readonly TIMESTAMP_WINDOW_SECONDS = 30; // ±30 seconds

    constructor(
        private prisma: PrismaService,
        private encryption: EncryptionService,
    ) {
        // Clean up expired nonces every minute
        setInterval(() => this.cleanupExpiredNonces(), 60000);
    }

    /**
     * Validate nonce (must be unique and not expired)
     */
    async validateNonce(nonce: string): Promise<boolean> {
        // Check if nonce exists
        const existing = await this.prisma.nonceStore.findUnique({
            where: { nonce },
        });

        if (existing) {
            return false; // Nonce already used (replay attack)
        }

        // Store nonce
        const expiresAt = new Date(Date.now() + this.NONCE_EXPIRATION_SECONDS * 1000);
        await this.prisma.nonceStore.create({
            data: {
                nonce,
                expiresAt,
            },
        });

        return true;
    }

    /**
     * Validate timestamp (must be within time window)
     */
    validateTimestamp(timestamp: number): boolean {
        const now = Date.now();
        const diff = Math.abs(now - timestamp);
        return diff <= this.TIMESTAMP_WINDOW_SECONDS * 1000;
    }

    /**
     * Clean up expired nonces from database
     */
    private async cleanupExpiredNonces() {
        await this.prisma.nonceStore.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }

    /**
     * Validate request signature
     */
    validateRequestSignature(
        payload: string,
        signature: string,
        secret: string,
    ): boolean {
        return this.encryption.verifyHMAC(payload, signature, secret);
    }
}
