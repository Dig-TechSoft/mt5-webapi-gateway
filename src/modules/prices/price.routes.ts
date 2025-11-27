import { Router } from 'express';
import { PriceController } from './price.controller';

const router = Router();

router.route('/last').get(PriceController.getTickLast).post(PriceController.getTickLast);

export default router;
