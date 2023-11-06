import { Router } from 'express';
import firebaseController from '../controllers/firebase.controller.js';

const router = Router();

router.route('/users').get(firebaseController.getUsers);

export default router;
