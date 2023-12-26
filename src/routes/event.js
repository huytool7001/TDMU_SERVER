import { Router } from 'express';
import eventController from '../controllers/event.controller.js';

const router = Router();

router.route('/').get(eventController.search);
router.route('/:id').get(eventController.get);

router.route('/').post(eventController.create);

router.route('/:id').put(eventController.update);

router.route('/:id').delete(eventController.delete);

export default router;
