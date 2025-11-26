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
        const login = req.query.login ?? req.body.login;
        const password = req.query.password ?? req.body.password;
        let type = (req.query.type ?? req.body.type) as string;

        // Validate required fields
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
            await service.checkPassword(
                Number(login),
                String(password),
                type as PasswordType
            );

            return res.json({
                success: true,
                valid: true,
                message: 'Password is correct'
            });

        } catch (err: any) {
            const msg = err.message || '';

            if (msg.includes('3006') || msg.includes('Invalid account password')) {
                return res.json({
                    success: true,
                    valid: false,
                    message: 'Invalid password'
                });
            }

            return res.status(500).json({
                success: false,
                error: msg
            });
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
