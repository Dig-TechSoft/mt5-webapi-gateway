import { Router } from 'express';
import { TradeController } from './trade.controller';

const router = Router();

// GET /api/trade/balance?login=...&type=...&balance=...&comment=...
router.route('/balance').get(TradeController.balance).post(TradeController.balance);

export default router;
