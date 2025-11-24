import prisma from "../prisma.js";

const TaskController = {
  async syncProductionTasks(orderId) {
    try {
      console.log(`🔄 Sincronizando tarefas para pedido ${orderId}...`);
      
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
          items: { 
            include: { 
              product: true 
            } 
          } 
        }
      });

      if (!order) {
        console.log(` Pedido ${orderId} não encontrado`);
        throw new Error('Pedido não encontrado');
      }

      const finalStatuses = ['READY_FOR_DELIVERY', 'DELIVERED', 'PRODUCTION_COMPLETE'];
      if (finalStatuses.includes(order.status)) {
        console.log(` Pedido ${orderId} já está em estado final (${order.status}) - Ignorando sincronização`);
        return { success: true, message: 'Pedido em estado final - não sincronizado' };
      }
      if (order.productionSynced) {
        console.log(` Pedido ${orderId} já foi sincronizado anteriormente`);
        return { success: true, message: 'Pedido já sincronizado' };
      }

      console.log(`Pedido ${orderId} tem ${order.items.length} itens`);

      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          const existingTask = await tx.productionTask.findFirst({
            where: { productId: item.productId }
          })
          
          if (existingTask) {
            const shouldReopen = existingTask.status === 'COMPLETED' || existingTask.status === 'CANCELLED';
            
            const newTotalQuantity = existingTask.totalQuantity + item.quantity;
            const newPendingQuantity = existingTask.pendingQuantity + item.quantity;
            
            const updateData = {
              totalQuantity: newTotalQuantity,
              pendingQuantity: newPendingQuantity,
              dueDate: await TaskController.calculateDueDate(item.productId),
              ...(shouldReopen && {
                status: 'PENDING',
              })
            };

            await tx.productionTask.update({
              where: { id: existingTask.id }, 
              data: updateData
            });

            console.log(`📝 Task existente atualizada para produto ${item.productId}: +${item.quantity} unidades`);
          } else {
            if (item.quantity > 0) {
              await tx.productionTask.create({
                data: {
                  productId: item.productId,
                  totalQuantity: item.quantity,
                  pendingQuantity: item.quantity,
                  completedQuantity: 0,
                  dueDate: order.deliveryDate,
                  status: 'PENDING'
                }
              });
              console.log(` Nova task criada para produto ${item.productId}: ${item.quantity} unidades`);
            } else {
              console.log(` Ignorando produto ${item.productId} - quantidade zero`);
            }
          }

          await tx.orderItem.updateMany({
            where: {
              orderId: orderId,
              productId: item.productId
            },
            data: {
              productionCounted: true
            }
          });
        }

        await tx.order.update({
          where: { id: orderId },
          data: {
            productionSynced: true,
            syncedAt: new Date()
          }
        });
      });

      await TaskController.recalculateAllPriorities();
      
      console.log(` Sincronização concluída para pedido ${orderId}`);
      return { success: true, message: 'Tarefas de produção sincronizadas' };
    } catch (error) {
      console.error(` Erro ao sincronizar pedido ${orderId}:`, error);
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        orderId: orderId
      });
      throw new Error(`Falha na sincronização do pedido ${orderId}: ${error.message}`);
    }
  },

  async getSyncStatus(req, res, next) {
    try {
      const totalOrders = await prisma.order.count();
      const syncedOrders = await prisma.order.count({
        where: { productionSynced: true }
      });
      
      const ordersByStatus = await prisma.order.groupBy({
        by: ['status'],
        _count: {
          id: true
        }
      });

      const activeOrders = await prisma.order.count({
        where: {
          status: {
            notIn: ['READY_FOR_DELIVERY', 'DELIVERED', 'PRODUCTION_COMPLETE']
          }
        }
      });

      res.status(200).json({
        syncStatus: {
          totalOrders,
          syncedOrders,
          notSynced: totalOrders - syncedOrders,
          activeOrders,
          completedOrders: totalOrders - activeOrders
        },
        statusBreakdown: ordersByStatus
      });
    } catch (error) {
      console.error('❌ Erro ao buscar status de sincronização:', error);
      next(error);
    }
  },

  async updateOrderStatusOnProductionProgress(taskId) {
    try {
      const task = await prisma.productionTask.findUnique({
        where: { id: taskId },
        include: {
          product: true
        }
      });

      if (!task) return;

      console.log(` Verificando pedidos para produção do produto ${task.product.name}...`);

      // Buscar todos os pedidos que contêm este produto
      const ordersWithThisProduct = await prisma.order.findMany({
        where: {
          items: {
            some: {
              productId: task.productId,
              productionCounted: true
            }
          },
          status: {
            in: ['PENDING', 'IN_PROGRESS', 'IN_PRODUCTION']
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      console.log(` Encontrados ${ordersWithThisProduct.length} pedidos com o produto`);

      for (const order of ordersWithThisProduct) {
        let hasProductionStarted = false;
        let allItemsProduced = true;

        // Verificar o status de produção de cada item do pedido
        for (const item of order.items) {
          const itemTask = await prisma.productionTask.findFirst({
            where: { productId: item.productId }
          });
          
          if (itemTask) {
            // Se pelo menos um item está em produção
            if (itemTask.status === 'IN_PRODUCTION' || 
                (itemTask.completedQuantity > 0 && itemTask.completedQuantity < itemTask.totalQuantity)) {
              hasProductionStarted = true;
            }
            
            // Se algum item não foi totalmente produzido
            if (itemTask.completedQuantity < item.quantity) {
              allItemsProduced = false;
            }
          } else {
            // Se não há tarefa para o item, não está produzido
            allItemsProduced = false;
          }
        }

        if (hasProductionStarted && order.status !== 'IN_PRODUCTION' && !allItemsProduced) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'IN_PRODUCTION' }
          });
          console.log(`✅ Pedido ${order.id} marcado como EM PRODUÇÃO`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao atualizar status do pedido para produção:`, error);
    }
  },

  async syncAllOrdersClean(req, res, next) {
    try {
      console.log("🔄 Iniciando sincronização LIMPA de todos os pedidos...");
      
      await prisma.$transaction(async (tx) => {
        await tx.productionTask.deleteMany({});
        console.log("✅ Tasks antigas removidas");

        await tx.order.updateMany({
          where: {
            status: {
              notIn: ['READY_FOR_DELIVERY', 'DELIVERED', 'PRODUCTION_COMPLETE', 'CANCELLED']
            }
          },
          data: {
            productionSynced: false,
            syncedAt: null
          }
        });

        await tx.orderItem.updateMany({
          where: {
            order: {
              status: {
                notIn: ['READY_FOR_DELIVERY', 'DELIVERED', 'PRODUCTION_COMPLETE', "CANCELLED"]
              }
            }
          },
          data: {
            productionCounted: false
          }
        });
        console.log("✅ Campos de sincronização resetados APENAS para pedidos ativos");
      });

      const activeOrders = await prisma.order.findMany({
        where: {
          status: {
            notIn: ['READY_FOR_DELIVERY', 'DELIVERED', 'PRODUCTION_COMPLETE', "CANCELLED"]
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      console.log(`📦 Encontrados ${activeOrders.length} pedidos ATIVOS para sincronizar`);

      for (const order of activeOrders) {
        try {
          await TaskController.syncProductionTasks(order.id);
          console.log(`✅ Pedido ${order.id} sincronizado`);
        } catch (orderError) {
          console.error(`❌ Erro ao sincronizar pedido ${order.id}:`, orderError);
        }
      }

      res.status(200).json({
        message: "Sincronização limpa concluída - Apenas pedidos ativos processados",
        summary: {
          totalActiveOrders: activeOrders.length,
          ignoredCompletedOrders: "Pedidos READY_FOR_DELIVERY/DELIVERED foram mantidos"
        }
      });
    } catch (error) {
      console.error('❌ Erro na sincronização limpa:', error);
      next(error);
    }
  },

  // Recalcular prioridades de todas as tasks
  async recalculateAllPriorities() {
    try {
      const allTasks = await prisma.productionTask.findMany({
        where: {
          OR: [
            { status: 'PENDING' },
            { status: 'IN_PRODUCTION' }
          ]
        },
        include: {
          product: true
        }
      });

      if (allTasks.length === 0) {
        console.log(" Nenhuma tarefa encontrada para recalcular prioridades");
        return;
      }

      await prisma.$transaction(async (tx) => {
        const allQuantities = allTasks.map(task => task.pendingQuantity);
        
        for (const task of allTasks) {
          const priority = TaskController.calculatePriority(task.pendingQuantity, allQuantities);

          await tx.productionTask.update({
            where: { id: task.id },
            data: { priority }
          });
        }
      });

      console.log(`✅ Prioridades recalculadas para ${allTasks.length} tarefas`);
      return { success: true, updated: allTasks.length };
    } catch (error) {
      console.error('❌ Erro ao recalcular prioridades:', error);
      throw error;
    }
  },

  // Calcular prioridade baseada em quantidade
  calculatePriority(quantity, allQuantities) {
    if (allQuantities.length === 0) return 'MEDIUM';
    
    const maxQuantity = Math.max(...allQuantities);
    const minQuantity = Math.min(...allQuantities);
    const range = maxQuantity - minQuantity;
    
    if (range === 0) return 'MEDIUM';
    
    const position = (quantity - minQuantity) / range;
    
    if (position >= 0.8) return 'URGENT';
    if (position >= 0.5) return 'HIGH';
    if (position >= 0.2) return 'MEDIUM';
    return 'LOW';
  },

  // Calcular data de vencimento mais urgente
  async calculateDueDate(productId) {
    try {
      const ordersWithProduct = await prisma.order.findMany({
        where: {
          items: {
            some: {
              productId: productId
            }
          },
          status: {
            in: ['PENDING', 'IN_PROGRESS',"IN_PRODUCTION", "READY_FOR_DELIVERY"]
          },
          deliveryDate: {
            not: null
          }
        },
        select: {
          deliveryDate: true
        },
        orderBy: {
          deliveryDate: 'asc'
        },
        take: 1
      });

      return ordersWithProduct[0]?.deliveryDate || new Date();
    } catch (error) {
      console.error(' Erro ao calcular dueDate:', error);
      return new Date();
    }
  },

async forceRemoveOrderFromProduction(req, res, next) {
  try {
    const { orderId } = req.params;
    
    const result = await TaskController.removeOrderFromProduction(parseInt(orderId));
    
    res.status(200).json({
      message: 'Pedido removido da produção com sucesso',
      ...result
    });
  } catch (error) {
    console.error('❌ Erro ao forçar remoção do pedido da produção:', error);
    next(error);
  }
},

async removeOrderFromProduction(orderId) {
  try {
    console.log(`🔄 Removendo pedido ${orderId} da produção...`);
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: { 
          include: { 
            product: true 
          } 
        } 
      }
    });

    if (!order) {
      console.log(`❌ Pedido ${orderId} não encontrado`);
      throw new Error('Pedido não encontrado');
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const existingTask = await tx.productionTask.findFirst({
          where: { productId: item.productId }
        });

        if (existingTask) {
          // Subtrai a quantidade do item cancelado da tarefa
          const newTotalQuantity = Math.max(0, existingTask.totalQuantity - item.quantity);
          const newPendingQuantity = Math.max(0, existingTask.pendingQuantity - item.quantity);
          
          // Ajusta a quantidade concluída se necessário
          let newCompletedQuantity = existingTask.completedQuantity;
          if (newCompletedQuantity > newTotalQuantity) {
            newCompletedQuantity = newTotalQuantity;
          }

          // Se a nova quantidade total for zero, deleta a tarefa
          if (newTotalQuantity === 0) {
            await tx.productionTask.delete({
              where: { id: existingTask.id }
            });
            console.log(`🗑️ Tarefa ${existingTask.id} deletada (quantidade zero)`);
          } else {
            // Atualiza a tarefa com as novas quantidades
            await tx.productionTask.update({
              where: { id: existingTask.id },
              data: {
                totalQuantity: newTotalQuantity,
                pendingQuantity: newPendingQuantity,
                completedQuantity: newCompletedQuantity,
                // Reabre a tarefa se estava completa mas agora tem pendências
                status: newPendingQuantity > 0 ? 
                  (existingTask.status === 'COMPLETED' ? 'PENDING' : existingTask.status) 
                  : existingTask.status
              }
            });
            console.log(`📝 Tarefa ${existingTask.id} atualizada: total=${newTotalQuantity}, pendente=${newPendingQuantity}`);
          }
        }

        // Marca o item como não contado na produção
        await tx.orderItem.updateMany({
          where: {
            orderId: orderId,
            productId: item.productId
          },
          data: {
            productionCounted: false
          }
        });
      }

      // Marca o pedido como não sincronizado
      await tx.order.update({
        where: { id: orderId },
        data: {
          productionSynced: false,
          syncedAt: null
        }
      });
    });

    // Recalcula prioridades após remover o pedido
    await TaskController.recalculateAllPriorities();
    
    console.log(`✅ Pedido ${orderId} removido da produção`);
    return { success: true, message: 'Pedido removido da produção' };
  } catch (error) {
    console.error(`❌ Erro ao remover pedido ${orderId} da produção:`, error);
    throw new Error(`Falha ao remover pedido da produção: ${error.message}`);
  }
},

  async syncAllOrders(req, res, next) {
    try {
      console.log("🔄 Iniciando sincronização de todos os pedidos...");
      
      const activeOrders = await prisma.order.findMany({
        where: {
          status: {
            notIn: ['READY_FOR_DELIVERY', 'DELIVERED', 'PRODUCTION_COMPLETE', 'CANCELLED']
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      console.log(`📦 Encontrados ${activeOrders.length} pedidos ATIVOS para sincronizar`);

      let totalTasksCreated = 0;
      let totalTasksUpdated = 0;

      for (const order of activeOrders) {
        try {
          await TaskController.syncProductionTasks(order.id);
          totalTasksCreated += order.items.length;
          totalTasksUpdated++;
          console.log(`✅ Pedido ${order.id} sincronizado`);
        } catch (orderError) {
          console.error(`❌ Erro ao sincronizar pedido ${order.id}:`, orderError);
        }
      }

      await TaskController.recalculateAllPriorities();

      res.status(200).json({
        message: "Sincronização concluída - Apenas pedidos ativos processados",
        summary: {
          totalActiveOrders: activeOrders.length,
          ordersProcessed: totalTasksUpdated,
          totalTasks: totalTasksCreated,
          note: "Pedidos READY_FOR_DELIVERY/DELIVERED foram ignorados"
        }
      });
    } catch (error) {
      console.error('❌ Erro na sincronização geral:', error);
      next(error);
    }
  },

  // Listar todas as tarefas de produção - ✅ CORRIGIDO
  async index(req, res, next) {
    try {
      const { status, priority, page = 1, limit = 50 } = req.query;
      const skip = (page - 1) * limit;

      let where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (priority) {
        where.priority = priority;
      }

      // Por padrão, mostra apenas tarefas ativas
      if (!status) {
        where.OR = [
          { status: 'PENDING' },
          { status: 'IN_PRODUCTION' }
        ];
      }

      const [tasks, totalCount] = await Promise.all([
        prisma.productionTask.findMany({
          where,
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { pendingQuantity: 'desc' },
            { dueDate: 'asc' }
          ],
          skip,
          take: parseInt(limit)
        }),
        prisma.productionTask.count({ where })
      ]);

      // ✅ CORREÇÃO: Estrutura correta do try/catch
      res.status(200).json({
        tasks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar tarefas:', error);
      next(error);
    }
  },

  async updateOrderStatusOnTaskCompletion(taskId) {
    try {
      const task = await prisma.productionTask.findUnique({
        where: { id: taskId },
        include: {
          product: true
        }
      });

      if (!task || task.status !== 'COMPLETED') {
        return;
      }

      console.log(`🔄 Verificando pedidos para o produto ${task.product.name}...`);

      // Buscar todos os pedidos que contêm este produto e não estão concluídos
      const ordersWithThisProduct = await prisma.order.findMany({
        where: {
          items: {
            some: {
              productId: task.productId,
              productionCounted: true
            }
          },
          status: {
            not: 'DELIVERED'
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      console.log(`📦 Encontrados ${ordersWithThisProduct.length} pedidos com o produto`);

      for (const order of ordersWithThisProduct) {
        let allItemsProduced = true;

        // Verificar se TODOS os itens do pedido foram produzidos
        for (const item of order.items) {
          const itemTask = await prisma.productionTask.findFirst({
            where: { productId: item.productId }
          });

          // Se não há tarefa OU se a tarefa não está concluída OU quantidade insuficiente
          if (!itemTask || 
              itemTask.status !== 'COMPLETED' || 
              itemTask.completedQuantity < item.quantity) {
            allItemsProduced = false;
            break;
          }
        }

        // Se todos os itens foram produzidos, atualizar status do pedido
        if (allItemsProduced && order.status !== 'READY_FOR_DELIVERY') {
          await prisma.order.update({
            where: { id: order.id },
            data: { 
              status: 'READY_FOR_DELIVERY',
            }
          });
          console.log(`✅ Pedido ${order.id} marcado como PRONTO PARA ENTREGA`);
        }
      }
    } catch (error) {
      console.error(`Erro ao atualizar status do pedido:`, error);
    }
  },

  // Buscar dashboard de produção (resumo + tarefas)
  async dashboard(req, res, next) {
    try {
      const tasks = await prisma.productionTask.findMany({
        where: {
          OR: [
            { status: 'PENDING' },
            { status: 'IN_PRODUCTION' }
          ]
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { pendingQuantity: 'desc' },
          { dueDate: 'asc' }
        ]
      });

      // Estatísticas para o dashboard
      const summary = {
        totalTasks: tasks.length,
        totalPendingUnits: tasks.reduce((sum, task) => sum + task.pendingQuantity, 0),
        totalCompletedUnits: tasks.reduce((sum, task) => sum + task.completedQuantity, 0),
        byPriority: {
          URGENT: tasks.filter(t => t.priority === 'URGENT').length,
          HIGH: tasks.filter(t => t.priority === 'HIGH').length,
          MEDIUM: tasks.filter(t => t.priority === 'MEDIUM').length,
          LOW: tasks.filter(t => t.priority === 'LOW').length
        },
        byStatus: {
          PENDING: tasks.filter(t => t.status === 'PENDING').length,
          IN_PRODUCTION: tasks.filter(t => t.status === 'IN_PRODUCTION').length
        },
        topProducts: tasks.slice(0, 5).map(task => ({
          name: task.product.name,
          quantity: task.pendingQuantity,
          priority: task.priority
        }))
      };

      res.status(200).json({ tasks, summary });
    } catch (error) {
      console.error('❌ Erro ao buscar dashboard:', error);
      next(error);
    }
  },

  // Atualizar progresso da produção
  async updateProgress(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { completedQuantity } = req.body;

      if (!completedQuantity || completedQuantity <= 0) {
        return res.status(400).json({ 
          error: 'Quantidade concluída deve ser maior que zero' 
        });
      }

      const task = await prisma.productionTask.findUnique({
        where: { id }
      });

      if (!task) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      const newCompleted = task.completedQuantity + parseInt(completedQuantity);
      const newPending = Math.max(0, task.pendingQuantity - parseInt(completedQuantity));
      
      if (newCompleted > task.totalQuantity) {
        return res.status(400).json({ 
          error: 'Quantidade concluída não pode ser maior que a quantidade total' 
        });
      }

      const newStatus = newPending === 0 ? 'COMPLETED' : 
                       task.status === 'PENDING' ? 'IN_PRODUCTION' : task.status;

      const updatedTask = await prisma.productionTask.update({
        where: { id },
        data: {
          completedQuantity: newCompleted,
          pendingQuantity: newPending,
          status: newStatus
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      if (newStatus === 'COMPLETED') {
        await TaskController.updateOrderStatusOnTaskCompletion(id);
      } else {
        await TaskController.updateOrderStatusOnProductionProgress(id);
      }

      // Recalcula prioridades após atualização
      await TaskController.recalculateAllPriorities();

      res.status(200).json(updatedTask);
    } catch (error) {
      console.error('❌ Erro ao atualizar progresso:', error);
      next(error);
    }
  },

  // Atualizar status da tarefa
  async updateStatus(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      const validStatuses = ['PENDING', 'IN_PRODUCTION', 'COMPLETED', 'CANCELLED'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: 'Status inválido. Use: PENDING, IN_PRODUCTION, COMPLETED ou CANCELLED' 
        });
      }

      const task = await prisma.productionTask.findUnique({
        where: { id }
      });

      if (!task) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      const updatedTask = await prisma.productionTask.update({
        where: { id },
        data: { status },
        include: {
          product: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (status === 'COMPLETED') {
        await TaskController.updateOrderStatusOnTaskCompletion(id);
      } else if (status === 'IN_PRODUCTION') {
        await TaskController.updateOrderStatusOnProductionProgress(id);
      }

      // Recalcula prioridades se necessário
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        await TaskController.recalculateAllPriorities();
      }

      res.status(200).json(updatedTask);
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      next(error);
    }
  },

  async syncNewOrdersOnly(req, res, next) {
    try {
      console.log("🔄 Iniciando sincronização INTELIGENTE de pedidos...");
      
      const unsyncedOrders = await prisma.order.findMany({
        where: {
          productionSynced: false,
          status: {
            notIn: ['READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']
          }
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      console.log(`📦 Encontrados ${unsyncedOrders.length} pedidos NÃO SINCRONIZADOS`);

      let successCount = 0;
      let errorCount = 0;

      for (const order of unsyncedOrders) {
        try {
          await TaskController.syncProductionTasks(order.id);
          successCount++;
          console.log(`Pedido ${order.id} sincronizado`);
        } catch (orderError) {
          errorCount++;
          console.error(`Erro ao sincronizar pedido ${order.id}:`, orderError);
        }
      }

      await TaskController.recalculateAllPriorities();

      res.status(200).json({
        message: "Sincronização inteligente concluída",
        summary: {
          totalUnsynced: unsyncedOrders.length,
          successCount,
          errorCount,
          note: "Produção em andamento foi preservada"
        }
      });
    } catch (error) {
      console.error('❌ Erro na sincronização inteligente:', error);
      next(error);
    }
  },

  // Atualizar tarefa completa
  async put(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { totalQuantity, pendingQuantity, completedQuantity, status, priority, dueDate } = req.body;

      const task = await prisma.productionTask.findUnique({
        where: { id }
      });

      if (!task) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      const updateData = {};
      
      if (totalQuantity !== undefined) updateData.totalQuantity = parseInt(totalQuantity);
      if (pendingQuantity !== undefined) updateData.pendingQuantity = parseInt(pendingQuantity);
      if (completedQuantity !== undefined) updateData.completedQuantity = parseInt(completedQuantity);
      if (status !== undefined) updateData.status = status;
      if (priority !== undefined) updateData.priority = priority;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'Nenhum campo para atualizar' });
      }

      const updatedTask = await prisma.productionTask.update({
        where: { id },
        data: updateData,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      // Recalcula prioridades se quantidades foram alteradas
      if (totalQuantity !== undefined || pendingQuantity !== undefined || completedQuantity !== undefined) {
        await TaskController.recalculateAllPriorities();
      }

      res.status(200).json(updatedTask);
    } catch (error) {
      console.error('❌ Erro ao atualizar tarefa:', error);
      next(error);
    }
  },

  // Deletar tarefa
  async delete(req, res, next) {
    try {
      const id = Number(req.params.id);

      const task = await prisma.productionTask.findUnique({
        where: { id }
      });

      if (!task) {
        return res.status(404).json({ error: 'Tarefa não encontrada' });
      }

      await prisma.productionTask.delete({
        where: { id }
      });

      // Recalcula prioridades após deleção
      await TaskController.recalculateAllPriorities();

      res.status(200).json({ message: 'Tarefa deletada com sucesso' });
    } catch (error) {
      console.error(' Erro ao deletar tarefa:', error);
      next(error);
    }
  },

  // Limpar tarefas concluídas
  async clearCompleted(req, res, next) {
    try {
      const deletedCount = await prisma.productionTask.deleteMany({
        where: {
          status: 'COMPLETED'
        }
      });

      res.status(200).json({ 
        message: `${deletedCount.count} tarefas concluídas removidas` 
      });
    } catch (error) {
      console.error(' Erro ao limpar tarefas concluídas:', error);
      next(error);
    }
  }
};

export { TaskController };