import prisma from "../prisma.js";

export const SupplyPurchaseController = {
  //   Criar uma nova compra de suprimentos
  async store(req, res, next) {
    try {
      const { supplier, paymentMethod, note, supply } = req.body;

      const supplyPurchase = await prisma.supplyPurchase.create({
        data: {
          supplier,
          paymentMethod,
          note,
        },
        include: { items: true },
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
          include: { items: true },
        });
      } else {
        supplyPurchases = await prisma.supplyPurchase.findMany({
          include: { items: true },
        });
      }

      res.status(200).json(supplyPurchases);
    } catch (err) {
      next(err);
    }
  },

  async show(req, res, next) {
    try {
      const id = Number(req.params.id);

      const o = await prisma.supplyPurchase.findUnique({
        where: { id },
        include: { items: true },
      });

      res.status(200).json(o);
    } catch (error) {
      console.error("Erro ao buscar pedido!", error);
      next(error);
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

  async addItem(req, res, next) {
    try {
      const { supplyPurchaseId } = req.params; // ID da compra
      const { supplyId, quantity } = req.body; // ID do insumo e quantidade

      // Buscar insumo
      const supply = await prisma.supply.findUnique({
        where: { id: Number(supplyId) },
      });

      if (!supply) {
        return res.status(404).json({ error: "Insumo não encontrado" });
      }

      // Verificar se o insumo tem preço definido
      if (supply.unitPrice === null || supply.unitPrice === undefined) {
        return res.status(400).json({
          error: "O insumo não possui um preço definido (unitPrice).",
        });
      }

      const unitPrice = Number(supply.unitPrice);
      const subtotal = Number(quantity) * unitPrice;

      // Criar o item de compra
      const item = await prisma.purchaseItem.create({
        data: {
          purchaseId: Number(supplyPurchaseId),
          supplyId: Number(supplyId),
          quantity: Number(quantity),
          unitPrice,
          subtotal,
        },
      });

      // Buscar todos os itens dessa compra e recalcular o total
      const items = await prisma.purchaseItem.findMany({
        where: { purchaseId: Number(supplyPurchaseId) },
      });

      const newTotal = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);

      await prisma.supplyPurchase.update({
        where: { id: Number(supplyPurchaseId) },
        data: { total: parseFloat(newTotal.toFixed(2)) },
      });

      // Retornar sucesso
      res.status(201).json({
        message: "Item adicionado com sucesso!",
        item,
        newTotal,
      });
    } catch (error) {
      console.error("Erro ao adicionar item:", error);
      next(error);
    }
  },

  async updateItem(req, res, next) {},
};
