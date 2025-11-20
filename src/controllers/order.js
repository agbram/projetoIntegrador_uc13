import prisma from "../prisma.js";
import { TaskController } from "./tasks.js";

export const OrderController = {
async store(req, res, next) {
  try {
    const { orderDate, deliveryDate, status, notes, customerId, items, discount } = req.body;

    if (!orderDate || !deliveryDate || !customerId) {
      return res.status(400).json({
        error: "Data do pedido, data de entrega e cliente são obrigatórios",
      });
    }

    const itemsComCalculo = await Promise.all(
      items.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Produto com ID ${item.productId} não encontrado`);
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.salePrice,
          subtotal: product.salePrice * item.quantity,
        };
      })
    );

    // Cálculo do subtotal
    const subtotal = itemsComCalculo.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    // Aplicação do desconto fixo
    let total = subtotal;
    if (discount && discount > 0) {
      total = subtotal - discount;
      total = Math.max(total, 0);
    }

    const createBrazilianDate = (dateString) => {
      if (!dateString) return null;
      
      // Se já é um objeto Date, retorna como está
      if (dateString instanceof Date) return dateString;
      
      // Para strings no formato YYYY-MM-DD
      if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Cria a data no fuso horário de São Paulo
        const [year, month, day] = dateString.split('-');
        // Usa UTC mas com o offset brasileiro para evitar confusão
        return new Date(Date.UTC(
          parseInt(year),
          parseInt(month) - 1, // mês é 0-indexed
          parseInt(day),
          3, 0, 0 // 03:00 UTC = 00:00 Brasília
        ));
      }
      
      // Para outros formatos, tenta parse normal
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };

    const order = await prisma.order.create({
      data: {
        customer: { connect: { id: customerId } },
        orderDate: createBrazilianDate(orderDate),
        deliveryDate: createBrazilianDate(deliveryDate),
        status: status || "PENDING",
        notes,
        subtotal, 
        discount: discount || 0, 
        total, 
        items: {
          create: itemsComCalculo,
        },
        productionSynced: false,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });
    
    console.log("✅ Order created: ", order);
    console.log("📅 Datas salvas:", {
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate
    });

    try {
      await TaskController.syncProductionTasks(order.id);
      console.log("✅ Tarefas de produção sincronizadas para o pedido:", order.id);
    } catch (syncError) {
      console.error("Erro ao sincronizar tarefas de produção:", syncError);
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    next(error);
  }
},

  async updateStatusBasedOnProduction(orderId) {
    try {
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

      if (!order) return;

      const allItemsProduced = await Promise.all(
        order.items.map(async (item) => {
          const productionTask = await prisma.productionTask.findUnique({
            where: { productId: item.productId }
          });
          
          return productionTask && 
                 productionTask.completedQuantity >= item.quantity;
        })
      );

      const isFullyProduced = allItemsProduced.every(Boolean);

      if (isFullyProduced && order.status !== 'PRODUCTION_COMPLETE') {
        await prisma.order.update({
          where: { id: orderId },
          data: { status: 'PRODUCTION_COMPLETE' }
        });
        console.log(`Pedido ${orderId} marcado como produção concluída`);
      }

    } catch (error) {
      console.error(`❌ Erro ao atualizar status do pedido ${orderId}:`, error);
    }
  },

  async checkAllOrdersProductionStatus(req, res, next) {
    try {
      const allOrders = await prisma.order.findMany({
        where: {
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

      let updatedCount = 0;

      for (const order of allOrders) {
        let allItemsProduced = true;

        for (const item of order.items) {
          const productionTask = await prisma.productionTask.findUnique({
            where: { productId: item.productId }
          });
          
          if (!productionTask || 
              productionTask.status !== 'COMPLETED' || 
              productionTask.completedQuantity < item.quantity) {
            allItemsProduced = false;
            break;
          }
        }

        if (allItemsProduced && order.status !== 'READY_FOR_DELIVERY') {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'READY_FOR_DELIVERY' }
          });
          updatedCount++;
          console.log(`✅ Pedido ${order.id} atualizado para PRONTO PARA ENTREGA`);
        }
      }

      res.status(200).json({
        message: `Verificação concluída. ${updatedCount} pedidos atualizados para pronto para entrega.`,
        updatedCount
      });

    } catch (error) {
      console.error('❌ Erro ao verificar status dos pedidos:', error);
      next(error);
    }
  },

async atualizaStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = [
      "PENDING", 
      "IN_PROGRESS", 
      "IN_PRODUCTION", 
      "READY_FOR_DELIVERY",
      "DELIVERED", 
      "CANCELLED",
      "PRODUCTION_COMPLETE" 
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Status inválido. Use: ${validStatuses.join(', ')}` 
      });
    }

    // Busca o pedido atual para verificar o status anterior
    const currentOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!currentOrder) {
      return res.status(404).json({ error: "Pedido não encontrado" });
    }

    // Se o pedido está sendo cancelado E estava sincronizado com produção
    if (status === "CANCELLED" && currentOrder.productionSynced) {
      try {
        console.log(`🔄 Pedido ${id} sendo cancelado - removendo da produção...`);
        // CORREÇÃO: Chamar a função correta do TaskController
        await TaskController.removeOrderFromProduction(id);
      } catch (productionError) {
        console.error(`❌ Erro ao remover pedido ${id} da produção:`, productionError);
      }
    }

    // Atualiza o status do pedido
    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    res.status(200).json(order);
  } catch (error) {
    console.error("❌ Erro ao atualizar status do pedido!", error);
    next(error);
  }
},

  async index(req, res, next) {
    try {
      const { orderDate, deliveryDate, status } = req.query;

      let orders;

      if (orderDate || deliveryDate || status) {
        orders = await prisma.order.findMany({
          where: {
            OR: [
              orderDate ? { orderDate: { equals: new Date(orderDate) } } : {},
              deliveryDate
                ? { deliveryDate: { equals: new Date(deliveryDate) } }
                : {},
              status ? { status: { contains: status } } : {},
            ],
          },
          include: {
            items: {
              include: {
                product: {
                  include: {
                    productionTasks: true, 
                  }
                }
              },
            },
            customer: true,
          },
        });
      } else {
        orders = await prisma.order.findMany({
          include: {
            items: {
              include: {
                product: {
                  include: {
                    productionTasks: true 
                  }
                }
              },
            },
            customer: true,
          },
        });
      }

      const ordersWithProductionProgress = orders.map(order => {
        const itemsWithProgress = order.items.map(item => {
          const productionTasks = item.product.productionTasks; 
          let producedQuantity = 0;
          let isFullyProduced = false;
          let productionProgress = 0;

          const productionTask = productionTasks && productionTasks.length > 0 ? productionTasks[0] : null;
          
          if (productionTask) {
            producedQuantity = Math.min(productionTask.completedQuantity, item.quantity);
            isFullyProduced = productionTask.completedQuantity >= item.quantity;
            productionProgress = (producedQuantity / item.quantity) * 100;
          }

          return {
            ...item,
            producedQuantity,
            isFullyProduced,
            productionProgress,
            productionStatus: productionTask?.status || 'NO_TASK'
          };
        });

        return {
          ...order,
          items: itemsWithProgress
        };
      });

      res.status(200).json(ordersWithProductionProgress);
    } catch (err) {
      console.error("Erro ao buscar pedidos!", err);
      next(err);
    }
  },

  async show(req, res, next) {
    try {
      const id = Number(req.params.id);

      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: {
                include: {
                  productionTasks: true, 
                }
              }
            },
          },
          customer: true,
        },
      });

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      const itemsWithProgress = order.items.map(item => {
        const productionTasks = item.product.productionTasks; 
        const productionTask = productionTasks && productionTasks.length > 0 ? productionTasks[0] : null;
        
        let producedQuantity = 0;
        let isFullyProduced = false;
        let productionProgress = 0;

        if (productionTask) {
          producedQuantity = Math.min(productionTask.completedQuantity, item.quantity);
          isFullyProduced = productionTask.completedQuantity >= item.quantity;
          productionProgress = (producedQuantity / item.quantity) * 100;
        }

        return {
          ...item,
          producedQuantity,
          isFullyProduced,
          productionProgress,
          productionStatus: productionTask?.status || 'NO_TASK'
        };
      });

      const orderWithProgress = {
        ...order,
        items: itemsWithProgress
      };

      res.status(200).json(orderWithProgress);
    } catch (error) {
      console.error("Erro ao buscar pedido!", error);
      next(error);
    }
  },

  async del(req, res, next) {
    try {
      const id = Number(req.params.id);

      const order = await prisma.order.delete({
        where: { id },
      });

      res.status(200).json(order);
    } catch (error) {
      console.error("Erro ao deletar pedido!", error);
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { orderDate, deliveryDate, status, notes } = req.body;

      const order = await prisma.order.update({
        where: { id },
        data: {
          orderDate: orderDate ? new Date(orderDate) : undefined,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
          status,
          notes,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });

      res.status(200).json(order);
    } catch (error) {
      console.error("Erro ao atualizar pedido!", error);
      next(error);
    }
  },

  async addItem(req, res, next) {
    try {
      const { orderId } = req.params;
      const { productId, quantity } = req.body;

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      if (quantity > product.stockQuantity) {
        return res.status(400).json({
          error: `Estoque insuficiente. Disponível: ${product.stockQuantity} unidades.`,
        });
      }

      const unitPrice = product.salePrice;
      const subtotal = quantity * unitPrice;

      const item = await prisma.orderItem.create({
        data: {
          orderId: Number(orderId),
          productId: Number(productId),
          quantity,
          unitPrice,
          subtotal,
        },
        include: {
          product: true,
        },
      });

      const items = await prisma.orderItem.findMany({
        where: { orderId: Number(orderId) },
        include: {
          product: true,
        },
      });

      const newTotal = items.reduce((sum, i) => sum + i.subtotal, 0);

      await prisma.order.update({
        where: { id: Number(orderId) },
        data: { total: parseFloat(newTotal.toFixed(2)) },
      });

      res.status(201).json({ item, newTotal });
    } catch (error) {
      console.error("Erro ao adicionar item!", error);
      next(error);
    }
  },

  async delItem(req, res, next) {
    try {
      const { orderId, itemId } = req.params;

      const item = await prisma.orderItem.delete({
        where: { id: Number(itemId) },
      });

      const items = await prisma.orderItem.findMany({
        where: { orderId: Number(orderId) },
        include: {
          product: true,
        },
      });

      const newTotal = items.reduce((sum, i) => sum + i.subtotal, 0);

      await prisma.order.update({
        where: { id: Number(orderId) },
        data: { total: newTotal },
      });

      res.status(200).json({ deletedItem: item, newTotal });
    } catch (error) {
      console.error("Erro ao excluir item!", error);
      next(error);
    }
  },

  async updateItem(req, res, next) {
    try {
      const { orderId, itemId } = req.params;
      const { productId, quantity } = req.body;

      if (!productId || !quantity) {
        return res
          .status(400)
          .json({ error: "Produto e quantidade são obrigatórios." });
      }

      if (quantity <= 0) {
        return res
          .status(400)
          .json({ error: "A quantidade deve ser maior que zero." });
      }

      const product = await prisma.product.findUnique({
        where: { id: Number(productId) },
      });

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado." });
      }

      if (quantity > product.stockQuantity) {
        return res.status(400).json({
          error: `Estoque insuficiente. Disponível: ${product.stockQuantity} unidades.`,
        });
      }

      const existingItem = await prisma.orderItem.findUnique({
        where: { id: Number(itemId) },
      });

      if (!existingItem) {
        return res
          .status(404)
          .json({ error: "Item do pedido não encontrado." });
      }

      if (existingItem.orderId !== Number(orderId)) {
        return res
          .status(400)
          .json({ error: "Item não pertence a este pedido." });
      }

      const subtotal = product.salePrice * quantity;

      const updatedItem = await prisma.orderItem.update({
        where: { id: Number(itemId) },
        data: {
          productId: Number(productId),
          quantity: Number(quantity),
          subtotal,
        },
        include: {
          product: true,
        },
      });

      res.status(200).json({
        message: "Item atualizado com sucesso!",
        item: updatedItem,
      });
    } catch (error) {
      console.error("Erro ao atualizar item do pedido:", error);
      next(error);
    }
  }
};