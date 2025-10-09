import express from 'express';
import { SupplyPurchaseController } from '../controllers/supplyPurchase.js';

const router = express.Router();

router.post('/', SupplyPurchaseController.store);
router.get('/', SupplyPurchaseController.index);
router.get('/:id', SupplyPurchaseController.show);
router.put('/:id', SupplyPurchaseController.update);
router.delete('/:id', SupplyPurchaseController.delete);

router.post('/:supplyPurchaseId/items', SupplyPurchaseController.addItem);

export default router;