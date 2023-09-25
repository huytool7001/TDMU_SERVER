import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';

const router = Router();

router.route('/').get(adminController.search);
router.route('/:id').get(adminController.get);

router.route('/').post(adminController.create);
router.route('/login').post(adminController.login);
// router.route('/logout').post(adminController.logout);
router.route('/refresh-token').post(adminController.refreshToken);

router.route('/:id').put(adminController.update);

router.route('/').delete(adminController.deleteMany);
router.route('/:id').delete(adminController.delete);

export default router;
