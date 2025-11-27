import crypto from 'crypto';
import https from 'https';
import { BrokerConfig } from '../config/brokers';
import { Mt5Response } from './types/common';
import { UserInfo, UserAddParams, UserUpdateParams, UserBatchParams, UserChangePasswordParams, PasswordType } from '../modules/users/types/user.types';
import { OrderInfo } from '../modules/trading/types/order.types';
import { PositionInfo } from '../modules/trading/types/position.types';
import { PriceQuote, TickLastResponse } from '../modules/prices/types/price.types';
import { TradeBalanceParams, TradeBalanceResponse } from '../modules/trading/types/trade.types';

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

    // A helper to send raw JSON bodies (some MT5 endpoints expect JSON instead of x-www-form-urlencoded)
    private async requestJson<T>(
        path: string,
        method: 'GET' | 'POST',
        jsonBody?: any,
        retryCount = 0
    ): Promise<T> {
        await this.ensureAuth();

        let query = '';
        let body: string | undefined = undefined;

        if (jsonBody && method === 'GET') {
            const sp = new URLSearchParams();
            Object.entries(jsonBody).forEach(([k, v]) => {
                if (v !== undefined && v !== null) sp.append(k, String(v));
            });
            const paramStr = sp.toString();
            query = paramStr ? '?' + paramStr : '';
        } else if (jsonBody && method === 'POST') {
            body = JSON.stringify(jsonBody);
        }

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const init: RequestInit = { method, headers } as any;
            if (body) init.body = body;

            const resRaw = await this.fetchRaw(path + query, init);
            const res = JSON.parse(resRaw) as Mt5Response<T>;

            if (res.retcode !== '0 Done') {
                throw new Error(`MT5 Error: ${res.retcode}`);
            }

            return res.answer;
        } catch (error: any) {
            if (error.message?.includes('403') && retryCount === 0) {
                console.log('[AUTH] Got 403 error, resetting authentication and retrying...');
                this.isAuthenticated = false;
                this.cookies = '';
                return this.requestJson<T>(path, method, jsonBody, retryCount + 1);
            }

            if (error.message?.includes('MT5 Error') && error.message?.includes('Invalid')) {
                console.log('[AUTH] Got MT5 session error, resetting authentication for next request...');
                this.isAuthenticated = false;
                this.cookies = '';
            }

            throw error;
        }
    }

    private async requestJsonRaw<T>(
        path: string,
        method: 'GET' | 'POST',
        jsonBody?: any,
        retryCount = 0
    ): Promise<Mt5Response<T>> {
        await this.ensureAuth();

        let query = '';
        let body: string | undefined = undefined;

        if (jsonBody && method === 'GET') {
            const sp = new URLSearchParams();
            Object.entries(jsonBody).forEach(([k, v]) => {
                if (v !== undefined && v !== null) sp.append(k, String(v));
            });
            const paramStr = sp.toString();
            query = paramStr ? '?' + paramStr : '';
        } else if (jsonBody && method === 'POST') {
            body = JSON.stringify(jsonBody);
        }

        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            const init: RequestInit = { method, headers } as any;
            if (body) init.body = body;

            const resRaw = await this.fetchRaw(path + query, init);
            const res = JSON.parse(resRaw) as Mt5Response<T>;
            return res;
        } catch (error: any) {
            if (error.message?.includes('403') && retryCount === 0) {
                console.log('[AUTH] Got 403 error, resetting authentication and retrying...');
                this.isAuthenticated = false;
                this.cookies = '';
                return this.requestJsonRaw<T>(path, method, jsonBody, retryCount + 1);
            }

            throw error;
        }
    }

    // Return raw Mt5Response without throwing (useful when we want the retcode even if non-zero)
    private async requestRaw<T>(
        path: string,
        method: 'GET' | 'POST',
        params?: any,
        retryCount = 0
    ): Promise<Mt5Response<T>> {
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
            const init: RequestInit = { method };
            if (body) {
                init.body = body;
                init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            }

            const resRaw = await this.fetchRaw(path + query, init);
            const res = JSON.parse(resRaw) as Mt5Response<T>;
            return res;
        } catch (error: any) {
            if (error.message?.includes('403') && retryCount === 0) {
                console.log('[AUTH] Got 403 error, resetting authentication and retrying...');
                this.isAuthenticated = false;
                this.cookies = '';
                return this.requestRaw<T>(path, method, params, retryCount + 1);
            }
            throw error;
        }
    }

    async getUser(login: number): Promise<UserInfo> {
        return this.request<UserInfo>('/api/user/get', 'GET', { login });
    }

    async getUserGroup(login: number): Promise<string> {
        // The MT5 response includes: { retcode: '0 Done', answer: { Group: '...' } }
        const res = await this.request<{ Group: string }>('/api/user/group', 'GET', { login });
        return res?.Group ?? '';
    }

    async getUserGroupRaw(login: number): Promise<Mt5Response<{ Group: string }>> {
        return await this.requestRaw<{ Group: string }>('/api/user/group', 'GET', { login });
    }

    async getUserTotal(): Promise<number> {
        // Returns numeric total using standard request which throws on non-zero retcode
        const res = await this.request<{ Total: string | number }>('/api/user/total', 'GET');
        const anyRes: any = res;
        const possible = [anyRes?.Total, anyRes?.total, anyRes?.Answer?.Total, anyRes?.Answer?.total, anyRes?.answer?.Total, anyRes?.answer?.total];
        const found = possible.find(x => x !== undefined && x !== null);
        if (found === undefined) return 0;
        const totalNum = Number(String(found).replace(/[^0-9\-\.]/g, ''));
        return Number.isNaN(totalNum) ? 0 : totalNum;
    }

    async getUserTotalRaw(): Promise<Mt5Response<{ Total: string }>> {
        return await this.requestRaw<{ Total: string }>('/api/user/total', 'GET');
    }

    async getUserAccount(login: number): Promise<any> {
        return await this.request<any>('/api/user/account/get', 'GET', { login });
    }

    async getUserAccountRaw(login: number): Promise<Mt5Response<any>> {
        return await this.requestRaw<any>('/api/user/account/get', 'GET', { login });
    }

    async getUserLogins(groups: string[]): Promise<number[]> {
        if (!groups || groups.length === 0) return [];
        const groupParam = groups.join(',');
        const res = await this.request<string[]>('/api/user/logins', 'GET', { group: groupParam });
        if (!res || !Array.isArray(res)) return [];
        return res.map(s => Number(s)).filter(n => !isNaN(n));
    }

    async getUserLoginsRaw(groups: string[]): Promise<Mt5Response<string[]>> {
        const groupParam = (groups && groups.length) ? groups.join(',') : undefined;
        return await this.requestRaw<string[]>('/api/user/logins', 'GET', groupParam ? { group: groupParam } : undefined);
    }

    async getUserCertificate(login: number): Promise<string[]> {
        return await this.request<string[]>('/api/user/certificate/get', 'GET', { login });
    }

    async getUserCertificateRaw(login: number): Promise<Mt5Response<string[]>> {
        return await this.requestRaw<string[]>('/api/user/certificate/get', 'GET', { login });
    }

    async getUserOtpSecret(login: number): Promise<string> {
        const res = await this.request<{ OTP_SECRET: string }>('/api/user/otp_secret/get', 'GET', { login });
        const anyRes: any = res;
        // Accept various casing: OTP_SECRET / otp_secret
        const possible = [anyRes?.OTP_SECRET, anyRes?.otp_secret, anyRes?.Answer?.OTP_SECRET, anyRes?.Answer?.otp_secret, anyRes?.answer?.OTP_SECRET, anyRes?.answer?.otp_secret];
        const found = possible.find(x => x !== undefined && x !== null);
        return (found === undefined) ? '' : String(found);
    }

    async getUserOtpSecretRaw(login: number): Promise<Mt5Response<{ OTP_SECRET: string }>> {
        return await this.requestRaw<{ OTP_SECRET: string }>('/api/user/otp_secret/get', 'GET', { login });
    }

    async getUserCheckBalance(login: number, fixflag?: number): Promise<{ Balance?: any; Credit?: any }> {
        const params: any = { login };
        if (fixflag !== undefined && fixflag !== null) params.fixflag = Number(fixflag);
        const res = await this.request<{ Balance: any; Credit: any }>('/api/user/check_balance', 'GET', params);
        return res;
    }

    async getUserCheckBalanceRaw(login: number, fixflag?: number): Promise<Mt5Response<{ Balance: any; Credit: any }>> {
        const params: any = { login };
        if (fixflag !== undefined && fixflag !== null) params.fixflag = Number(fixflag);
        return await this.requestRaw<{ Balance: any; Credit: any }>('/api/user/check_balance', 'GET', params);
    }

    // Prices - Get latest tick(s) for symbol(s)
    async getTickLast(symbols: string | string[], trans_id?: number | string): Promise<TickLastResponse> {
        const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
        const params: any = { symbol: symbolParam };
        if (trans_id !== undefined && trans_id !== null) params.trans_id = trans_id;
        // Use raw request so we can return the trans_id as well
        const raw = await this.requestRaw<PriceQuote[]>('/api/tick/last', 'GET', params);
        return { trans_id: raw?.trans_id, answer: raw?.answer } as TickLastResponse;
    }

    async getTickLastRaw(symbols: string | string[], trans_id?: number | string): Promise<Mt5Response<PriceQuote[]>> {
        const symbolParam = Array.isArray(symbols) ? symbols.join(',') : symbols;
        const params: any = { symbol: symbolParam };
        if (trans_id !== undefined && trans_id !== null) params.trans_id = trans_id;
        return await this.requestRaw<PriceQuote[]>('/api/tick/last', 'GET', params);
    }

    async getOrder(ticket: number): Promise<OrderInfo> {
        return this.request<OrderInfo>('/api/order/get', 'GET', { ticket });
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

    async checkPassword(login: number, password: string, type: PasswordType): Promise<Mt5Response<any>> {
        // Use POST + JSON body (security best practice) and fallback on error
        const body = {
            Login: login,
            Type: type.toLowerCase(),        // MT5 expects lowercase!
            Password: password
        };

        // Try JSON POST first (preferred), then try GET query if 400 error, then try form POST as last resort
        // Try JSON POST first (preferred), then try GET with lowercase and uppercase keys, then try form POST
        const debug = process.env.DEBUG_MT5 === 'true';
        const log = (...args: any[]) => debug && console.warn('[Mt5Client]', ...args);

        try {
            return await this.requestJsonRaw<any>('/api/user/check_password', 'POST', body);
        } catch (err: any) {
            const msg = err.message || '';
            log('checkPassword: JSON POST failed:', msg);

            // If the server rejected JSON (400 or 415) or unknown error, try GET with lowercase then uppercase keys; then try POST form-encoded
            const tryGetLower = async () => this.requestRaw<any>('/api/user/check_password', 'GET', { login, type: type.toLowerCase(), password });
            const tryGetUpper = async () => this.requestRaw<any>('/api/user/check_password', 'GET', { Login: login, Type: type.toLowerCase(), Password: password });
            const tryFormLower = async () => this.requestRaw<any>('/api/user/check_password', 'POST', { login, type: type.toLowerCase(), password });
            const tryFormUpper = async () => this.requestRaw<any>('/api/user/check_password', 'POST', { Login: login, Type: type.toLowerCase(), Password: password });

            try {
                // First fallback: GET lowercase
                return await tryGetLower();
            } catch (err2: any) {
                log('checkPassword: GET lowercase failed:', err2.message || err2);
            }

            try {
                // Second fallback: GET uppercase
                return await tryGetUpper();
            } catch (err3: any) {
                log('checkPassword: GET uppercase failed:', err3.message || err3);
            }

            try {
                // Third fallback: POST form-encoded lowercase
                return await tryFormLower();
            } catch (err4: any) {
                log('checkPassword: POST form-encoded lowercase failed:', err4.message || err4);
            }

            // Last resort: POST form-encoded uppercase
            try {
                return await tryFormUpper();
            } catch (err5: any) {
                log('checkPassword: POST form-encoded uppercase failed:', err5.message || err5);
                // rethrow original error from JSON POST to keep context
                throw err;
            }
        }
        // MT5 returns retcode "0 Done" on correct password
        // On wrong password: "3006 Invalid account password" → still valid response!
        // So we only throw on real errors (auth, network, etc.)
        // → Do NOT throw if password is wrong!
    }

    async changePassword(params: UserChangePasswordParams): Promise<Mt5Response<any>> {
        // Build a JSON-friendly body to avoid sending password in URL-encoded query
        const body = {
            Login: params.login,
            Type: (String(params.type || '')).toLowerCase(),
            Password: params.password,
        };

        const debug = process.env.DEBUG_MT5 === 'true';
        const log = (...args: any[]) => debug && console.warn('[Mt5Client] changePassword', ...args);

        try {
            // Preferred method: JSON POST
            return await this.requestJsonRaw<any>('/api/user/change_password', 'POST', body);
        } catch (err: any) {
            log('changePassword: JSON POST failed:', err?.message || err);

            // Fallbacks: try GET with lowercase keys, GET uppercase, POST form-encoded lowercase, POST form-encoded uppercase
            const tryGetLower = async () => this.requestRaw<any>('/api/user/change_password', 'GET', { login: params.login, type: body.Type, password: params.password });
            const tryGetUpper = async () => this.requestRaw<any>('/api/user/change_password', 'GET', { Login: params.login, Type: body.Type, Password: params.password });
            const tryFormLower = async () => this.requestRaw<any>('/api/user/change_password', 'POST', { login: params.login, type: body.Type, password: params.password });
            const tryFormUpper = async () => this.requestRaw<any>('/api/user/change_password', 'POST', { Login: params.login, Type: body.Type, Password: params.password });

            try {
                return await tryGetLower();
            } catch (err2: any) {
                log('changePassword: GET lowercase failed:', err2?.message || err2);
            }
            try {
                return await tryGetUpper();
            } catch (err3: any) {
                log('changePassword: GET uppercase failed:', err3?.message || err3);
            }
            try {
                return await tryFormLower();
            } catch (err4: any) {
                log('changePassword: POST form-encoded lowercase failed:', err4?.message || err4);
            }
            try {
                return await tryFormUpper();
            } catch (err5: any) {
                log('changePassword: POST form-encoded uppercase failed:', err5?.message || err5);
                throw err; // rethrow original JSON error for context
            }
        }
    }

    async getOrderBatch(tickets: number[]): Promise<OrderInfo[]> {
        if (!tickets || tickets.length === 0) return [];
        return Promise.all(tickets.map(t => this.getOrder(t)));
    }

    async getOrderTotal(login: number): Promise<number> {
        // We need to be flexible with how the MT5 server returns the value (Total vs total, number vs string)
        const res = await this.request<any>('/api/order/get_total', 'GET', { login });
        // Look for several possible locations
        const possible = [
            res?.Total,
            res?.total,
            res?.Answer?.Total,
            res?.Answer?.total,
            res?.answer?.Total,
            res?.answer?.total,
        ];

        const found = possible.find(x => x !== undefined && x !== null);
        if (found === undefined) {
            // Log for debug in development — helps identify why total was 0
            console.warn('[Mt5Client] getOrderTotal: no Total found in response', res);
            return 0;
        }

        const totalNum = Number(String(found).replace(/[^0-9\-\.]/g, ''));
        return Number.isNaN(totalNum) ? 0 : totalNum;
    }

    async getOrderTotalRaw(login: number): Promise<any> {
        return await this.request<any>('/api/order/get_total', 'GET', { login });
    }

    // History endpoints
    async getHistoryOrder(ticket: number): Promise<OrderInfo> {
        return this.request<OrderInfo>('/api/history/get', 'GET', { ticket });
    }

    async getHistoryOrderBatch(tickets: number[]): Promise<OrderInfo[]> {
        if (!tickets || tickets.length === 0) return [];
        return Promise.all(tickets.map(t => this.getHistoryOrder(t)));
    }

    // Position endpoints
    async getPosition(login: number, symbol: string): Promise<PositionInfo> {
        return this.request<PositionInfo>('/api/position/get', 'GET', { login, symbol });
    }

    async getPositionBatch(login: number, symbol: string): Promise<PositionInfo[]> {
        // Some servers may return a list for hedging accounts
        return this.request<PositionInfo[]>('/api/position/get_batch', 'GET', { login, symbol });
    }

    // Trade endpoints (deposit/withdraw)
    async tradeBalance(params: TradeBalanceParams): Promise<TradeBalanceResponse> {
        // This will call /api/trade/balance (GET if query params provided, POST if body provided)
        return await this.request<TradeBalanceResponse>('/api/trade/balance', 'GET', params);
    }
}
