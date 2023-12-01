import { Router } from 'express';
import scheduleNoteController from '../controllers/schedule-note.controller.js';

const router = Router();

router.route('/').get(scheduleNoteController.search);
router.route('/:id').get(scheduleNoteController.get);

router.route('/').post(scheduleNoteController.create);

router.route('/:id').put(scheduleNoteController.update);

router.route('/:id').delete(scheduleNoteController.delete);

export default router;
