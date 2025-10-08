import express from 'express';
import { SupplyController } from '../controllers/supply.js'

const router = express.Router();


router.post("/", SupplyController.store);
router.get("/", SupplyController.index);
router.get("/:id",SupplyController.show);
router.put("/:id",SupplyController.put);
router.delete("/:id",SupplyController.del);

export default router;