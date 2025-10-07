import prisma from "../prisma.js";

export const SupplyPurchaseController = {
  //   Criar uma nova compra de suprimentos
  async store(req, res, next) {
    try {
      const { supplier, paymentMethod, total, note } = req.body;

      const supplyPurchase = await prisma.supplyPurchase.create({
        data: {
          supplier,
          paymentMethod,
          total,
          note,
        },
      });
      res.status(201).json(supplyPurchase);
    } catch (err) {
      next(err);
    }
  },

  //Listar todas as compras de suprimentos ou filtrar por fornecedor
  async index(req, res, next) {
    try {
      const { supplier } = req.query;
      let supplyPurchases;

      if (supplier) {
        supplyPurchases = await prisma.supplyPurchase.findMany({
          where: { supplier: { contains: supplier } },
        });
      } else {
        supplyPurchases = await prisma.supplyPurchase.findMany();
      }

      res.status(200).json(supplyPurchases);
    } catch (err) {
      next(err);
    }
  },

  // Atualizar uma compra de suprimentos existente
  async update(req, res, next) {
    try {
      const id = Number(req.params.id);
      let query = {};

      if (req.body.supplier) {
        query.supplier = req.body.supplier;
      }
      if (req.body.PaymentMethod) {
        query.PaymentMethod = req.body.PaymentMethod;
      }
      if (req.body.total) {
        query.total = req.body.total;
      }
      if (req.body.note) {
        query.note = req.body.note;
      }

      const sp = await prisma.supplyPurchase.update({
        where: { id },
        data: query,
      });
      res.status(200).json(sp);
    } catch (err) {
      next(err);
    }
  },

  //   Deletar uma compra de suprimentos
  async delete(req, res, next) {
    try {
      const id = Number(req.params.id);
      let sd = await prisma.supplyPurchase.delete({
        where: { id },
      });
      res.status(204).json();
    } catch (err) {
      next(err);
    }
  },
};
