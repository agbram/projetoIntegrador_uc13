import express from 'express';
import { SupplyPurchaseController } from '../controllers/supplyPurchase.js';

const router = express.Router();

router.post('/', SupplyPurchaseController.store);
router.get('/', SupplyPurchaseController.index);
router.put('/:id', SupplyPurchaseController.update);

export default router;