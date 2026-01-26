import prisma from "../prisma.js";

export const IngredientController = {
  // Criar novo ingrediente na matriz
  async store(req, res, next) {
    try {
      const {
        name,
        unit,
        unitCost,
        category,
        supplier,
        notes,
        isActive = true
      } = req.body;

      if (!name || !unit || unitCost === undefined) {
        return res.status(400).json({ error: "Nome, unidade e custo são obrigatórios" });
      }

      const ingredient = await prisma.ingredient.create({
        data: {
          name,
          unit,
          unitCost: parseFloat(unitCost),
          category,
          supplier,
          notes,
          isActive
        }
      });

      res.status(201).json(ingredient);
    } catch (error) {
      console.error("Erro ao criar ingrediente:", error);
      next(error);
    }
  },

  // Listar todos os ingredientes (matriz completa) com filtros e busca
  async index(req, res, next) {
    try {
      const { 
        search, 
        category, 
        supplier, 
        isActive = 'true',
        page = 1,
        limit = 20
      } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      let where = {};

      // Busca por nome
      if (search) {
        where.name = { contains: search };
      }

      // Filtro por categoria
      if (category) {
        where.category = category;
      }

      // Filtro por fornecedor
      if (supplier) {
        where.supplier = { contains: supplier };
      }

      // Filtro por status
      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      // Buscar ingredientes com paginação
      const [ingredients, total] = await Promise.all([
        prisma.ingredient.findMany({
          where,
          orderBy: { name: 'asc' },
          skip,
          take: parseInt(limit)
        }),
        prisma.ingredient.count({ where })
      ]);

      res.status(200).json({
        ingredients,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error("Erro ao buscar ingredientes:", error);
      next(error);
    }
  },

  // Buscar ingrediente por ID
  async show(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const ingredient = await prisma.ingredient.findUniqueOrThrow({
        where: { id },
        include: {
          products: {
            include: {
              product: true
            },
            take: 10 // Limita a quantidade de produtos relacionados
          }
        }
      });

      res.status(200).json(ingredient);
    } catch (error) {
      console.error("Erro ao buscar ingrediente:", error);
      next(error);
    }
  },

  // Atualizar ingrediente
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const data = req.body;

      // Converter unitCost para float se existir
      if (data.unitCost !== undefined) {
        data.unitCost = parseFloat(data.unitCost);
      }

      const ingredient = await prisma.ingredient.update({
        where: { id: parseInt(id) },
        data
      });

      res.status(200).json(ingredient);
    } catch (error) {
      console.error("Erro ao atualizar ingrediente:", error);
      next(error);
    }
  },

  // Excluir ingrediente (verificando se está em uso)
  async delete(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar se o ingrediente está sendo usado em algum produto
      const productIngredients = await prisma.productIngredient.findMany({
        where: { ingredientId: parseInt(id) },
        include: {
          product: {
            select: { name: true }
          }
        }
      });

      if (productIngredients.length > 0) {
        return res.status(400).json({ 
          error: "Não é possível excluir este ingrediente pois ele está sendo usado em produtos",
          products: productIngredients.map(pi => ({
            productId: pi.productId,
            productName: pi.product.name
          }))
        });
      }

      await prisma.ingredient.delete({
        where: { id: parseInt(id) }
      });

      res.status(200).json({ message: "Ingrediente excluído com sucesso" });
    } catch (error) {
      console.error("Erro ao excluir ingrediente:", error);
      next(error);
    }
  },

  // Busca rápida de ingredientes para autocomplete
  async search(req, res, next) {
    try {
      const { q } = req.query;

      if (!q || q.length < 2) {
        return res.status(200).json([]);
      }

      const ingredients = await prisma.ingredient.findMany({
        where: {
          name: { contains: q },
          isActive: true
        },
        select: {
          id: true,
          name: true,
          unit: true,
          unitCost: true,
          category: true
        },
        orderBy: { name: 'asc' },
        take: 10
      });

      res.status(200).json(ingredients);
    } catch (error) {
      console.error("Erro na busca de ingredientes:", error);
      next(error);
    }
  },

  // Relatório da matriz de ingredientes
  async report(req, res, next) {
    try {
      const [totalIngredients, activeIngredients, byCategory, topExpensive] = await Promise.all([
        prisma.ingredient.count(),
        prisma.ingredient.count({ where: { isActive: true } }),
        prisma.ingredient.groupBy({
          by: ['category'],
          _count: true,
          _avg: { unitCost: true },
          where: { isActive: true }
        }),
        prisma.ingredient.findMany({
          where: { isActive: true },
          orderBy: { unitCost: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            unit: true,
            unitCost: true,
            category: true,
            supplier: true
          }
        })
      ]);

      res.status(200).json({
        summary: {
          totalIngredients,
          activeIngredients,
          inactiveIngredients: totalIngredients - activeIngredients
        },
        byCategory: byCategory.map(cat => ({
          category: cat.category || 'Sem categoria',
          count: cat._count,
          averageCost: cat._avg.unitCost
        })),
        topExpensive
      });
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      next(error);
    }
  }
};