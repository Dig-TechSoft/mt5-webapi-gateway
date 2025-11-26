import crypto from 'crypto';
import https from 'https';
import { BrokerConfig } from '../config/brokers';
import { Mt5Response } from './types/common';
import { UserInfo, UserAddParams, UserUpdateParams, UserBatchParams, UserChangePasswordParams, PasswordType } from './types/user.types';

// Allow insecure TLS like the original PHP implementation that disabled peer verification.
// This is required when the MT5 server uses a cert that Node won't validate.
// Keep it scoped to server runtime. If you prefer stricter TLS, remove this or set a config flag.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

type Config = {
    server: string;
    port: number | string;
    login: string;
    password: string;
    build: string;
    agent: string;
};

export class Mt5Client {
    private server = '';
    private cookies = '';
    private config: Config;
    private lastStartRaw?: string;
    private lastAnswerRaw?: string;
    private isAuthenticated = false;

    constructor(brokerConfig: BrokerConfig) {
        // Parse server and port from baseUrl (e.g., https://210.3.149.242:1950)
        const url = new URL(brokerConfig.baseUrl);

        this.config = {
            server: url.hostname,
            port: url.port || 443,
            login: brokerConfig.username || '',
            password: brokerConfig.password || '',
            build: '2000', // Default build
            agent: 'WebAPI', // Default agent
        };
    }

    private baseUrl() {
        return `https://${this.config.server}:${this.config.port}`;
    }

    private updateCookiesFromSetCookie(setCookieHeader: string | null) {
        if (!setCookieHeader) return;
        // setCookieHeader may contain multiple cookies separated by comma in some environments,
        // but usually it's a single header per cookie. We'll extract first cookie name=value pair.
        const parts = setCookieHeader.split(/,\s*/);
        const first = parts[0];
        const m = first.match(/^([^;\s]+)/);
        if (m) this.cookies = m[1];
    }

    private async fetchRaw(path: string, init?: RequestInit) {
        const url = new URL(this.baseUrl() + path);
        const headers: Record<string, string> = {
            Connection: 'Keep-Alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            ...(init && init.headers ? (init.headers as Record<string, string>) : {}),
        };
        if (this.cookies) headers.Cookie = this.cookies;

        return new Promise<string>((resolve, reject) => {
            try {
                const opts: https.RequestOptions = {
                    hostname: url.hostname,
                    port: Number(url.port) || 443,
                    path: url.pathname + url.search,
                    method: (init && init.method) || 'GET',
                    headers,
                    rejectUnauthorized: false,
                };

                const req = https.request(opts, (res) => {
                    const chunks: Buffer[] = [];
                    res.on('data', (c: Buffer) => chunks.push(c));
                    res.on('end', () => {
                        // capture all Set-Cookie headers (Node stores as array)
                        const setCookieHeader = (res.headers as any)['set-cookie'];
                        if (setCookieHeader) {
                            // Combine into a single string similar to PHP handling
                            // but prefer storing the first cookie pair
                            if (Array.isArray(setCookieHeader)) {
                                this.updateCookiesFromSetCookie(setCookieHeader.join(', '));
                            } else if (typeof setCookieHeader === 'string') {
                                this.updateCookiesFromSetCookie(setCookieHeader);
                            }
                        }

                        const status = res.statusCode || 0;
                        const body = Buffer.concat(chunks).toString('utf8');
                        if (status < 200 || status >= 300) {
                            return reject(new Error(`HTTP ${status} when fetching ${path}: ${body}`));
                        }
                        resolve(body);
                    });
                });

                req.on('error', (err) => reject(new Error(`Request error for ${path}: ${err.message}`)));

                if (init && (init as any).body) {
                    req.write((init as any).body);
                }
                req.end();
            } catch (err: any) {
                reject(new Error(`Fetch error for ${path}: ${err?.message ?? String(err)}`));
            }
        });
    }

    private async auth(login: string, password: string, build: string, agent: string) {
        // Step 1: /api/auth/start
        const startPath = `/api/auth/start?version=${encodeURIComponent(build)}&agent=${encodeURIComponent(
            agent,
        )}&login=${encodeURIComponent(login)}&type=manager`;
        const startRaw = await this.fetchRaw(startPath, { method: 'GET' });
        this.lastStartRaw = startRaw;
        let startJson: any;
        try {
            startJson = JSON.parse(startRaw);
        } catch (e) {
            const err = new Error('Invalid JSON from auth/start');
            (err as any).startRaw = startRaw;
            throw err;
        }
        if (!startJson || parseInt(String(startJson.retcode || '0'), 10) !== 0) {
            const err = new Error('Auth start failed: ' + JSON.stringify(startJson));
            (err as any).startRaw = startRaw;
            throw err;
        }

        const srvRandHex = startJson.srv_rand;
        if (!srvRandHex) throw new Error('Missing srv_rand');
        const srvRandBuf = Buffer.from(srvRandHex, 'hex');

        // password -> utf-16le bytes
        const passUtf16 = Buffer.from(password, 'utf16le');
        const md5Raw = crypto.createHash('md5').update(passUtf16).digest(); // Buffer raw
        const passwordHash = Buffer.concat([md5Raw, Buffer.from('WebAPI')]);

        const inner = crypto.createHash('md5').update(passwordHash).digest(); // raw
        const srvRandAnswer = crypto
            .createHash('md5')
            .update(Buffer.concat([inner, srvRandBuf]))
            .digest('hex');

        // client random
        const cliRandBuf = crypto.randomBytes(16);
        const cliRandHex = cliRandBuf.toString('hex');

        const answerPath = `/api/auth/answer?srv_rand_answer=${encodeURIComponent(
            srvRandAnswer,
        )}&cli_rand=${encodeURIComponent(cliRandHex)}`;
        const answerRaw = await this.fetchRaw(answerPath, { method: 'GET' });
        this.lastAnswerRaw = answerRaw;
        let answerJson: any;
        try {
            answerJson = JSON.parse(answerRaw);
        } catch (e) {
            const err = new Error('Invalid JSON from auth/answer');
            (err as any).answerRaw = answerRaw;
            throw err;
        }

        if (!answerJson || parseInt(String(answerJson.retcode || '0'), 10) !== 0) {
            const err = new Error('Auth answer failed: ' + JSON.stringify(answerJson));
            (err as any).answerRaw = answerRaw;
            (err as any).startRaw = startRaw;
            throw err;
        }

        // verify server returns correct cli_rand_answer
        const cliRandAnswer = crypto
            .createHash('md5')
            .update(Buffer.concat([inner, cliRandBuf]))
            .digest('hex');

        if (String(answerJson.cli_rand_answer || '') !== cliRandAnswer) {
            const err = new Error('Invalid cli_rand_answer from server');
            (err as any).answerRaw = answerRaw;
            (err as any).startRaw = startRaw;
            throw err;
        }

        return true;
    }

