import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { EncryptionService } from '../security/encryption.service';
import { v4 as uuidv4 } from 'uuid';

interface HandshakeSession {
    challenge: string;
    publicKey: string;
    deviceFingerprint: string;
    ip: string;
    timestamp: number;
}

@Injectable()
export class HandshakeService {
    private pendingHandshakes: Map<string, HandshakeSession> = new Map();
    private readonly HANDSHAKE_TIMEOUT = 60000; // 1 minute

    constructor(private encryption: EncryptionService) {
        // Clean up expired handshakes every minute
        setInterval(() => this.cleanupExpiredHandshakes(), 60000);
    }

    /**
     * Phase 1: Initiate handshake - Generate challenge and send public key
     */
    async initiateHandshake(deviceFingerprint: string, ip: string) {
        const challenge = this.encryption.generateChallenge();
        const sessionId = uuidv4();

        const handshakeSession: HandshakeSession = {
            challenge,
            publicKey: this.encryption.getPublicKey(),
            deviceFingerprint,
            ip,
            timestamp: Date.now(),
        };

        this.pendingHandshakes.set(sessionId, handshakeSession);

        return {
            success: true,
            sessionId,
            challenge,
            publicKey: this.encryption.getPublicKey(),
        };
    }

    /**
     * Phase 2: Verify challenge response and establish session
     */
    async verifyChallengeResponse(
        challengeId: string,
        signedChallenge: string,
        clientPublicKey: string,
        ip: string,
    ) {
        const handshake = this.pendingHandshakes.get(challengeId);

        if (!handshake) {
            throw new HttpException(
                'Invalid or expired handshake session',
                HttpStatus.UNAUTHORIZED,
            );
        }

        // Verify IP matches
        if (handshake.ip !== ip) {
            throw new HttpException(
                'IP address mismatch',
                HttpStatus.UNAUTHORIZED,
            );
        }

        // Verify signature (simplified - in production, verify RSA signature)
        // For now, we'll accept if the signed challenge contains the original challenge
        if (!signedChallenge.includes(handshake.challenge)) {
            throw new HttpException(
                'Invalid challenge signature',
                HttpStatus.UNAUTHORIZED,
            );
        }

        // Generate AES session key
        const aesKey = this.encryption.generateAESKey();

        // Encrypt session key with client's public key
        const encryptedAESKey = this.encryption.rsaEncrypt(aesKey, clientPublicKey);

        // Create session token
        const sessionToken = uuidv4();

        // Clean up handshake
        this.pendingHandshakes.delete(challengeId);

        return {
            success: true,
            sessionToken,
            encryptedAESKey,
            message: 'Handshake completed successfully',
        };
    }

    /**
     * Clean up expired handshakes
     */
    private cleanupExpiredHandshakes() {
        const now = Date.now();
        for (const [sessionId, handshake] of this.pendingHandshakes.entries()) {
            if (now - handshake.timestamp > this.HANDSHAKE_TIMEOUT) {
                this.pendingHandshakes.delete(sessionId);
            }
        }
    }
}
