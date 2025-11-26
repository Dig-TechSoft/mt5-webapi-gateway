import { Request, Response } from 'express';
import { getMt5Client } from '../../mt5/instances';
import { HistoryOrderService } from './services/order/HistoryOrderService';

export class HistoryController {
    static async getHistoryOrder(req: Request, res: Response) {
        // default broker is used (configured in brokers.ts); do not require company tag
        const ticketRaw = req.query.ticket ?? req.body.ticket;

        if (!ticketRaw) {
            return res.status(400).json({ success: false, error: 'Missing ticket parameter' });
        }

        const ticket = Number(ticketRaw);
        if (isNaN(ticket)) {
            return res.status(400).json({ success: false, error: 'Invalid ticket parameter' });
        }

        try {
            const mt5 = getMt5Client();
            const service = new HistoryOrderService(mt5);
            const order = await service.getHistoryOrder(ticket);
            return res.json({ success: true, data: order });
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getHistoryOrderBatch(req: Request, res: Response) {
        // default broker is used (configured in brokers.ts); do not require company tag
        const rawTickets = req.query.ticket ?? req.body.ticket;

        if (!rawTickets) {
            return res.status(400).json({ success: false, error: 'Missing ticket parameter' });
        }

        const tickets: number[] = Array.isArray(rawTickets)
            ? rawTickets.map(Number).filter(n => !isNaN(n))
            : String(rawTickets).split(',').map(s => Number(s.trim())).filter(n => !isNaN(n));

        if (!tickets || tickets.length === 0) {
            return res.status(400).json({ success: false, error: 'No valid ticket numbers provided' });
        }

        try {
            const mt5 = getMt5Client();
            const service = new HistoryOrderService(mt5);
            const orders = await service.getHistoryOrderBatch({ ticket: tickets });
            return res.json({ success: true, data: orders });
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
}
