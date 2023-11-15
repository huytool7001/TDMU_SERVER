import { Router } from 'express';
import notificationController from '../controllers/notification.controller.js';

const router = Router();

router.route('/').post(notificationController.notifyAllStudentSchedule);
router.route('/chat').post(notificationController.notifyChatMessage);

export default router;
