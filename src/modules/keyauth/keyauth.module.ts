import { Module } from '@nestjs/common';
import { KeyAuthService } from './keyauth.service';

@Module({
    providers: [KeyAuthService],
    exports: [KeyAuthService],
})
export class KeyAuthModule { }
