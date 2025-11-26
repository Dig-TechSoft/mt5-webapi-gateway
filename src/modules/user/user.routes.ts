import { Router } from 'express';
import { UserController } from './user.controller';

const router = Router();

// GET /api/user/get?login=<value>
router.route('/get').get(UserController.getUser).post(UserController.getUser);

router.route('/get_batch').get(UserController.getUserBatch).post(UserController.getUserBatch);

// POST /api/user/add
router.post('/add', UserController.addUser);

// POST /api/user/update
router.post('/update', UserController.updateUser);

// POST /api/user/delete
router.route('/delete').get(UserController.deleteUser).post(UserController.deleteUser);

// POST /api/user/check_password
router.route('/check_password').get(UserController.checkPassword).post(UserController.checkPassword);

// POST /api/user/change_password
router.post('/change_password', UserController.changePassword);

export default router;
