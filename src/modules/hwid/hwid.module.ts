import { Module } from '@nestjs/common';
import { FingerprintService } from './fingerprint.service';
import { RiskScoringService } from './risk-scoring.service';
import { SecurityModule } from '../security/security.module';

@Module({
    imports: [SecurityModule],
    providers: [FingerprintService, RiskScoringService],
    exports: [FingerprintService, RiskScoringService],
})
export class HwidModule { }
