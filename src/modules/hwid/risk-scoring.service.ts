import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FingerprintComponents, FingerprintService } from './fingerprint.service';

@Injectable()
export class RiskScoringService {
    constructor(
        private prisma: PrismaService,
        private fingerprintService: FingerprintService,
    ) { }

    /**
     * Calculate risk score based on multiple factors (0-100)
     */
    async calculateRiskScore(
        userId: string,
        licenseId: string,
        newComponents: FingerprintComponents,
        ipAddress: string,
        geoLocation?: string,
    ): Promise<number> {
        let riskScore = 0;

        // Factor 1: HWID changes frequency
        const hwidRecord = await this.prisma.hWIDRecord.findFirst({
            where: { userId, licenseId },
        });

        if (hwidRecord) {
            // High change count = higher risk
            if (hwidRecord.changeCount > 5) {
                riskScore += 30;
            } else if (hwidRecord.changeCount > 2) {
                riskScore += 15;
            }
        }

        // Factor 2: VM detection
        const vmDetection = this.fingerprintService.detectVirtualMachine(newComponents);
        if (vmDetection.isVM) {
            riskScore += 40; // High risk for VMs
        }

        // Factor 3: Multiple device usage
        const deviceCount = await this.prisma.hWIDRecord.count({
            where: { userId, licenseId },
        });

        if (deviceCount > 3) {
            riskScore += 20;
        }

        // Factor 4: Rapid location changes (if geo data available)
        if (geoLocation) {
            const recentLogins = await this.prisma.loginLog.findMany({
                where: {
                    userId,
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
                    },
                },
                orderBy: { timestamp: 'desc' },
                take: 5,
            });

            const uniqueLocations = new Set(
                recentLogins.map((log) => log.geoLocation).filter(Boolean),
            );

            if (uniqueLocations.size > 3) {
                riskScore += 15; // Suspicious travel patterns
            }
        }

        // Factor 5: Previous risk events
        const riskEvents = await this.prisma.riskEvent.count({
            where: {
                hwidRecord: {
                    userId,
                    licenseId,
                },
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
            },
        });

        if (riskEvents > 0) {
            riskScore += Math.min(riskEvents * 5, 25);
        }

        return Math.min(riskScore, 100);
    }

    /**
     * Create risk event
     */
    async createRiskEvent(
        hwidRecordId: string,
        eventType: string,
        severity: number,
        description: string,
        metadata?: any,
    ) {
        await this.prisma.riskEvent.create({
            data: {
                hwidRecordId,
                eventType: eventType as any,
                severity,
                description,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });
    }

    /**
     * Check if user should be auto-flagged/shadow-banned
     */
    async checkAutoFlag(riskScore: number): Promise<{ shouldFlag: boolean; action: string }> {
        if (riskScore >= 80) {
            return { shouldFlag: true, action: 'SHADOW_BAN' };
        } else if (riskScore >= 60) {
            return { shouldFlag: true, action: 'FLAG_FOR_REVIEW' };
        }

        return { shouldFlag: false, action: 'NONE' };
    }
}
