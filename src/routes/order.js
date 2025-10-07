import express from 'express';
import { OrderController } from '../controllers/order.js';
import { verificaToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/',verificaToken, OrderController.store);
router.get('/', OrderController.index);
router.get('/:id', OrderController.show);
router.put('/:id', verificaToken, OrderController.update);

router.post("/:orderId/items", OrderController.addItem);
router.delete("/:orderId/items/:itemId", OrderController.delItem);
router.put("/:orderId/items/:itemId", OrderController.updateItem);

export default router;