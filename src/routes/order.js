import express from 'express';
import { OrderController } from '../controllers/order.js';
import { verificaToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/',verificaToken, OrderController.store);
router.get('/', OrderController.index);
router.get('/:id', OrderController.show);
router.put('/:id', verificaToken, OrderController.update);

export default router;