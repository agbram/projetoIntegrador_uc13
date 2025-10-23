import express from 'express';
import { SupplyPurchaseController } from '../controllers/supplyPurchase.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: SupplyPurchase
 *   description: Gerenciamento de compras de suprimentos
 */

/**
 * @swagger
 * /supply-purchases:
 *   post:
 *     summary: Cria uma nova compra de suprimento
 *     tags: [SupplyPurchase]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               supplier:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *             required:
 *               - supplier
 *               - date
 *     responses:
 *       201:
 *         description: Compra criada com sucesso
 *       400:
 *         description: Requisição inválida
 */
router.post('/', SupplyPurchaseController.store);

/**
 * @swagger
 * /supply-purchases:
 *   get:
 *     summary: Lista todas as compras de suprimentos
 *     tags: [SupplyPurchase]
 *     responses:
 *       200:
 *         description: Lista de compras
 */
router.get('/', SupplyPurchaseController.index);

/**
 * @swagger
 * /supply-purchases/{id}:
 *   get:
 *     summary: Busca uma compra pelo ID
 *     tags: [SupplyPurchase]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     responses:
 *       200:
 *         description: Compra encontrada
 *       404:
 *         description: Compra não encontrada
 */
router.get('/:id', SupplyPurchaseController.show);

/**
 * @swagger
 * /supply-purchases/{id}:
 *   put:
 *     summary: Atualiza uma compra de suprimento
 *     tags: [SupplyPurchase]
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
 *               supplier:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Compra atualizada
 *       404:
 *         description: Compra não encontrada
 */
router.put('/:id', SupplyPurchaseController.update);

/**
 * @swagger
 * /supply-purchases/{id}:
 *   delete:
 *     summary: Remove uma compra de suprimento
 *     tags: [SupplyPurchase]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Compra deletada
 *       404:
 *         description: Compra não encontrada
 */
router.delete('/:id', SupplyPurchaseController.delete);

/**
 * @swagger
 * /supply-purchases/{supplyPurchaseId}/items:
 *   post:
 *     summary: Adiciona um item a uma compra
 *     tags: [SupplyPurchase]
 *     parameters:
 *       - in: path
 *         name: supplyPurchaseId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da compra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: integer
 *               quantity:
 *                 type: number
 *             required:
 *               - itemId
 *               - quantity
 *     responses:
 *       201:
 *         description: Item adicionado
 *       404:
 *         description: Compra ou item não encontrado
 */
router.post('/:supplyPurchaseId/items', SupplyPurchaseController.addItem);

export default router;
