import { Request, Response } from 'express';
import { PositionService } from './services/position/PositionService';
import { getMt5Client } from '../../mt5/instances';

export class PositionController {
    static async getPosition(req: Request, res: Response) {
        // support GET query or POST body
        const loginRaw = req.query.login ?? req.body.login;
        const symbol = (req.query.symbol ?? req.body.symbol) as string;

        if (!loginRaw || !symbol) {
            return res.status(400).json({ success: false, error: 'Missing login or symbol parameter' });
        }

        const login = Number(loginRaw);
        if (isNaN(login)) {
            return res.status(400).json({ success: false, error: 'Invalid login parameter' });
        }

        try {
            const mt5 = getMt5Client();
            const service = new PositionService(mt5);
            const position = await service.getPosition(login, symbol);
            return res.json({ success: true, data: position });
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getPositionBatch(req: Request, res: Response) {
        const loginRaw = req.query.login ?? req.body.login;
        const symbol = (req.query.symbol ?? req.body.symbol) as string;

        if (!loginRaw || !symbol) {
            return res.status(400).json({ success: false, error: 'Missing login or symbol parameter' });
        }

        const login = Number(loginRaw);
        if (isNaN(login)) {
            return res.status(400).json({ success: false, error: 'Invalid login parameter' });
        }

        try {
            const mt5 = getMt5Client();
            const service = new PositionService(mt5);
            const positions = await service.getPositionBatch({ login, symbol });
            return res.json({ success: true, data: positions });
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
}
