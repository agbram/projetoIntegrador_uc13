import prisma from "../prisma.js";

export const OrderController = {
 
  async store(req, res, next) {
    try {
      const { orderDate, deliveryDate, status, notes, customerId } = req.body;

      if (!orderDate || !deliveryDate || !customerId) {
        return res.status(400).json({
          error: "Data do pedido, data de entrega e cliente são obrigatórios",
        });
      }

      const o = await prisma.order.create({
        data: {
          customer: { connect: { id: customerId } }, 
          orderDate: new Date(orderDate),
          deliveryDate: new Date(deliveryDate),
          status: status || "PENDING",
          notes,
          total: 0, 
        },
        include: { items: true, customer: true }, 
      });

      console.log("Order created: ", o);
      res.status(201).json(o);
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
            AND: [
              orderDate ? { orderDate: { equals: new Date(orderDate) } } : {},
              deliveryDate ? { deliveryDate: { equals: new Date(deliveryDate) } } : {},
              status ? { status: { contains: status } } : {},
            ],
          },
          include: { items: true, customer: true },
        });
      } else {
        orders = await prisma.order.findMany({
          include: { items: true, customer: true },
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

      const o = await prisma.order.findUnique({
        where: { id },
        include: { items: true, customer: true },
      });

      res.status(200).json(o);
    } catch (error) {
      console.error("Erro ao buscar pedido!", error);
      next(error);
    }
  },

  
  async del(req, res, next) {
    try {
      const id = Number(req.params.id);

      const o = await prisma.order.delete({
        where: { id },
      });

      res.status(200).json(o);
    } catch (error) {
      console.error("Erro ao deletar pedido!", error);
      next(error);
    }
  },

  
  async update(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { orderDate, deliveryDate, status, notes } = req.body;

      const o = await prisma.order.update({
        where: { id },
        data: {
          orderDate: orderDate ? new Date(orderDate) : undefined,
          deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
          status,
          notes,
        },
        include: { items: true, customer: true },
      });

      res.status(200).json(o);
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
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const unitPrice = product.costPrice;
    const subtotal = quantity * unitPrice;

    const item = await prisma.orderItem.create({
      data: {
        orderId: Number(orderId),
        productId,
        quantity,
        unitPrice,
        subtotal,
      },
    });

    const items = await prisma.orderItem.findMany({
      where: { orderId: Number(orderId) },
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

    
    const items = await prisma.orderItem.findMany({ where: { orderId: Number(orderId) } });
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

async updateItem(req, res, next){
  try {
    const { orderId, itemId } = req.params;
    const { productId, quantity } = req.body; 
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const u = await prisma.orderItem.update({
      data: {
        
      }
    })


  } catch (error) {
    
  }
}


};
