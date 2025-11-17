import express from 'express';
import { TaskController } from '../controllers/tasks.js';

const router = express.Router();

// Dashboard de produção
router.get('/dashboard', TaskController.dashboard);

// Listar tarefas
router.get('/', TaskController.index);

// Sincronizar todos os pedidos
router.post('/sync-all-orders', TaskController.syncAllOrdersClean);

// Atualizar progresso
router.patch('/:id/progress', TaskController.updateProgress);

// Atualizar status
router.patch('/:id/status', TaskController.updateStatus);

// Atualizar tarefa
router.put('/:id', TaskController.put);

// Deletar tarefa
router.delete('/:id', TaskController.delete);

// Limpar concluídas
router.delete('/', TaskController.clearCompleted);

// 🔄 Sincronização inteligente (RECOMENDADA)
router.post('/sync-new-orders', TaskController.syncNewOrdersOnly);

// 📊 Status de sincronização
router.get('/sync-status', TaskController.getSyncStatus);

// 🧹 Sincronização completa (APENAS PARA CASOS ESPECÍFICOS)
router.post('/sync-all-orders-clean', TaskController.syncAllOrdersClean);

export default router;