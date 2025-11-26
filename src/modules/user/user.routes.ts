import { Router } from 'express';
import { UserController } from './user.controller';

const router = Router();

// GET /api/user/get/:brokerId?login=<value>
router.route('/get/:brokerId').get(UserController.getUser).post(UserController.getUser);

router.route('/get_batch/:brokerId').get(UserController.getUserBatch).post(UserController.getUserBatch);

// POST /api/user/add/:brokerId
router.post('/add/:brokerId', UserController.addUser);

// POST /api/user/update/:brokerId
router.post('/update/:brokerId', UserController.updateUser);

// POST /api/user/delete/:brokerId
router.route('/delete/:brokerId').get(UserController.deleteUser).post(UserController.deleteUser);

// POST /api/user/check_password/:brokerId
router.route('/check_password/:brokerId').get(UserController.checkPassword).post(UserController.checkPassword);

// POST /api/user/change_password/:brokerId
router.post('/change_password/:brokerId', UserController.changePassword);

export default router;
