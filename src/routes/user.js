import { Router } from 'express';
import userController from '../controllers/user.controller.js';

const router = Router();

router.route('/:deviceToken').get(userController.get);

router.route('/').post(userController.create);

router.route('/:deviceToken').put(userController.update);

router.route('/:deviceToken').delete(userController.delete);

export default router;
