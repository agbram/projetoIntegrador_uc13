import express from 'express';
import { OrderController } from '../controllers/order.js';
import { verificaRule } from '../middlewares/rules.js';

const router = express.Router();

router.post('/',verificaRule("ADM"), OrderController.store);
router.get('/', OrderController.index);
router.get('/:id', OrderController.show);
router.put('/:id', OrderController.update);

router.post("/:orderId/items", OrderController.addItem);
router.delete("/:orderId/items/:itemId", OrderController.delItem);
router.put("/:orderId/items/:itemId", OrderController.updateItem);

router.put("/:id", verificaRule("CONFEITEIRA"), OrderController.atualizaStatus);

export default router;