import { Module } from '@nestjs/common';
import { LoaderApiController } from './loader-api.controller';
import { LoaderApiService } from './loader-api.service';
import { HandshakeService } from './handshake.service';
import { SecurityModule } from '../security/security.module';
import { KeyAuthModule } from '../keyauth/keyauth.module';
import { HwidModule } from '../hwid/hwid.module';

@Module({
    imports: [SecurityModule, KeyAuthModule, HwidModule],
    controllers: [LoaderApiController],
    providers: [LoaderApiService, HandshakeService],
    exports: [LoaderApiService],
})
export class LoaderApiModule { }
