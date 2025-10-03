import prisma from "../prisma.js";

export const ProductController = {
  async store(req, res, next) {
    try {
      const {
        name,
        description,
        category,
        costPrice,
        markupPercent,
        stockQuantity,
        isActive,
      } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: "Nome e categoria são obrigatórios" });
      }

      const salePrice = costPrice * (1 + markupPercent / 100);

      const p = await prisma.product.create({
        data: {
          name,
          description,
          category,
          costPrice,
          markupPercent,
          salePrice,
          stockQuantity,
          isActive,
        },
      });
      console.log("Product created: ", p);
      res.status(201).json(p);
    } catch (err) {
      console.log("Error details: ", err);
      next(err);
    }
  },

  async index(req, res, next) {
    try {
      const { name, category, isActive } = req.query;

      let products;

      if (name || category || isActive) {
        user = await prisma.product.findMany({
          where: {
            OR: [
              name ? { name: { contains: name } } : undefined,
              category ? { category: { contains: category } } : undefined,
              isActive ? { isActive: { contains: isActive } } : undefined,
            ].filter(Boolean),
          },
        });
      } else {
        products = await prisma.product.findMany();
      }

      res.status(200).json(products);
    } catch (error) {
      console.error("Erro: ao buscar produtos");
      next(error);
    }
  },

  async show(req, res, next) {
    try {
      const id = Number(req.params.id);

      const p = await prisma.product.findFirstOrThrow({
        where: { id },
      });

      res.status(200).json(p);
    } catch (error) {
      console.error("Erro: ID de produto não encontrado!");
    }
  },

  async del(req, res, next) {
    try {
      const id = Number(req.params.id);

      const p = await prisma.product.delete({
        where: { id },
      });
      res.status(200).json(p);
    } catch (error) {
      console.error("Error: Id de produto não encontrado!");
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      let body = {};

      if (req.body.name) body.name = req.body.name;
      if (req.body.description) body.description = req.body.description;
      if (req.body.categoryId) body.categoryId = req.body.categoryId;
      if (req.body.costPrice) body.costPrice = req.body.costPrice;
      if (req.body.markupPercent) body.markupPercent = req.body.markupPercent;
      if (req.body.salePrice) body.salePrice = req.body.salePrice;
      if (req.body.stockQuantity) body.stockQuantity = req.body.stockQuantity;
      if (req.body.isActive) body.isActive = req.body.isActive;

      const id = Number(req.params.id);

      const p = await prisma.product.update({
        where: { id },
        data: body,
      });

      res.status(200).json(p);
    } catch (error) {
      console.error("Produto não encontrado ou não pode ser alterado...");
      next(error);
    }
  },
};
