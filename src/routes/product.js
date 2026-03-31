import express from 'express';
import { ProductController } from '../controllers/product.js';
import { verificaRule } from '../middlewares/rules.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Product
 *   description: Gerenciamento de produtos
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Cria um novo produto
 *     tags: [Product]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *             required:
 *               - name
 *               - price
 *               - stock
 *     responses:
 *       201:
 *         description: Produto criado com sucesso
 *       400:
 *         description: Requisição inválida
 */
router.post('/', verificaRule(["ADM"]), ProductController.store);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lista todos os produtos
 *     tags: [Product]
 *     responses:
 *       200:
 *         description: Lista de produtos
 */
router.get('/', verificaRule(["ADM", "ATENDENTE", "ATENDENTES"]), ProductController.index);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Busca um produto pelo ID
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do produto
 *     responses:
 *       200:
 *         description: Produto encontrado
 *       404:
 *         description: Produto não encontrado
 */
router.get('/:id', verificaRule(["ADM", "ATENDENTE", "ATENDENTES"]), ProductController.show);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Atualiza um produto pelo ID
 *     tags: [Product]
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
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Produto atualizado
 *       404:
 *         description: Produto não encontrado
 */
router.put('/:id', verificaRule(["ADM"]), ProductController.update);

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Remove um produtos pelo ID
 *     tags: [product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: produtos deletado
 *       404:
 *         description: produtos não encontrado
 */
router.delete("/:id", verificaRule(["ADM"]), ProductController.del);

export default router;
