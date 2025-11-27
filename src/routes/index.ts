import { Router } from 'express';
import userRoutes from '../modules/users/user.routes';
import orderRoutes from '../modules/trading/order.routes';
import historyRoutes from '../modules/trading/history.routes';
import positionRoutes from '../modules/trading/position.routes';
import tradeRoutes from '../modules/trading/trade.routes';
import priceRoutes from '../modules/prices/price.routes';

const router = Router();

router.use('/user', userRoutes);
router.use('/order', orderRoutes);
router.use('/history', historyRoutes);
router.use('/position', positionRoutes);
router.use('/trade', tradeRoutes);
router.use('/tick', priceRoutes);

export default router;
