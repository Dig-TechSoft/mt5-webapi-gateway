import { Router } from 'express';
import { OrderController } from './order.controller';

const router = Router();

// GET /api/order/get?ticket=<value>
router.route('/get').get(OrderController.getOrder).post(OrderController.getOrder);

// GET /api/order/get_batch?ticket=1,2,3
router.route('/get_batch').get(OrderController.getOrderBatch).post(OrderController.getOrderBatch);

// GET /api/order/get_total?login=123
router.route('/get_total').get(OrderController.getOrderTotal).post(OrderController.getOrderTotal);

export default router;
