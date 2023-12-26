import { Router } from 'express';
import scheduleNoteController from '../controllers/schedule-note.controller.js';

const router = Router();

router.route('/').get(scheduleNoteController.search);
router.route('/:userId/:scheduleId').get(scheduleNoteController.get);
router.route('/').post(scheduleNoteController.update);

export default router;
