import { Router } from 'express';
import announcementController from '../controllers/announcement.controller.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.route('/').get(announcementController.search);
router.route('/:id').get(announcementController.get);

router.route('/').post(upload.array('files'), announcementController.create);
router.route('/:id/replies').post(announcementController.studentReply);
router.route('/:id/replies/:userId').post(announcementController.reply);

router.route('/:id').put(upload.array('files'), announcementController.update);

router.route('/').delete(announcementController.deleteMany);
router.route('/:id').delete(announcementController.delete);

export default router;
