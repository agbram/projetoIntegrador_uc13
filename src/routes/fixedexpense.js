import { Router } from "express";
import { FixedExpenseController } from "../controllers/fixedExpense.js";

const router = Router();

router.post("/", FixedExpenseController.store);
router.get("/", FixedExpenseController.index);
router.get("/:id", FixedExpenseController.show);
router.put("/:id", FixedExpenseController.put);
router.delete("/:id", FixedExpenseController.delete);
router.get("/summary", FixedExpenseController.summary);
router.get("/summary/current", FixedExpenseController.currentMonthSummary);
router.get("/summary/comparison", FixedExpenseController.comparison);

// Se tiver soft delete e quiser reativar
router.patch("/:id/reactivate", FixedExpenseController.reactivate);

export default router;