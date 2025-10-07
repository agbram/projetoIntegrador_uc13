import prisma from "../prisma.js";

export const SupplyPurchaseController = {
  //   Criar uma nova compra de suprimentos
  async store(req, res, next) {
    try {
      const supplyPurchase = await prisma.supplyPurchase.create({
        data: {
          supplier,
          PaymentMethod,
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
   async update (req, res, next) {
    try {
        
    } catch (error) {
        
    }
   }
};
