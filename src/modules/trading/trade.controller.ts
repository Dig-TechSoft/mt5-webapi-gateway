import { Request, Response } from 'express';
import { getMt5Client } from '../../mt5/instances';
import { TradeService } from './services/trade/TradeService';

export class TradeController {
    static async balance(req: Request, res: Response) {
        // default broker is used — no broker tag required
        // support GET query or POST body
        const loginRaw = req.query.login ?? req.body.login;
        const typeRaw = req.query.type ?? req.body.type;
        const balanceRaw = req.query.balance ?? req.body.balance;
        let comment = (req.query.comment ?? req.body.comment) as string | undefined;
        if (comment && comment.length > 32) comment = comment.slice(0, 32);
        const checkMarginRaw = req.query.check_margin ?? req.body.check_margin;

        if (!loginRaw || typeRaw === undefined || balanceRaw === undefined) {
            return res.status(400).json({ success: false, error: 'Missing login, type, or balance parameter' });
        }

        const login = Number(loginRaw);
        const type = Number(typeRaw);
        if (![2, 3, 4, 5, 6].includes(type)) {
            return res.status(400).json({ success: false, error: 'Invalid type parameter (allowed 2,3,4,5,6)' });
        }
        const balance = Number(balanceRaw);
        const check_margin = checkMarginRaw === undefined ? undefined : Number(checkMarginRaw) ? 1 : 0;

        if (isNaN(login) || isNaN(type) || isNaN(balance)) {
            return res.status(400).json({ success: false, error: 'Invalid login/type/balance parameter' });
        }

        try {
            const mt5 = getMt5Client();
            const service = new TradeService(mt5);
            const opType = type as any; // We've validated above; cast to satisfy TypeScript union type
            const result = await service.balanceOperation({ login, type: opType, balance, comment, check_margin });
            return res.json({ success: true, data: result });
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
}
