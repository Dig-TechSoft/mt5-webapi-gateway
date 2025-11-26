import { Router } from 'express';
import { PositionController } from './position.controller';

const router = Router();

// GET /api/position/get?login=...&symbol=...
router.route('/get').get(PositionController.getPosition).post(PositionController.getPosition);

// GET /api/position/get_batch?login=...&symbol=...
router.route('/get_batch').get(PositionController.getPositionBatch).post(PositionController.getPositionBatch);

export default router;
