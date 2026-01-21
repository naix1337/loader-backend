import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface KeyAuthLoginResponse {
    success: boolean;
    message?: string;
    info?: {
        username: string;
        subscriptions: any[];
        ip: string;
        hwid: string;
        createdate: string;
        lastlogin: string;
    };
}

export interface KeyAuthLicenseResponse {
    success: boolean;
    message?: string;
}

@Injectable()
export class KeyAuthService {
    private readonly apiClient: AxiosInstance;
    private readonly ownerId: string;
    private readonly appSecret: string;
    private sessionId: string;

    constructor(private config: ConfigService) {
        this.ownerId = this.config.get<string>('KEYAUTH_OWNER_ID');
        this.appSecret = this.config.get<string>('KEYAUTH_APP_SECRET');
        const apiUrl = this.config.get<string>('KEYAUTH_API_URL');

        this.apiClient = axios.create({
            baseURL: apiUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Initialize session
        this.initSession();
    }

    private async initSession() {
        try {
            const response = await this.apiClient.post('', {
                type: 'init',
                name: this.ownerId,
                ownerid: this.ownerId,
            });

            if (response.data.success) {
                this.sessionId = response.data.sessionid;
                console.log('✓ KeyAuth session initialized');
            }
        } catch (error) {
            console.error('✗ KeyAuth session initialization failed:', error.message);
        }
    }

    /**
     * Verify user login via KeyAuth.cc
     */
    async verifyLogin(
        username: string,
        password: string,
        hwid: string,
    ): Promise<KeyAuthLoginResponse> {
        try {
            const response = await this.apiClient.post('', {
                type: 'login',
                username,
                pass: password,
                hwid,
                sessionid: this.sessionId,
                name: this.ownerId,
                ownerid: this.ownerId,
            });

            return response.data;
        } catch (error) {
            throw new HttpException(
                'KeyAuth login verification failed',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
    }

    /**
     * Verify license key via KeyAuth.cc
     */
    async verifyLicense(
        licenseKey: string,
        hwid: string,
    ): Promise<KeyAuthLicenseResponse> {
        try {
            const response = await this.apiClient.post('', {
                type: 'license',
                key: licenseKey,
                hwid,
                sessionid: this.sessionId,
                name: this.ownerId,
                ownerid: this.ownerId,
            });

            return response.data;
        } catch (error) {
            throw new HttpException(
                'KeyAuth license verification failed',
                HttpStatus.SERVICE_UNAVAILABLE,
            );
        }
    }

    /**
     * Check if user is banned
     */
    async checkBanStatus(username: string): Promise<boolean> {
        try {
            const response = await this.apiClient.post('', {
                type: 'checkblacklist',
                hwid: username, // KeyAuth uses hwid field for username check
                sessionid: this.sessionId,
                name: this.ownerId,
                ownerid: this.ownerId,
            });

            return response.data.success === false; // If success is false, user is banned
        } catch (error) {
            return false;
        }
    }

    /**
     * Get user subscription info
     */
    async getUserInfo(username: string): Promise<any> {
        try {
            const response = await this.apiClient.post('', {
                type: 'fetchalldata',
                username,
                sessionid: this.sessionId,
                name: this.ownerId,
                ownerid: this.ownerId,
            });

            return response.data;
        } catch (error) {
            return null;
        }
    }

    /**
     * Validate session token from KeyAuth
     */
    async validateSession(sessionToken: string): Promise<boolean> {
        try {
            const response = await this.apiClient.post('', {
                type: 'check',
                sessionid: sessionToken,
                name: this.ownerId,
                ownerid: this.ownerId,
            });

            return response.data.success === true;
        } catch (error) {
            return false;
        }
    }
}
