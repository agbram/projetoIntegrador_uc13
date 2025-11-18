import prisma from "../prisma.js";
import makeUrlFromImagemBase64 from "../function/makeUrlFromImagemBase64.js";

export const ProductController = {
  async store(req, res, next) {
    try {
      const {
        name,
        description,
        category,
        costPrice,
        markupPercent,
        isActive,
        fotoData,
      } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: "Nome e categoria são obrigatórios" });
      }

      let fotoUrl = makeUrlFromImagemBase64(fotoData);
      
      const salePrice = costPrice * (1 + markupPercent / 100);

      const p = await prisma.product.create({
        data: {
          name,
          description,
          category,
          costPrice,
          markupPercent,
          salePrice,
          isActive,
          fotoUrl,
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
        products = await prisma.product.findMany({
          where: {
            OR: [
              name ? { name: { contains: name } } : undefined,
              category ? { category: { contains: category } } : undefined,
              isActive !== undefined ? { isActive: isActive === 'true' } : undefined,            
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
      const id = Number(req.params.id);

      const currentProduct = await prisma.product.findUnique({
      where: { id }
    });

    if (!currentProduct) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }


      let data = {};

      if (req.body.name) data.name = req.body.name;
      if (req.body.description) data.description = req.body.description;
      if (req.body.category) data.category = req.body.category;
      if (req.body.costPrice) data.costPrice = req.body.costPrice;
      if (req.body.markupPercent) data.markupPercent = req.body.markupPercent;
      if (req.body.isActive) data.isActive = req.body.isActive;
      if (req.body.fotoData) data.fotoUrl = makeUrlFromImagemBase64(req.body.fotoData);

    const costPrice = data.costPrice !== undefined ? data.costPrice : currentProduct.costPrice;
    const markupPercent = data.markupPercent !== undefined ? data.markupPercent : currentProduct.markupPercent;

      data.salePrice = costPrice * (1 + markupPercent / 100);


      const p = await prisma.product.update({
        where: { id },
        data: data,
      });

      res.status(200).json(p);
    } catch (error) {
      console.error("Produto não encontrado ou não pode ser alterado...");
      next(error);
    }
  },

};
