import { Request, Response } from 'express';
import { UserService } from './user.service';
import { getMt5Client } from '../../mt5/instances';
import type { PasswordType } from './types/user.types';

export class UserController {
    static async getUser(req: Request, res: Response) {
        const { login } = req.query;
        try {
            const mt5 = getMt5Client();
            const service = new UserService(mt5);
            const user = await service.getUser(Number(login));
            res.json({ success: true, data: user });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getUserBatch(req: Request, res: Response) {

        // Accept params from query (GET) or body (POST)
        const rawLogin = req.query.login ?? req.body.login;
        const rawGroup = req.query.group ?? req.body.group;

        // Convert to arrays
        const login = rawLogin
            ? Array.isArray(rawLogin)
                ? rawLogin.map(Number)
                : String(rawLogin).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n))
            : undefined;

        const group = rawGroup
            ? Array.isArray(rawGroup)
                ? rawGroup.map(String)
                : String(rawGroup).split(',').map(s => s.trim()).filter(Boolean)
            : undefined;

        if (!login && !group) {
            return res.status(400).json({
                success: false,
                error: 'Either "login" or "group" parameter is required',
            });
        }

        if (login && group) {
            return res.status(400).json({
                success: false,
                error: 'Cannot use both "login" and "group" at the same time',
            });
        }

        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const users = await service.getUserBatch({ login, group });
            res.json({ success: true, data: users });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async addUser(req: Request, res: Response) {
        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const user = await service.addUser(req.body);
            res.json({ success: true, data: user });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async updateUser(req: Request, res: Response) {
        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const user = await service.updateUser(req.body);
            res.json({ success: true, data: user });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async deleteUser(req: Request, res: Response) {
        // Accept login from body (POST) OR query (GET)
        const login = req.body.login ?? req.query.login;

        if (!login) {
            return res.status(400).json({
                success: false,
                error: 'Missing login parameter',
            });
        }

        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            await service.deleteUser(Number(login));
            res.json({ success: true });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }

    static async checkPassword(req: Request, res: Response) {

        // Support BOTH query params (GET) and body (POST)
        // Accept both lowercase and uppercase JSON keys (e.g., Login/Type/Password)
        const loginRaw = req.body?.Login ?? req.body?.login ?? req.query?.login;
        const passwordRaw = req.body?.Password ?? req.body?.password ?? req.query?.password;
        let typeRaw = (req.body?.Type ?? req.body?.type ?? req.query?.type) as string;

        // Validate required fields
        const login = loginRaw;
        const password = passwordRaw;
        let type = typeRaw;

        if (!login || !password || !type) {
            return res.status(400).json({
                success: false,
                error: 'Missing login, password, or type'
            });
        }

        // Normalize and validate type
        type = type.toLowerCase();
        const validTypes: PasswordType[] = ['main', 'investor', 'api'];
        if (!validTypes.includes(type as PasswordType)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid type. Must be: main, investor, or api'
            });
        }

        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const raw = await service.checkPassword(
                Number(login),
                String(password),
                type as PasswordType
            );

            // If caller requested raw MT5 response, return it
            const includeRaw = String(req.query.raw ?? req.body.raw ?? 'false').toLowerCase() === 'true';
            if (includeRaw) return res.json(raw);

            // If password correct (retcode 0), return previous envelope
            if (raw && String(raw.retcode || '').startsWith('0')) {
                return res.json({
                    success: true,
                    valid: true,
                    message: 'Password is correct',
                    retcode: raw.retcode
                });
            }

            // For wrong password or other MT5 non-0 retcodes, return raw retcode as JSON per MT5 example
            return res.json({ retcode: raw?.retcode ?? 'Unknown' });

        } catch (err: any) {
            const msg = err.message || '';
            return res.status(500).json({ success: false, error: msg });
        }
    }

    static async getUserGroup(req: Request, res: Response) {
        // Accept both query (GET) and body (POST)
        const loginRaw = req.body?.Login ?? req.body?.login ?? req.query?.login;

        if (!loginRaw) {
            return res.status(400).json({ success: false, error: 'Missing login parameter' });
        }

        const login = Number(loginRaw);
        if (isNaN(login)) {
            return res.status(400).json({ success: false, error: 'Invalid login parameter' });
        }

        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const raw = await service.getUserGroupRaw(login);
            // Return raw MT5 response format: { retcode, answer: { Group: ... } }
            return res.json(raw);
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getUserTotal(req: Request, res: Response) {
        // No params required
        const mt5 = getMt5Client();
        const service = new UserService(mt5);
        try {
            const raw = await service.getUserTotalRaw();
            return res.json(raw);
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getUserAccount(req: Request, res: Response) {
        // Accept GET query ?login=... or POST body { Login: ... }
        const loginRaw = req.body?.Login ?? req.body?.login ?? req.query?.login;

        if (!loginRaw) {
            return res.status(400).json({ success: false, error: 'Missing login parameter' });
        }

        const login = Number(loginRaw);
        if (isNaN(login)) {
            return res.status(400).json({ success: false, error: 'Invalid login parameter' });
        }

        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const raw = await service.getUserAccountRaw(login);
            return res.json(raw);
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getUserCertificate(req: Request, res: Response) {
        const loginRaw = req.body?.Login ?? req.body?.login ?? req.query?.login;

        if (!loginRaw) {
            return res.status(400).json({ success: false, error: 'Missing login parameter' });
        }

        const login = Number(loginRaw);
        if (isNaN(login)) {
            return res.status(400).json({ success: false, error: 'Invalid login parameter' });
        }

        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const raw = await service.getUserCertificateRaw(login);
            return res.json(raw);
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getUserOtpSecret(req: Request, res: Response) {
        const loginRaw = req.body?.Login ?? req.body?.login ?? req.query?.login;

        if (!loginRaw) {
            return res.status(400).json({ success: false, error: 'Missing login parameter' });
        }

        const login = Number(loginRaw);
        if (isNaN(login)) {
            return res.status(400).json({ success: false, error: 'Invalid login parameter' });
        }

        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const raw = await service.getUserOtpSecretRaw(login);
            return res.json(raw);
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getUserCheckBalance(req: Request, res: Response) {
        const loginRaw = req.body?.Login ?? req.body?.login ?? req.query?.login;
        const fixflagRaw = req.body?.fixflag ?? req.body?.FixFlag ?? req.query?.fixflag ?? req.query?.FixFlag;

        if (!loginRaw) {
            return res.status(400).json({ success: false, error: 'Missing login parameter' });
        }

        const login = Number(loginRaw);
        if (isNaN(login)) {
            return res.status(400).json({ success: false, error: 'Invalid login parameter' });
        }

        const fixflag = fixflagRaw !== undefined && fixflagRaw !== null ? Number(fixflagRaw) : undefined;
        if (fixflag !== undefined && isNaN(fixflag)) {
            return res.status(400).json({ success: false, error: 'Invalid fixflag parameter' });
        }

        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const raw = await service.getUserCheckBalanceRaw(login, fixflag);
            return res.json(raw);
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async changePassword(req: Request, res: Response) {
        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            await service.changePassword(req.body);
            res.json({ success: true });
        } catch (err: any) {
            res.status(400).json({ success: false, error: err.message });
        }
    }
}
