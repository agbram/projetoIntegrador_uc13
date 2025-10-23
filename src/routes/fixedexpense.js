import express from 'express';
import { FixedExpenseController } from '../controllers/fixedExpense.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: FixedExpense
 *   description: Gerenciamento de despesas fixas
 */

/**
 * @swagger
 * /fixedExpenses:
 *   post:
 *     summary: Cria uma nova despesa fixa
 *     tags: [FixedExpense]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *             required:
 *               - name
 *               - amount
 *               - dueDate
 *     responses:
 *       201:
 *         description: Despesa fixa criada com sucesso
 *       400:
 *         description: Requisição inválida
 */
router.post("/", FixedExpenseController.store);

/**
 * @swagger
 * /fixedExpenses:
 *   get:
 *     summary: Lista todas as despesas fixas
 *     tags: [FixedExpense]
 *     responses:
 *       200:
 *         description: Lista de despesas fixas
 */
router.get("/", FixedExpenseController.index);

/**
 * @swagger
 * /fixedExpenses/{id}:
 *   get:
 *     summary: Busca uma despesa fixa pelo ID
 *     tags: [FixedExpense]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da despesa fixa
 *     responses:
 *       200:
 *         description: Despesa fixa encontrada
 *       404:
 *         description: Despesa fixa não encontrada
 */
router.get("/:id", FixedExpenseController.show);

/**
 * @swagger
 * /fixedExpenses/{id}:
 *   put:
 *     summary: Atualiza uma despesa fixa pelo ID
 *     tags: [FixedExpense]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               amount:
 *                 type: number
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Despesa fixa atualizada
 *       404:
 *         description: Despesa fixa não encontrada
 */
router.put("/:id", FixedExpenseController.put);

/**
 * @swagger
 * /fixedExpenses/{id}:
 *   delete:
 *     summary: Remove uma despesa fixa pelo ID
 *     tags: [FixedExpense]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Despesa fixa deletada
 *       404:
 *         description: Despesa fixa não encontrada
 */
router.delete("/:id", FixedExpenseController.del);

export default router;
