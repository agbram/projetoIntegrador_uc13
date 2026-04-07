import { Router } from "express";
import { FixedExpenseController } from "../controllers/fixedExpense.js";
import { verificaRule } from '../middlewares/rules.js';

const router = Router();

// Rota de administração / automação (PRECISA vir antes do /:id)
router.post("/generate-month", verificaRule(["ADM"]), FixedExpenseController.generateMonth);

router.post("/", verificaRule(["ADM"]), FixedExpenseController.store);
router.get("/", verificaRule(["ADM"]), FixedExpenseController.index);
router.get("/:id", verificaRule(["ADM"]), FixedExpenseController.show);
router.put("/:id", verificaRule(["ADM"]), FixedExpenseController.put);
router.patch("/:id", verificaRule(["ADM"]), FixedExpenseController.put);
router.delete("/:id", verificaRule(["ADM"]), FixedExpenseController.delete);
router.get("/summary", verificaRule(["ADM"]), FixedExpenseController.summary);
router.get("/summary/current", verificaRule(["ADM"]), FixedExpenseController.currentMonthSummary);
router.get("/summary/comparison", verificaRule(["ADM"]), FixedExpenseController.comparison);

// Se tiver soft delete e quiser reativar
router.patch("/:id/reactivate", verificaRule(["ADM"]), FixedExpenseController.reactivate);

export default router;