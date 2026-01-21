import { Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { ReplayProtectionService } from './replay-protection.service';

@Module({
    providers: [EncryptionService, ReplayProtectionService],
    exports: [EncryptionService, ReplayProtectionService],
})
export class SecurityModule { }
