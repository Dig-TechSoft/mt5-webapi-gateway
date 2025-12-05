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

    /**
     * Add a new user account to the MT5 trade server.
     * 
     * Accepts parameters from:
     * - Query string: login, group, name, leverage, rights, company, language, city, state, etc.
     * - Request body (JSON): PassMain, PassInvestor, PhonePassword, MQID, Company, Country, City, etc.
     * 
     * Body parameters override query parameters.
     * 
     * Required fields: PassMain (or pass_main), PassInvestor (or pass_investor), Group (or group), Name (or name)
     * 
     * Response format:
     * {
     *   "retcode": "0 Done",
     *   "answer": { user details }
     * }
     */
    static async addUser(req: Request, res: Response) {
        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            // Merge query parameters with body (body takes precedence)
            // Support both lowercase (query-style) and PascalCase (JSON-style) parameter names
            const params: any = {};

            // Extract from query string (lowercase keys)
            const q = req.query;
            if (q.login) params.Login = String(q.login);
            if (q.pass_main) params.PassMain = String(q.pass_main);
            if (q.pass_investor) params.PassInvestor = String(q.pass_investor);
            if (q.rights) params.Rights = String(q.rights);
            if (q.group) params.Group = String(q.group);
            if (q.name) params.Name = String(q.name);
            if (q.company) params.Company = String(q.company);
            if (q.language) params.Language = String(q.language);
            if (q.country) params.Country = String(q.country);
            if (q.city) params.City = String(q.city);
            if (q.state) params.State = String(q.state);
            if (q.zipcode) params.ZipCode = String(q.zipcode);
            if (q.address) params.Address = String(q.address);
            if (q.phone) params.Phone = String(q.phone);
            if (q.email) params.Email = String(q.email);
            if (q.id) params.ID = String(q.id);
            if (q.status) params.Status = String(q.status);
            if (q.comment) params.Comment = String(q.comment);
            if (q.color) params.Color = String(q.color);
            if (q.pass_phone) params.PhonePassword = String(q.pass_phone);
            if (q.leverage) params.Leverage = Number(q.leverage);
            if (q.account) params.Account = String(q.account);
            if (q.agent) params.Agent = String(q.agent);

            // Extract from body (both lowercase and PascalCase supported)
            const b = req.body || {};
            if (b.Login || b.login) params.Login = String(b.Login || b.login);
            if (b.PassMain || b.pass_main) params.PassMain = String(b.PassMain || b.pass_main);
            if (b.PassInvestor || b.pass_investor) params.PassInvestor = String(b.PassInvestor || b.pass_investor);
            if (b.Rights || b.rights) params.Rights = String(b.Rights || b.rights);
            if (b.Group || b.group) params.Group = String(b.Group || b.group);
            if (b.Name || b.name) params.Name = String(b.Name || b.name);
            if (b.Company || b.company) params.Company = String(b.Company || b.company);
            if (b.Language || b.language) params.Language = String(b.Language || b.language);
            if (b.Country || b.country) params.Country = String(b.Country || b.country);
            if (b.City || b.city) params.City = String(b.City || b.city);
            if (b.State || b.state) params.State = String(b.State || b.state);
            if (b.ZipCode || b.zipcode) params.ZipCode = String(b.ZipCode || b.zipcode);
            if (b.Address || b.address) params.Address = String(b.Address || b.address);
            if (b.Phone || b.phone) params.Phone = String(b.Phone || b.phone);
            if (b.Email || b.email) params.Email = String(b.Email || b.email);
            if (b.ID || b.id) params.ID = String(b.ID || b.id);
            if (b.Status || b.status) params.Status = String(b.Status || b.status);
            if (b.Comment || b.comment) params.Comment = String(b.Comment || b.comment);
            if (b.Color || b.color) params.Color = String(b.Color || b.color);
            if (b.PhonePassword || b.pass_phone) params.PhonePassword = String(b.PhonePassword || b.pass_phone);
            if (b.Leverage !== undefined || b.leverage !== undefined) params.Leverage = Number(b.Leverage ?? b.leverage);
            if (b.Account || b.account) params.Account = String(b.Account || b.account);
            if (b.Agent || b.agent) params.Agent = String(b.Agent || b.agent);
            if (b.MQID) params.MQID = String(b.MQID);

            // Validate required fields
            const missingFields: string[] = [];
            if (!params.PassMain) missingFields.push('PassMain (or pass_main)');
            if (!params.PassInvestor) missingFields.push('PassInvestor (or pass_investor)');
            if (!params.Group) missingFields.push('Group (or group)');
            if (!params.Name) missingFields.push('Name (or name)');

            if (missingFields.length > 0) {
                return res.status(400).json({
                    retcode: '3 Invalid request',
                    error: `Missing required fields: ${missingFields.join(', ')}`
                });
            }

            // Set default leverage if not provided (MT5 requires it)
            if (params.Leverage === undefined || params.Leverage === null || isNaN(params.Leverage)) {
                params.Leverage = 100; // Default leverage
            }

            const user = await service.addUser(params);

            // Return in MT5 Web API response format
            res.json({
                retcode: '0 Done',
                answer: user
            });
        } catch (err: any) {
            // Return error in MT5 format
            res.status(400).json({
                retcode: err.message || 'Error',
                error: err.message
            });
        }
    }

    /**
     * Update a user account on the MT5 trade server.
     * 
     * Required fields: login (in query or body)
     * 
     * Response format:
     * {
     *   "retcode": "0 Done",
     *   "answer": { user details }
     * }
     */
    static async updateUser(req: Request, res: Response) {
        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            // Merge query parameters with body (body takes precedence)
            const params: any = {};

            // Extract from query string (lowercase keys)
            const q = req.query;
            if (q.login) params.login = q.login;
            if (q.rights) params.rights = q.rights;
            if (q.group) params.group = q.group;
            if (q.name) params.name = q.name;
            if (q.company) params.company = q.company;
            if (q.language) params.language = q.language;
            if (q.country) params.country = q.country;
            if (q.city) params.city = q.city;
            if (q.state) params.state = q.state;
            if (q.zipcode) params.zipcode = q.zipcode;
            if (q.address) params.address = q.address;
            if (q.phone) params.phone = q.phone;
            if (q.email) params.email = q.email;
            if (q.id) params.id = q.id;
            if (q.status) params.status = q.status;
            if (q.comment) params.comment = q.comment;
            if (q.color) params.color = q.color;
            if (q.pass_phone) params.pass_phone = q.pass_phone;
            if (q.leverage) params.leverage = q.leverage;
            if (q.account) params.account = q.account;
            if (q.agent) params.agent = q.agent;

            // Extract from body (both lowercase and PascalCase supported)
            const b = req.body || {};
            if (b.Login || b.login) params.Login = b.Login || b.login;
            if (b.Rights || b.rights) params.Rights = b.Rights || b.rights;
            if (b.Group || b.group) params.Group = b.Group || b.group;
            if (b.Name || b.name) params.Name = b.Name || b.name;
            if (b.Company || b.company) params.Company = b.Company || b.company;
            if (b.Language || b.language) params.Language = b.Language || b.language;
            if (b.Country || b.country) params.Country = b.Country || b.country;
            if (b.City || b.city) params.City = b.City || b.city;
            if (b.State || b.state) params.State = b.State || b.state;
            if (b.ZipCode || b.zipcode) params.ZipCode = b.ZipCode || b.zipcode;
            if (b.Address || b.address) params.Address = b.Address || b.address;
            if (b.Phone || b.phone) params.Phone = b.Phone || b.phone;
            if (b.Email || b.email) params.Email = b.Email || b.email;
            if (b.ID || b.id) params.ID = b.ID || b.id;
            if (b.Status || b.status) params.Status = b.Status || b.status;
            if (b.Comment || b.comment) params.Comment = b.Comment || b.comment;
            if (b.Color || b.color) params.Color = b.Color || b.color;
            if (b.PhonePassword || b.pass_phone) params.PhonePassword = b.PhonePassword || b.pass_phone;
            if (b.Leverage !== undefined || b.leverage !== undefined) params.Leverage = b.Leverage ?? b.leverage;
            if (b.Account || b.account) params.Account = b.Account || b.account;
            if (b.Agent || b.agent) params.Agent = b.Agent || b.agent;
            if (b.MQID) params.MQID = b.MQID;

            // Validate required field: login
            const login = params.Login || params.login;
            if (!login) {
                return res.status(400).json({
                    retcode: '3 Invalid request',
                    error: 'Missing required field: login'
                });
            }

            const user = await service.updateUser(params);

            // Return in MT5 Web API response format
            res.json({
                retcode: '0 Done',
                answer: user
            });
        } catch (err: any) {
            res.status(400).json({
                retcode: err.message || 'Error',
                error: err.message
            });
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
        // Accept GET or POST, and accept Login/Type/Password keys in body or query.
        const loginRaw = req.body?.Login ?? req.body?.login ?? req.query?.login;
        const typeRaw = req.body?.Type ?? req.body?.type ?? req.query?.type;
        const passwordRaw = req.body?.Password ?? req.body?.password ?? req.query?.password;

        if (!loginRaw || !typeRaw || !passwordRaw) {
            return res.status(400).json({ success: false, error: 'Missing login, type, or password' });
        }

        const login = Number(loginRaw);
        if (isNaN(login)) {
            return res.status(400).json({ success: false, error: 'Invalid login parameter' });
        }

        const type = String(typeRaw).toLowerCase();
        const validTypes = ['main', 'investor', 'api'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ success: false, error: 'Invalid type. Must be: main, investor, or api' });
        }

        const password = String(passwordRaw);

        const mt5 = getMt5Client();
        const service = new UserService(mt5);

        try {
            const raw = await service.changePassword({ login, type: type as any, password });

            const includeRaw = String(req.query.raw ?? req.body.raw ?? 'false').toLowerCase() === 'true';
            if (includeRaw) return res.json(raw);

            if (raw && String(raw.retcode || '').startsWith('0')) {
                return res.json({ success: true, retcode: raw.retcode });
            }

            // Return raw retcode on failure
            return res.json({ retcode: raw?.retcode ?? 'Unknown' });
        } catch (err: any) {
            return res.status(500).json({ success: false, error: err.message });
        }
    }
}
