import express from 'express';
import { FixedExpenseController } from '../controllers/fixedExpense.js'

const router = express.Router();


router.post("/", FixedExpenseController.store);
router.get("/", FixedExpenseController.index);
router.get("/:id",FixedExpenseController.show);
router.put("/:id",FixedExpenseController.put);
router.delete("/:id",FixedExpenseController.delete);

export default router;