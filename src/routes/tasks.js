import express from 'express';
import { TaskController } from '../controllers/tasks.js';
import { verificaRule } from '../middlewares/rules.js';

const router = express.Router();

// Dashboard de produção
router.get('/dashboard', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.dashboard);

// Listar tarefas
router.get('/', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.index);

// Sincronizar todos os pedidos
router.post('/sync-all-orders', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.syncAllOrdersClean);

// Atualizar progresso
router.patch('/:id/progress', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.updateProgress);

// Atualizar status
router.patch('/:id/status', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.updateStatus);

// Atualizar tarefa
router.put('/:id', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.put);

// Deletar tarefa
router.delete('/:id', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.delete);

// Limpar concluídas
router.delete('/', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.clearCompleted);

router.delete('/order/:orderId', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.forceRemoveOrderFromProduction);

// Nas rotas de tasks, adicione:
router.post('/:orderId/remove-from-production', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.removeOrderFromProduction);

// Sincronização inteligente (RECOMENDADA)
router.post('/sync-new-orders', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.syncNewOrdersOnly);

//  Status de sincronização
router.get('/sync-status', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.getSyncStatus);

//  Sincronização completa (APENAS PARA CASOS ESPECÍFICOS)
router.post('/sync-all-orders-clean', verificaRule(["ADM", "CONFEITEIRA", "CONFEITEIRAS"]), TaskController.syncAllOrdersClean);

export default router;