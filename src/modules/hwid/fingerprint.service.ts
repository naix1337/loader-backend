import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../security/encryption.service';

export interface FingerprintComponents {
    cpuId?: string;
    diskSerial?: string;
    macHash?: string;
    biosHash?: string;
    osHash?: string;
}

@Injectable()
export class FingerprintService {
    constructor(
        private prisma: PrismaService,
        private encryption: EncryptionService,
    ) { }

    /**
     * Generate composite fingerprint from components
     */
    generateCompositeFingerprint(components: FingerprintComponents): string {
        const parts = [
            components.cpuId || '',
            components.diskSerial || '',
            components.macHash || '',
            components.biosHash || '',
            components.osHash || '',
        ];

        const combined = parts.join('|');
        return this.encryption.sha256(combined);
    }

    /**
     * Calculate similarity score between two fingerprints (0-100)
     */
    calculateSimilarity(fp1: FingerprintComponents, fp2: FingerprintComponents): number {
        let matches = 0;
        let total = 0;

        const fields: (keyof FingerprintComponents)[] = [
            'cpuId',
            'diskSerial',
            'macHash',
            'biosHash',
            'osHash',
        ];

        for (const field of fields) {
            if (fp1[field] || fp2[field]) {
                total++;
                if (fp1[field] === fp2[field]) {
                    matches++;
                }
            }
        }

        return total > 0 ? (matches / total) * 100 : 0;
    }

    /**
     * Validate fingerprint against stored record with tolerance
     */
    async validateFingerprint(
        userId: string,
        licenseId: string,
        newComponents: FingerprintComponents,
    ): Promise<{
        isValid: boolean;
        similarityScore: number;
        hwidRecord?: any;
    }> {
        // Get existing HWID record
        const existingRecord = await this.prisma.hWIDRecord.findFirst({
            where: {
                userId,
                licenseId,
            },
        });

        if (!existingRecord) {
            // First time - create new record
            const compositeFP = this.generateCompositeFingerprint(newComponents);

            const hwidRecord = await this.prisma.hWIDRecord.create({
                data: {
                    userId,
                    licenseId,
                    ...newComponents,
                    compositeFP,
                    trustScore: 100.0,
                    riskScore: 0.0,
                },
            });

            return {
                isValid: true,
                similarityScore: 100,
                hwidRecord,
            };
        }

        // Calculate similarity
        const oldComponents: FingerprintComponents = {
            cpuId: existingRecord.cpuId,
            diskSerial: existingRecord.diskSerial,
            macHash: existingRecord.macHash,
            biosHash: existingRecord.biosHash,
            osHash: existingRecord.osHash,
        };

        const similarityScore = this.calculateSimilarity(oldComponents, newComponents);

        // Tolerance threshold: 60% similarity required
        const TOLERANCE_THRESHOLD = 60;
        const isValid = similarityScore >= TOLERANCE_THRESHOLD;

        // Update record
        if (isValid) {
            const changeCount = similarityScore < 100 ? existingRecord.changeCount + 1 : existingRecord.changeCount;

            await this.prisma.hWIDRecord.update({
                where: { id: existingRecord.id },
                data: {
                    ...newComponents,
                    compositeFP: this.generateCompositeFingerprint(newComponents),
                    lastSeenAt: new Date(),
                    changeCount,
                },
            });
        }

        return {
            isValid,
            similarityScore,
            hwidRecord: existingRecord,
        };
    }

    /**
     * Detect if HWID belongs to a virtual machine
     */
    detectVirtualMachine(components: FingerprintComponents): { isVM: boolean; vmType?: string } {
        // Common VM indicators in CPU/BIOS
        const vmIndicators = [
            'VMWARE',
            'VBOX',
            'VIRTUALBOX',
            'KVM',
            'QEMU',
            'XEN',
            'HYPER-V',
            'PARALLELS',
        ];

        const combinedString = Object.values(components)
            .join('|')
            .toUpperCase();

        for (const indicator of vmIndicators) {
            if (combinedString.includes(indicator)) {
                return { isVM: true, vmType: indicator };
            }
        }

        return { isVM: false };
    }

    /**
     * Flag suspicious HWID for manual review
     */
    async flagHWID(hwidRecordId: string, reason: string) {
        await this.prisma.hWIDRecord.update({
            where: { id: hwidRecordId },
            data: {
                isFlagged: true,
                flagReason: reason,
            },
        });
    }
}
