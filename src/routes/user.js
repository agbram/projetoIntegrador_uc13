import express from 'express';
import { UserController } from '../controllers/user.js';
import { verificaToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/',verificaToken, UserController.store);
router.get('/', verificaToken, UserController.index);
router.get('/:id', verificaToken, UserController.show);
router.put('/:id', verificaToken, UserController.update);
router.post('/login', UserController.login);


export default router;