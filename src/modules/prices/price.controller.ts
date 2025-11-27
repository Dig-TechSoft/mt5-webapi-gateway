import { Request, Response } from 'express';
import { getMt5Client } from '../../mt5/instances';
import { PriceService } from './services/price/PriceService';

export class PriceController {
    static async getTickLast(req: Request, res: Response) {
        const symbolRaw = req.query.symbol ?? req.body.symbol;
        const transIdRaw = req.query.trans_id ?? req.body.trans_id ?? req.query.transId ?? req.body.transId;

        if (!symbolRaw) {
            return res.status(400).json({ success: false, error: 'Missing symbol parameter' });
        }

        const symbols: string = Array.isArray(symbolRaw) ? (symbolRaw as string[]).join(',') : String(symbolRaw);
        const trans_id = transIdRaw !== undefined && transIdRaw !== null ? String(transIdRaw) : undefined;

        try {
            const mt5 = getMt5Client();
            const service = new PriceService(mt5);
            const tick = await service.getTickLast(symbols, trans_id);
            return res.json({ success: true, data: tick });
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
}
