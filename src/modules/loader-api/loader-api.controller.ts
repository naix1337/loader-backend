import { Controller, Post, Body, Ip, Headers, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LoaderApiService } from './loader-api.service';
import { HandshakeService } from './handshake.service';

export class HandshakeRequestDto {
    deviceFingerprint: string;
}

export class ChallengeResponseDto {
    challenge: string;
    signedChallenge: string;
    clientPublicKey: string;
}

export class LoginRequestDto {
    username: string;
    password: string;
    sessionToken: string;
    encryptedPayload: string;
    iv: string;
    tag: string;
}

export class HeartbeatRequestDto {
    sessionToken: string;
    encryptedPayload: string;
    iv: string;
    tag: string;
}

@Controller('api/loader')
@ApiTags('loader')
export class LoaderApiController {
    constructor(
        private loaderApiService: LoaderApiService,
        private handshakeService: HandshakeService,
    ) { }

    @Post('handshake')
    @ApiOperation({ summary: 'Initiate handshake with C++ loader' })
    async handshake(
        @Body() body: HandshakeRequestDto,
        @Ip() ip: string,
    ) {
        return this.handshakeService.initiateHandshake(body.deviceFingerprint, ip);
    }

    @Post('challenge-response')
    @ApiOperation({ summary: 'Complete handshake with signed challenge' })
    async challengeResponse(
        @Body() body: ChallengeResponseDto,
        @Ip() ip: string,
    ) {
        return this.handshakeService.verifyChallengeResponse(
            body.challenge,
            body.signedChallenge,
            body.clientPublicKey,
            ip,
        );
    }

    @Post('login')
    @ApiOperation({ summary: 'User login from C++ loader' })
    async login(
        @Body() body: LoginRequestDto,
        @Ip() ip: string,
        @Headers('user-agent') userAgent: string,
    ) {
        return this.loaderApiService.login(
            body.username,
            body.password,
            body.sessionToken,
            body.encryptedPayload,
            body.iv,
            body.tag,
            ip,
            userAgent,
        );
    }

    @Post('verify')
    @ApiOperation({ summary: 'Verify session and license status' })
    async verify(
        @Body() body: { sessionToken: string; encryptedPayload: string; iv: string; tag: string },
    ) {
        return this.loaderApiService.verifySession(
            body.sessionToken,
            body.encryptedPayload,
            body.iv,
            body.tag,
        );
    }

    @Post('heartbeat')
    @ApiOperation({ summary: 'Send heartbeat to maintain session' })
    async heartbeat(
        @Body() body: HeartbeatRequestDto,
        @Ip() ip: string,
    ) {
        return this.loaderApiService.heartbeat(
            body.sessionToken,
            body.encryptedPayload,
            body.iv,
            body.tag,
            ip,
        );
    }

    @Post('license')
    @ApiOperation({ summary: 'Activate license key' })
    async activateLicense(
        @Body() body: { licenseKey: string; encryptedPayload: string; iv: string; tag: string },
    ) {
        return this.loaderApiService.activateLicense(
            body.licenseKey,
            body.encryptedPayload,
            body.iv,
            body.tag,
        );
    }
}
