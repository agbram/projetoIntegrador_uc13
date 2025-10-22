import { Router } from 'express';
import { CustomerController } from '../controllers/customer.js';
import { verificaRule } from '../middlewares/rules.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Customer
 *   description: Gerenciamento de clientes
 */

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Cria um novo cliente (somente ADM)
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cnpj:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *               note:
 *                 type: string
 *             required:
 *               - name
 *               - cnpj
 *     responses:
 *       201:
 *         description: Cliente criado com sucesso
 *       400:
 *         description: Requisição inválida
 */
router.post('/', verificaRule("ADM"), CustomerController.store);

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Lista todos os clientes (somente ADM)
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/', verificaRule("ADM"), CustomerController.index);

/**
 * @swagger
 * /customers/{id}:
 *   put:
 *     summary: Atualiza um cliente pelo ID (somente ADM)
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cnpj:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               address:
 *                 type: string
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente atualizado
 *       404:
 *         description: Cliente não encontrado
 */
router.put('/:id', verificaRule("ADM"), CustomerController.update);

/**
 * @swagger
 * /customers/{id}:
 *   delete:
 *     summary: Remove um cliente pelo ID (somente ADM)
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Cliente deletado
 *       404:
 *         description: Cliente não encontrado
 */
router.delete('/:id', verificaRule("ADM"), CustomerController.delete);

export default router;
