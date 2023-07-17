import { Router } from 'express';
import tokenController from '../controllers/token.controller.js';

const router = Router();
router.route('/').post(tokenController.create);
router.route('/:tokenId').delete(tokenController.delete);

export default router;
