import express from 'express';
import { FixedExpenseController } from '../controllers/fixedexpense.js'

const router = express.Router();


router.post("/", FixedExpenseController.store);
router.get("/", FixedExpenseController.index);
router.get("/:id",FixedExpenseController.show)
router.get("/:id",FixedExpenseController.put)
router.delete("/:id",FixedExpenseController.del)

export default router;