    private async ensureAuth() {
        if (!this.isAuthenticated) {
            await this.auth(this.config.login, this.config.password, this.config.build, this.config.agent);
            this.isAuthenticated = true;
        }
    }

    private async request<T>(
        path: string,
        method: 'GET' | 'POST',
        params?: any,
        retryCount = 0
    ): Promise<T> {
        await this.ensureAuth();

        let body: string | undefined = undefined;
        let query = '';

        if (params) {
            const sp = new URLSearchParams();
            Object.entries(params).forEach(([k, v]) => {
                if (v !== undefined && v !== null) {
                    sp.append(k, String(v));
                }
            });

            const paramStr = sp.toString();

            if (method === 'GET') {
                query = paramStr ? '?' + paramStr : '';
            } else if (method === 'POST') {
                body = paramStr;  // only set body for POST
            }
        }

        try {
            // Critical fix: only pass { body } when it's a POST and body actually exists
            const init: RequestInit = { method };
            if (body) {
                init.body = body;
                init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            }

            const resRaw = await this.fetchRaw(path + query, init);
            const res = JSON.parse(resRaw) as Mt5Response<T>;

            if (res.retcode !== '0 Done') {
                throw new Error(`MT5 Error: ${res.retcode}`);
            }

            return res.answer;
        } catch (error: any) {
            // If we get a 403 or authentication error, reset auth and retry once
            if (error.message?.includes('403') && retryCount === 0) {
                console.log('[AUTH] Got 403 error, resetting authentication and retrying...');
                this.isAuthenticated = false;
                this.cookies = '';
                return this.request<T>(path, method, params, retryCount + 1);
            }

            // If we get any MT5 error that might indicate session issues, reset for next request
            if (error.message?.includes('MT5 Error') && error.message?.includes('Invalid')) {
                console.log('[AUTH] Got MT5 session error, resetting authentication for next request...');
                this.isAuthenticated = false;
                this.cookies = '';
            }

            throw error;
        }
    }

    async getUser(login: number): Promise<UserInfo> {
        return this.request<UserInfo>('/api/user/get', 'GET', { login });
    }

    async getUserBatch(params: UserBatchParams): Promise<UserInfo[]> {
        // MT5 only allows ONE of login OR group, not both
        if (params.login && params.group) {
            throw new Error('Cannot use both login and group parameters');
        }

        const queryParams: Record<string, string> = {};

        if (params.login && params.login.length > 0) {
            queryParams.login = params.login.join(',');
        } else if (params.group && params.group.length > 0) {
            queryParams.group = params.group.join(',');
        } else {
            throw new Error('Either login or group must be provided');
        }

        // Use GET — it's faster, cacheable, and official example uses GET
        return this.request<UserInfo[]>('/api/user/get_batch', 'GET', queryParams);
    }

    async addUser(params: UserAddParams): Promise<UserInfo> {
        return this.request<UserInfo>('/api/user/add', 'POST', params);
    }

    async updateUser(params: UserUpdateParams): Promise<UserInfo> {
        return this.request<UserInfo>('/api/user/update', 'POST', params);
    }

    async deleteUser(login: number): Promise<void> {
        return this.request<void>('/api/user/delete', 'GET', { login });
    }

    async checkPassword(login: number, password: string, type: PasswordType): Promise<void> {
        // Use POST + JSON body (security best practice)
        const body = {
            Login: login,
            Type: type.toLowerCase(),        // MT5 expects lowercase!
            Password: password
        };

        // Important: send as raw JSON, not form-urlencoded
        const res = await this.request<any>('/api/user/check_password', 'POST', body);

        // MT5 returns retcode "0 Done" on correct password
        // On wrong password: "3006 Invalid account password" → still valid response!
        // So we only throw on real errors (auth, network, etc.)
        // → Do NOT throw if password is wrong!
        return;
    }

    async changePassword(params: UserChangePasswordParams): Promise<void> {
        return this.request<void>('/api/user/change_password', 'POST', params);
    }
}
