import { Router } from 'express';
import userController from '../controllers/user.controller.js';

const router = Router();
router.route('/').post(userController.create);
router.route('/:deviceToken').delete(userController.delete);

export default router;
