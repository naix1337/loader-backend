import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../security/encryption.service';
import { KeyAuthService } from '../keyauth/keyauth.service';
import { FingerprintService } from '../hwid/fingerprint.service';
import { RiskScoringService } from '../hwid/risk-scoring.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoaderApiService {
    constructor(
        private prisma: PrismaService,
        private encryption: EncryptionService,
        private keyAuth: KeyAuthService,
        private fingerprintService: FingerprintService,
        private riskScoring: RiskScoringService,
    ) { }

    /**
     * User login from C++ loader
     */
    async login(
        username: string,
        password: string,
        sessionToken: string,
        encryptedPayload: string,
        iv: string,
        tag: string,
        ip: string,
        userAgent: string,
    ) {
        // Log login attempt
        await this.prisma.loginLog.create({
            data: {
                username,
                success: false,
                ipAddress: ip,
                userAgent,
            },
        });

        // Find user
        const user = await this.prisma.user.findUnique({
            where: { username },
            include: { licenses: true },
        });

        if (!user) {
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }

        // Check if banned
        if (user.isBanned) {
            throw new HttpException(`Account banned: ${user.banReason}`, HttpStatus.FORBIDDEN);
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
        }

        // Verify with KeyAuth
        // Note: HWID will be extracted from encrypted payload
        const decryptedPayload = JSON.parse(encryptedPayload); // In production, decrypt first
        const hwid = decryptedPayload.hwid;

        const keyAuthResult = await this.keyAuth.verifyLogin(username, password, hwid);
        if (!keyAuthResult.success) {
            throw new HttpException(
                keyAuthResult.message || 'KeyAuth verification failed',
                HttpStatus.UNAUTHORIZED,
            );
        }

        // Update last login
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                lastLoginAt: new Date(),
                lastLoginIp: ip,
            },
        });

        // Create session
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const session = await this.prisma.session.create({
            data: {
                sessionToken,
                userId: user.id,
                licenseId: user.licenses[0]?.id || '',
                ipAddress: ip,
                userAgent,
                aesKey: 'encrypted-aes-key', // In production, encrypt properly
                expiresAt,
            },
        });

        // Log successful login
        await this.prisma.loginLog.create({
            data: {
                userId: user.id,
                username,
                success: true,
                ipAddress: ip,
                userAgent,
            },
        });

        return {
            success: true,
            message: 'Login successful',
            sessionToken: session.sessionToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        };
    }

    /**
     * Verify session and license status
     */
    async verifySession(
        sessionToken: string,
        encryptedPayload: string,
        iv: string,
        tag: string,
    ) {
        const session = await this.prisma.session.findUnique({
            where: { sessionToken },
            include: {
                user: true,
                license: true,
            },
        });

        if (!session || !session.isActive) {
            throw new HttpException('Invalid session', HttpStatus.UNAUTHORIZED);
        }

        if (new Date() > session.expiresAt) {
            throw new HttpException('Session expired', HttpStatus.UNAUTHORIZED);
        }

        return {
            success: true,
            valid: true,
            user: {
                username: session.user.username,
                role: session.user.role,
            },
            license: {
                type: session.license.type,
                expiresAt: session.license.expiresAt,
                isActive: session.license.isActive,
            },
        };
    }

    /**
     * Handle heartbeat from C++ loader
     */
    async heartbeat(
        sessionToken: string,
        encryptedPayload: string,
        iv: string,
        tag: string,
        ip: string,
    ) {
        const session = await this.prisma.session.findUnique({
            where: { sessionToken },
        });

        if (!session || !session.isActive) {
            throw new HttpException('Invalid session', HttpStatus.UNAUTHORIZED);
        }

        // Update last heartbeat
        await this.prisma.session.update({
            where: { id: session.id },
            data: {
                lastHeartbeat: new Date(),
            },
        });

        // Create heartbeat record
        await this.prisma.heartbeat.create({
            data: {
                sessionId: session.id,
                licenseId: session.licenseId,
            },
        });

        return {
            success: true,
            message: 'Heartbeat received',
        };
    }

    /**
     * Activate license key
     */
    async activateLicense(
        licenseKey: string,
        encryptedPayload: string,
        iv: string,
        tag: string,
    ) {
        const license = await this.prisma.license.findUnique({
            where: { key: licenseKey },
        });

        if (!license) {
            throw new HttpException('Invalid license key', HttpStatus.NOT_FOUND);
        }

        if (!license.isActive || license.isRevoked) {
            throw new HttpException('License is not active', HttpStatus.FORBIDDEN);
        }

        if (license.expiresAt && new Date() > license.expiresAt) {
            throw new HttpException('License has expired', HttpStatus.FORBIDDEN);
        }

        return {
            success: true,
            license: {
                type: license.type,
                expiresAt: license.expiresAt,
                maxDevices: license.maxDevices,
            },
        };
    }
}
