import express from 'express';
import { TaskController } from '../controllers/tasks.js';
import { verificaRule } from '../middlewares/rules.js';

const router = express.Router();

// Dashboard de produção
router.get('/dashboard', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.dashboard);

// Listar tarefas
router.get('/', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.index);

// Sincronizar todos os pedidos
router.post('/sync-all-orders', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.syncAllOrdersClean);

// Atualizar progresso
router.patch('/:id/progress', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.updateProgress);

// Atualizar status
router.patch('/:id/status', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.updateStatus);

// Atualizar tarefa
router.put('/:id', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.put);

// Deletar tarefa
router.delete('/:id', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.delete);

// Limpar concluídas
router.delete('/', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.clearCompleted);

router.delete('/order/:orderId', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.forceRemoveOrderFromProduction);

// Nas rotas de tasks, adicione:
router.post('/:orderId/remove-from-production', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.removeOrderFromProduction);

// Sincronização inteligente (RECOMENDADA)
router.post('/sync-new-orders', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.syncNewOrdersOnly);

//  Status de sincronização
router.get('/sync-status', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.getSyncStatus);

//  Sincronização completa (APENAS PARA CASOS ESPECÍFICOS)
router.post('/sync-all-orders-clean', verificaRule(["ADM", "CONFEITEIRA"]), TaskController.syncAllOrdersClean);

export default router;