import prisma from "../prisma.js";

export const OrderController = {
  async store(req, res, next) {
    try {
      const { orderDate, deliveryDate, status, notes, customerId, items } = req.body;

      if (!orderDate || !deliveryDate || !customerId) {
        return res.status(400).json({
          error: "Data do pedido, data de entrega e cliente são obrigatórios",
        });
      }

      const itemsComCalculo = await Promise.all(
        items.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId }
          });

          if (!product) {
            throw new Error(`Produto com ID ${item.productId} não encontrado`);
          }

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.salePrice,
            subtotal: product.salePrice * item.quantity
          };
        })
      );

      const total = itemsComCalculo.reduce((sum, item) => sum + item.subtotal, 0);

      const order = await prisma.order.create({
        data: {
          customer: { connect: { id: customerId } },
          orderDate: new Date(orderDate),
          deliveryDate: new Date(deliveryDate),
          status: status || "PENDING",
          notes,
          total,
          items: {
            create: itemsComCalculo
          }
        },
        include: { 
          items: {
            include: {
              product: true 
            }
          }, 
          customer: true 
        },
      });

      console.log("Order created: ", order);
      res.status(201).json(order);
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
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
              deliveryDate ? { deliveryDate: { equals: new Date(deliveryDate) } } : {},
              status ? { status: { contains: status } } : {},
            ],
          },
          include: { 
            items: {
              include: {
                product: true 
              }
            }, 
            customer: true 
          },
        });
      } else {
        orders = await prisma.order.findMany({
          include: { 
            items: {
              include: {
                product: true 
              }
            }, 
            customer: true 
          },
        });
      }

      res.status(200).json(orders);
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
              product: true 
            }
          }, 
          customer: true 
        },
      });

      if (!order) {
        return res.status(404).json({ error: "Pedido não encontrado" });
      }

      res.status(200).json(order);
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
              product: true
            }
          }, 
          customer: true 
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
          product: true
        }
      });

      const items = await prisma.orderItem.findMany({
        where: { orderId: Number(orderId) },
        include: {
          product: true
        }
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
          product: true
        }
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
        return res.status(404).json({ error: "Item do pedido não encontrado." });
      }

      if (existingItem.orderId !== Number(orderId)) {
        return res.status(400).json({ error: "Item não pertence a este pedido." });
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
  },

  async atualizaStatus(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!["PENDING", "IN_PROGRESS", "DELIVERED", "CANCELLED"].includes(status)) {
        return res.status(400).json({ error: "Status inválido." });
      }

      const order = await prisma.order.update({
        where: { id },
        data: { status }
      });

      res.status(200).json(order);
    } catch (error) {
      console.error("Erro ao atualizar status do pedido!", error);
      next(error);
    }
  },
}