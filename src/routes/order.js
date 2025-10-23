import express from 'express';
import { OrderController } from '../controllers/order.js';
import { verificaRule } from '../middlewares/rules.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Order
 *   description: Gerenciamento de pedidos
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Cria um novo pedido (somente ADM)
 *     tags: [Order]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *             required:
 *               - customerId
 *               - date
 *     responses:
 *       201:
 *         description: Pedido criado com sucesso
 *       400:
 *         description: Requisição inválida
 */
router.post('/', verificaRule("ADM"), OrderController.store);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lista todos os pedidos
 *     tags: [Order]
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
router.get('/', OrderController.index);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Busca um pedido pelo ID
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     responses:
 *       200:
 *         description: Pedido encontrado
 *       404:
 *         description: Pedido não encontrado
 */
router.get('/:id', OrderController.show);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Atualiza um pedido pelo ID
 *     tags: [Order]
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
 *               customerId:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Pedido atualizado
 *       404:
 *         description: Pedido não encontrado
 */
router.put('/:id', OrderController.update);

/**
 * @swagger
 * /orders/{orderId}/items:
 *   post:
 *     summary: Adiciona um item ao pedido
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do pedido
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: number
 *             required:
 *               - productId
 *               - quantity
 *     responses:
 *       201:
 *         description: Item adicionado
 *       404:
 *         description: Pedido ou produto não encontrado
 */
router.post("/:orderId/items", OrderController.addItem);

/**
 * @swagger
 * /orders/{orderId}/items/{itemId}:
 *   delete:
 *     summary: Remove um item do pedido
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removido
 *       404:
 *         description: Pedido ou item não encontrado
 */
router.delete("/:orderId/items/:itemId", OrderController.delItem);

/**
 * @swagger
 * /orders/{orderId}/items/{itemId}:
 *   put:
 *     summary: Atualiza um item do pedido
 *     tags: [Order]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
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
 *               quantity:
 *                 type: number
 *             required:
 *               - quantity
 *     responses:
 *       200:
 *         description: Item atualizado
 *       404:
 *         description: Pedido ou item não encontrado
 */
router.put("/:orderId/items/:itemId", OrderController.updateItem);

/**
 * @swagger
 * /orders/{id}/status:
 *   put:
 *     summary: Atualiza o status de um pedido (somente CONFEITEIRA)
 *     tags: [Order]
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
 *               status:
 *                 type: string
 *                 description: Novo status do pedido
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Status atualizado
 *       404:
 *         description: Pedido não encontrado
 */
router.put("/:id", verificaRule("CONFEITEIRA"), OrderController.atualizaStatus);

export default router;
