import { Router } from 'express';
import announcementController from '../controllers/schedule-note.controller.js';

const router = Router();

router.route('/').get(announcementController.search);
router.route('/:id').get(announcementController.get);

router.route('/').post(announcementController.create);

router.route('/:id').put(announcementController.update);

router.route('/:userId/:scheduleId').delete(announcementController.delete);

export default router;
