import express from 'express';
import { SupplyController } from '../controllers/supply.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Supply
 *   description: Gerenciamento de suprimentos
 */

/**
 * @swagger
 * /supply:
 *   post:
 *     summary: Cria um novo suprimento
 *     tags: [Supply]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *             required:
 *               - name
 *               - quantity
 *               - unit
 *     responses:
 *       201:
 *         description: Suprimento criado com sucesso
 *       400:
 *         description: Requisição inválida
 */
router.post("/", SupplyController.store);

/**
 * @swagger
 * /supply:
 *   get:
 *     summary: Lista todos os suprimentos
 *     tags: [Supply]
 *     responses:
 *       200:
 *         description: Lista de suprimentos
 */
router.get("/", SupplyController.index);

/**
 * @swagger
 * /supply/{id}:
 *   get:
 *     summary: Busca um suprimento pelo ID
 *     tags: [Supply]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do suprimento
 *     responses:
 *       200:
 *         description: Suprimento encontrado
 *       404:
 *         description: Suprimento não encontrado
 */
router.get("/:id", SupplyController.show);

/**
 * @swagger
 * /supply/{id}:
 *   put:
 *     summary: Atualiza um suprimento pelo ID
 *     tags: [Supply]
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
 *               quantity:
 *                 type: number
 *               unit:
 *                 type: string
 *     responses:
 *       200:
 *         description: Suprimento atualizado
 *       404:
 *         description: Suprimento não encontrado
 */
router.put("/:id", SupplyController.put);

/**
 * @swagger
 * /supply/{id}:
 *   delete:
 *     summary: Remove um suprimento pelo ID
 *     tags: [Supply]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Suprimento deletado
 *       404:
 *         description: Suprimento não encontrado
 */
router.delete("/:id", SupplyController.del);

export default router;
