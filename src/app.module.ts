import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { KeyAuthModule } from './modules/keyauth/keyauth.module';
import { LicensingModule } from './modules/licensing/licensing.module';
import { HwidModule } from './modules/hwid/hwid.module';
import { SecurityModule } from './modules/security/security.module';
import { LoaderApiModule } from './modules/loader-api/loader-api.module';
import { ForumModule } from './modules/forum/forum.module';
import { AdminModule } from './modules/admin/admin.module';
import { RealtimeModule } from './modules/realtime/realtime.module';

@Module({
    imports: [
        // Configuration
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),

        // Rate Limiting
        ThrottlerModule.forRoot([
            {
                ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60000,
                limit: parseInt(process.env.RATE_LIMIT_MAX) || 100,
            },
        ]),

        // Core Modules
        PrismaModule,
        AuthModule,
        KeyAuthModule,
        LicensingModule,
        HwidModule,
        SecurityModule,
        LoaderApiModule,
        ForumModule,
        AdminModule,
        RealtimeModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
