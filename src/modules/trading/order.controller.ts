import { Request, Response } from 'express';
import { OrderService } from './services/order/OrderService';
import { getMt5Client } from '../../mt5/instances';

export class OrderController {
    static async getOrder(req: Request, res: Response) {
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
            const service = new OrderService(mt5);
            const order = await service.getOrder(ticket);
            return res.json({ success: true, data: order });
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getOrderBatch(req: Request, res: Response) {
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
            const service = new OrderService(mt5);
            const orders = await service.getOrderBatch({ ticket: tickets });
            return res.json({ success: true, data: orders });
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }

    static async getOrderTotal(req: Request, res: Response) {
        const loginRaw = req.query.login ?? req.body.login;

        if (!loginRaw) {
            return res.status(400).json({ success: false, error: 'Missing login parameter' });
        }

        const login = Number(loginRaw);
        if (isNaN(login)) {
            return res.status(400).json({ success: false, error: 'Invalid login parameter' });
        }

        try {
            const mt5 = getMt5Client();
            const service = new OrderService(mt5);
            const includeRaw = String(req.query.raw ?? req.body.raw ?? 'false').toLowerCase() === 'true';
            const total = await service.getOrderTotal(login);
            const result: any = { total };
            if (includeRaw) {
                const raw = await service.getOrderTotalRaw(login);
                result.raw = raw;
            }
            return res.json({ success: true, data: result });
        } catch (err: any) {
            return res.status(400).json({ success: false, error: err.message });
        }
    }
}
