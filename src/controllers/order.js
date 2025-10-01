import prisma from "../prisma.js";

export const OrderController = {
  async store(req, res, next) {
    try {
      console.log(req.body);
      const { orderDate, deliveryDate, status, notes, total } = req.body;

      if (!orderDate || !deliveryDate || !total) {
        return res.status(400).json({
          error:"Data do pedido, Data de entrega e Total são obrigatórios"});
      }

      const o = await prisma.order.create({
        data: {
          orderDate,
          deliveryDate,
          status,
          notes,
          total,
        },
      });

      console.log("Order created: ", o);
      res.status(201).json(o);
    } catch (error) {
      console.error("Error details: ", error);
      next(e);
    }
  },

  async index(req, res, next) {
    try {
      const { orderDate, deliveryDate, status } = req.query;

      let orders;

      if (orderDate || deliveryDate || status) {
        orders = await prisma.user.findMany({
          where: {
            OR: [
              orderDate ? { orderDate: { contains: orderDate } } : undefined,
              deliveryDate
                ? { deliveryDate: { contains: deliveryDate } }
                : undefined,
              status ? { status: { contains: status } } : undefined,
            ].filter(Boolean),
          },

        });
      } else {
        orders = await prisma.order.findMany();
      }
      res.status(200).json(orders);
    } catch (err) {
      console.error("Erro ao buscar pedidos!");
      next(err);
    }
  },

  async show(req, res, next) {
    try {
      const id = Number(req.params.id);

      const o = await prisma.order.findFirstOrThrow({
        where: { id },
      });

      res.status(200).json(o);
    } catch (error) {
      console.error("Erro ao buscar o pedido!");
      next(error);
    }
  },

  async del(req, res, next) {
    try {
      const id = Number(req.params.id);
      console.log(id);

      const o = await prisma.order.delete({
        where: { id },
      });
      console.log(o);
      res.status(200).json(o);
    } catch (error) {
      console.error("Erro ao buscar o pedido!");
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      let body = {};

      if (req.body.orderDate) body.orderDate = req.body.orderDate;
      if (req.body.deliveryDate) body.deliveryDate = req.body.deliveryDate;
      if (req.body.status) body.status = req.body.status;
      if (req.body.notes) body.notes = req.body.notes;
      if (req.body.total) body.total = req.body.total;

      const id = Number(req.params.id);

      const o = await prisma.user.update({
        where: { id },
        data: body,
      });

      res.status(200).json(o);
    } catch (error) {
      console.error("Pedido não encontrado ou não pode ser alterado!");
      next(error);
    }
  },
};
