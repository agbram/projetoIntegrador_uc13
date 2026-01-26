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
        weight,  // ADICIONE ESTE
        yield: productYield // ADICIONE ESTE (renomeado porque 'yield' é palavra reservada)
      } = req.body;

      if (!name || !category) {
        return res.status(400).json({ error: "Nome e categoria são obrigatórios" });
      }

      console.log("=== DEBUG IMAGEM STORE ===");
      console.log("Recebeu fotoData?", !!fotoData);
      if (fotoData) {
        console.log("Tamanho:", fotoData.length);
        console.log("Primeiros 50 chars:", fotoData.substring(0, 50));
      }

      let fotoUrl = makeUrlFromImagemBase64(fotoData);

      const p = await prisma.product.create({
        data: {
          name,
          description: description || null,
          category,
          costPrice: costPrice ? parseFloat(costPrice) : null,
          markupPercent: markupPercent ? parseFloat(markupPercent) : null,
          priceStatus: "NOT_CALCULATED", 
          isActive: isActive !== undefined ? isActive : true,
          fotoUrl,
          weight: weight ? parseFloat(weight) : null,
          yield: productYield ? parseFloat(productYield) : null, // Note: 'yield' é palavra reservada
        },
      });
      
      console.log("Product created:", p);
      console.log("Foto URL no banco:", p.fotoUrl);
      res.status(201).json(p);
    } catch (err) {
      console.error("Error details: ", err);
      next(err);
    }
  },

    async index(req, res, next) {
      try {
        const { name, category, isActive, priceStatus } = req.query;

        let products;

        if (name || category || isActive !== undefined || priceStatus) {
          products = await prisma.product.findMany({
            where: {
              OR: [
                name ? { name: { contains: name } } : undefined,
                category ? { category: { contains: category } } : undefined,
                isActive !== undefined ? { isActive: isActive === 'true' } : undefined, 
                priceStatus !== undefined ? {priceStatus: priceStatus} : undefined           
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
            include: {
              ingredients: {
                include: {
                  ingredient: true
              }
            }
          }
        });

        res.status(200).json(p);
      } catch (error) {
        console.error("Erro: ID de produto não encontrado!");
        next(error);
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
