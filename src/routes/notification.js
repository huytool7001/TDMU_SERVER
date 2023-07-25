import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';

const router = Router();
router.route('/schedule').post(notificationController.scheduleNotify);

export default router;
