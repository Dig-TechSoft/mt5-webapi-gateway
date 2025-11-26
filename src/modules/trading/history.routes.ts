import { Router } from 'express';
import { HistoryController } from './history.controller';

const router = Router();

// GET /api/history/get?ticket=<value>
router.route('/get').get(HistoryController.getHistoryOrder).post(HistoryController.getHistoryOrder);

// GET /api/history/get_batch?ticket=1,2,3
router.route('/get_batch').get(HistoryController.getHistoryOrderBatch).post(HistoryController.getHistoryOrderBatch);

export default router;
