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
router.route('/group').get(UserController.getUserGroup).post(UserController.getUserGroup);
router.route('/total').get(UserController.getUserTotal).post(UserController.getUserTotal);
router.route('/account/get').get(UserController.getUserAccount).post(UserController.getUserAccount);
import { UserLoginsController } from './user.logins.controller';
router.route('/logins').get(UserLoginsController.getUserLogins).post(UserLoginsController.getUserLogins);
router.route('/certificate/get').get(UserController.getUserCertificate).post(UserController.getUserCertificate);
router.route('/otp_secret/get').get(UserController.getUserOtpSecret).post(UserController.getUserOtpSecret);
router.route('/check_balance').get(UserController.getUserCheckBalance).post(UserController.getUserCheckBalance);

// POST /api/user/change_password
router.post('/change_password', UserController.changePassword);

export default router;
