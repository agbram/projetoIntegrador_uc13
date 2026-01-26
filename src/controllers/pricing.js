import prisma from "../prisma.js";

// Função para converter unidades
const convertUnit = (value, fromUnit, toUnit) => {
  const conversions = {
    'kg': { 'g': 1000, 'mg': 1000000, 'kg': 1 },
    'g': { 'kg': 0.001, 'mg': 1000, 'g': 1 },
    'mg': { 'kg': 0.000001, 'g': 0.001, 'mg': 1 },
    'L': { 'ml': 1000, 'cl': 100, 'L': 1 },
    'ml': { 'L': 0.001, 'cl': 0.1, 'ml': 1 },
    'cl': { 'L': 0.01, 'ml': 10, 'cl': 1 },
    'un': { 'un': 1 }
  };

  if (fromUnit === toUnit) return value;
  
  if (conversions[fromUnit] && conversions[fromUnit][toUnit]) {
    return value * conversions[fromUnit][toUnit];
  }
  
  if (conversions[toUnit] && conversions[toUnit][fromUnit]) {
    return value / conversions[toUnit][fromUnit];
  }
  
  throw new Error(`Conversão não suportada: ${fromUnit} para ${toUnit}`);
};

const calculateTotalCostWithConversion = (unitCost, unitCostUnit, quantity, quantityUnit) => {
  if (unitCostUnit === quantityUnit) {
    return unitCost * quantity;
  }
  
  try {
    const convertedQuantity = convertUnit(quantity, quantityUnit, unitCostUnit);
    return unitCost * convertedQuantity;
  } catch (error) {
    try {
      const convertedUnitCost = convertUnit(unitCost, unitCostUnit, quantityUnit);
      return convertedUnitCost * quantity;
    } catch (error2) {
      console.warn(`Não foi possível converter ${unitCostUnit} para ${quantityUnit}. Usando cálculo direto.`);
      return unitCost * quantity;
    }
  }
};

export const PricingController = {
  // Lista produtos para precificação (apenas NOT_CALCULATED)
  async getProductsForPricing(req, res, next) {
    try {
      const { search, category } = req.query;

      const where = {
        priceStatus: "NOT_CALCULATED",
        isActive: true
      };

      if (search && typeof search === 'string' && search.trim()) {
        where.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } }
        ];
      }

      if (category && typeof category === 'string' && category.trim()) {
        where.category = category.trim();
      }

      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          fotoUrl: true,
          weight: true,
          yield: true,
          createdAt: true,
          priceStatus: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      res.status(200).json(products);
    } catch (error) {
      console.error("Erro ao buscar produtos para precificação:", error);
      next(error);
    }
  },

  // Lista produtos já calculados para edição
  async getCalculatedProducts(req, res, next) {
    try {
      const { search, category } = req.query;

      const where = {
        priceStatus: "CALCULATED",
        isActive: true
      };

      if (search && typeof search === 'string' && search.trim()) {
        where.OR = [
          { name: { contains: search.trim(), mode: 'insensitive' } },
          { description: { contains: search.trim(), mode: 'insensitive' } }
        ];
      }

      if (category && typeof category === 'string' && category.trim()) {
        where.category = category.trim();
      }

      const products = await prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          fotoUrl: true,
          costPrice: true,
          salePrice: true,
          profitPercent: true,
          markupPercent: true,
          weight: true,
          yield: true,
          createdAt: true,
          updatedAt: true,
          priceStatus: true,
          isActive: true
        },
        orderBy: { updatedAt: 'desc' },
        take: 50
      });

      res.status(200).json(products);
    } catch (error) {
      console.error("Erro ao buscar produtos calculados:", error);
      res.status(500).json({ 
        error: "Erro interno ao buscar produtos calculados",
        message: error.message
      });
    }
  },

  // Carrega detalhes completos do produto para precificação
  async getProductForPricing(req, res, next) {
    try {
      const { productId } = req.params;

      if (!productId || isNaN(parseInt(productId))) {
        return res.status(400).json({ error: "ID do produto inválido" });
      }

      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: {
          ingredients: {
            include: {
              ingredient: true
            },
            orderBy: { totalCost: 'desc' }
          }
        }
      });

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Calcular custo total dos ingredientes
      const totalIngredientCost = product.ingredients.reduce((sum, pi) => {
        return sum + (pi.totalCost || 0);
      }, 0);
      
      // Calcular custo por unidade
      const yieldValue = product.yield || 1;
      const costPerUnit = yieldValue > 0 ? totalIngredientCost / yieldValue : totalIngredientCost;

      res.status(200).json({
        ...product,
        costSummary: {
          totalIngredientCost: parseFloat(totalIngredientCost.toFixed(2)),
          costPerUnit: parseFloat(costPerUnit.toFixed(2)),
          yield: yieldValue,
          ingredientCount: product.ingredients.length
        }
      });
    } catch (error) {
      console.error("Erro ao carregar produto para precificação:", error);
      next(error);
    }
  },

  // Adiciona um ingrediente à matriz do produto
  async addIngredient(req, res, next) {
    try {
      const { productId } = req.params;
      const { ingredientId, quantity, unit, notes } = req.body;

      if (!productId || isNaN(parseInt(productId))) {
        return res.status(400).json({ error: "ID do produto inválido" });
      }
      
      if (!ingredientId || isNaN(parseInt(ingredientId))) {
        return res.status(400).json({ error: "ID do ingrediente inválido" });
      }

      // Verificar se o produto existe
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
      });

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Verificar se o produto já tem preço calculado
      if (product.priceStatus === "CALCULATED") {
        return res.status(400).json({ 
          error: "Produto já possui preço calculado. Recalcule o preço primeiro." 
        });
      }

      // Buscar ingrediente
      const ingredient = await prisma.ingredient.findUnique({
        where: { id: parseInt(ingredientId) }
      });

      if (!ingredient) {
        return res.status(404).json({ error: "Ingrediente não encontrado" });
      }

      // Validar quantidade
      if (!quantity || parseFloat(quantity) <= 0) {
        return res.status(400).json({ error: "Quantidade deve ser maior que zero" });
      }

      // Calcular custo total COM CONVERSÃO DE UNIDADES
      const totalCost = calculateTotalCostWithConversion(
        ingredient.unitCost,
        ingredient.unit,
        parseFloat(quantity),
        unit
      );

      const productIngredient = await prisma.productIngredient.create({
        data: {
          productId: parseInt(productId),
          ingredientId: parseInt(ingredientId),
          quantity: parseFloat(quantity),
          unit,
          totalCost: parseFloat(totalCost.toFixed(2)),
          notes
        },
        include: {
          ingredient: true
        }
      });

      res.status(201).json({
        ...productIngredient,
        conversionInfo: {
          originalUnitCost: ingredient.unitCost,
          originalUnit: ingredient.unit,
          usedUnit: unit,
          conversionPerformed: ingredient.unit !== unit
        }
      });
    } catch (error) {
      console.error("Erro ao adicionar ingrediente:", error);
      next(error);
    }
  },

  // Remove um ingrediente da matriz do produto
  async removeIngredient(req, res, next) {
    try {
      const { productId, ingredientId } = req.params;

      if (!productId || isNaN(parseInt(productId))) {
        return res.status(400).json({ error: "ID do produto inválido" });
      }
      
      if (!ingredientId || isNaN(parseInt(ingredientId))) {
        return res.status(400).json({ error: "ID do ingrediente inválido" });
      }

      // Verificar se o produto existe
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) }
      });

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Verificar se o produto já tem preço calculado
      if (product.priceStatus === "CALCULATED") {
        return res.status(400).json({ 
          error: "Produto já possui preço calculado. Recalcule o preço primeiro." 
        });
      }

      await prisma.productIngredient.delete({
        where: {
          product_ingredient_unique: {
            productId: parseInt(productId),
            ingredientId: parseInt(ingredientId)
          }
        }
      });

      res.status(200).json({ message: "Ingrediente removido com sucesso" });
    } catch (error) {
      console.error("Erro ao remover ingrediente:", error);
      next(error);
    }
  },

  async updateIngredient(req, res, next) {
  try {
    const { productId, ingredientId } = req.params;
    const { quantity, unit, notes } = req.body;

    if (!productId || isNaN(parseInt(productId))) {
      return res.status(400).json({ error: "ID do produto inválido" });
    }
    
    if (!ingredientId || isNaN(parseInt(ingredientId))) {
      return res.status(400).json({ error: "ID do ingrediente inválido" });
    }

    // Verificar se o produto existe
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) }
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Verificar se o produto já tem preço calculado
    if (product.priceStatus === "CALCULATED") {
      return res.status(400).json({ 
        error: "Produto já possui preço calculado. Recalcule o preço primeiro." 
      });
    }

    // Buscar o ProductIngredient existente
    const productIngredient = await prisma.productIngredient.findUnique({
      where: {
        id: parseInt(ingredientId)
      },
      include: {
        ingredient: true
      }
    });

    if (!productIngredient) {
      return res.status(404).json({ error: "Ingrediente não encontrado neste produto" });
    }

    if (productIngredient.productId !== parseInt(productId)) {
      return res.status(400).json({ error: "Ingrediente não pertence a este produto" });
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: productIngredient.ingredientId }
    });

    if (!ingredient) {
      return res.status(404).json({ error: "Ingrediente base não encontrado" });
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      return res.status(400).json({ error: "Quantidade deve ser maior que zero" });
    }

    const totalCost = calculateTotalCostWithConversion(
      ingredient.unitCost,
      ingredient.unit,
      parseFloat(quantity),
      unit
    );

    const updated = await prisma.productIngredient.update({
      where: {
        id: parseInt(ingredientId)
      },
      data: {
        quantity: parseFloat(quantity),
        unit,
        totalCost: parseFloat(totalCost.toFixed(2)),
        notes
      },
      include: {
        ingredient: true
      }
    });

    res.status(200).json({
      ...updated,
      conversionInfo: {
        originalUnitCost: ingredient.unitCost,
        originalUnit: ingredient.unit,
        usedUnit: unit,
        conversionPerformed: ingredient.unit !== unit
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar ingrediente:", error);
    next(error);
  }
},

async simulatePrice(req, res, next) {
  try {
    const { productId } = req.params;
    const {
      markupPercent,
      profitPercent,
      expensePercent = 0,
      taxPercent = 0,
      minProfit = 0
    } = req.body;

    console.log("Simulação recebida:", { productId, markupPercent, profitPercent, expensePercent, taxPercent, minProfit });

    if (!productId || isNaN(parseInt(productId))) {
      return res.status(400).json({ error: "ID do produto inválido" });
    }

    // Buscar produto com ingredientes
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    // Calcular custo total dos ingredientes
    const totalIngredientCost = product.ingredients.reduce((sum, pi) => {
      return sum + (pi.totalCost || 0);
    }, 0);
    
    if (totalIngredientCost === 0) {
      return res.status(400).json({ error: "Adicione ingredientes para calcular o preço" });
    }

    // Calcular custo por unidade
    const yieldValue = product.yield || 1;
    const costPerUnit = yieldValue > 0 ? totalIngredientCost / yieldValue : totalIngredientCost;

    console.log("Cálculos base:", { totalIngredientCost, yieldValue, costPerUnit });

    // VALORES CONVERTIDOS
    const markupValue = markupPercent ? parseFloat(markupPercent) : null;
    const profitValue = profitPercent ? parseFloat(profitPercent) : null;
    const expenseValue = parseFloat(expensePercent || 0);
    const taxValue = parseFloat(taxPercent || 0);
    const minProfitValue = parseFloat(minProfit || 0);

    // 1. Calcular despesas (sobre o custo)
    const expenseAmount = costPerUnit * (expenseValue / 100);
    
    // Custo total (ingredientes + despesas)
    const totalCost = costPerUnit + expenseAmount;

    let salePrice = 0;
    let profit = 0;
    let profitMargin = 0;
    let markup = 0;

    // ESTRATÉGIA 1: Cálculo por MARKUP
    if (markupValue !== null) {
      markup = markupValue;
      
      // Preço antes dos impostos
      const priceBeforeTax = totalCost * (1 + markupValue / 100);
      
      // Calcular impostos sobre o preço de venda
      const taxAmount = priceBeforeTax * (taxValue / 100);
      
      // Preço final
      salePrice = priceBeforeTax + taxAmount;
      
      // Lucro antes dos impostos
      const profitBeforeTax = priceBeforeTax - totalCost;
      
      // Lucro após impostos (impostos são repassados ao cliente)
      profit = profitBeforeTax;
      
      // Margem de lucro real
      profitMargin = (profit / salePrice) * 100;
    }
    // ESTRATÉGIA 2: Cálculo por MARGEM DE LUCRO
    else if (profitValue !== null) {
      profitMargin = profitValue;
      
      // Fórmula corrigida: Preço = Custo Total / (1 - Margem/100)
      // Mas precisamos isolar os impostos primeiro
      
      // Primeiro, calcular o preço que daria a margem desejada SEM impostos
      // Margem = (Preço - Custo Total) / Preço
      // Preço = Custo Total / (1 - Margem/100)
      const priceBeforeTax = totalCost / (1 - profitValue / 100);
      
      // Agora calcular impostos sobre esse preço
      const taxAmount = priceBeforeTax * (taxValue / 100);
      
      // Preço final (com impostos)
      salePrice = priceBeforeTax + taxAmount;
      
      // Lucro (antes dos impostos, pois impostos são repassados)
      profit = priceBeforeTax - totalCost;
      
      // Recalcular a margem REAL considerando o preço final com impostos
      profitMargin = (profit / salePrice) * 100;
      
      // Calcular markup real
      markup = ((priceBeforeTax - totalCost) / totalCost) * 100;
    } else {
      return res.status(400).json({ error: "Informe markupPercent ou profitPercent" });
    }

    // 3. Aplicar lucro mínimo
    let minProfitApplied = false;
    if (profit < minProfitValue) {
      // Recalcular com lucro mínimo
      const requiredProfit = minProfitValue;
      const priceBeforeTax = totalCost + requiredProfit;
      const taxAmount = priceBeforeTax * (taxValue / 100);
      salePrice = priceBeforeTax + taxAmount;
      profit = requiredProfit;
      profitMargin = (profit / salePrice) * 100;
      markup = (requiredProfit / totalCost) * 100;
      minProfitApplied = true;
    }

    // Estrutura do breakdown
    const breakdown = {
      ingredients: parseFloat(costPerUnit.toFixed(2)),
      expenses: parseFloat(expenseAmount.toFixed(2)),
      taxes: parseFloat((salePrice - (salePrice / (1 + taxValue/100))).toFixed(2)),
      profit: parseFloat(profit.toFixed(2))
    };

    const result = {
      ingredientCost: parseFloat(totalIngredientCost.toFixed(2)),
      costPerUnit: parseFloat(costPerUnit.toFixed(2)),
      salePrice: parseFloat(salePrice.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      profitMargin: parseFloat(profitMargin.toFixed(2)),
      markup: parseFloat(markup.toFixed(2)),
      yield: yieldValue,
      minProfitApplied,
      breakdown
    };

    console.log("Resultado da simulação:", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("Erro na simulação de preço:", error);
    next(error);
  }
},

  // Calcula e salva o preço final do produto - VERSÃO SIMPLIFICADA E FUNCIONAL
  async calculateAndSavePrice(req, res, next) {
    try {
      const { productId } = req.params;
      const {
        markupPercent,
        profitPercent,
        expensePercent = 0,
        taxPercent = 0,
        minProfit = 0
      } = req.body;

      console.log("Salvando preço:", { productId, markupPercent, profitPercent, expensePercent, taxPercent, minProfit });

      if (!productId || isNaN(parseInt(productId))) {
        return res.status(400).json({ error: "ID do produto inválido" });
      }

      // Buscar produto com ingredientes
      const product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: {
          ingredients: {
            include: {
              ingredient: true
            }
          }
        }
      });

      if (!product) {
        return res.status(404).json({ error: "Produto não encontrado" });
      }

      // Calcular custo total dos ingredientes
      const totalIngredientCost = product.ingredients.reduce((sum, pi) => {
        return sum + (pi.totalCost || 0);
      }, 0);
      
      if (totalIngredientCost === 0) {
        return res.status(400).json({ error: "Adicione ingredientes para calcular o preço" });
      }

      // Calcular custo por unidade
      const yieldValue = product.yield || 1;
      const costPerUnit = yieldValue > 0 ? totalIngredientCost / yieldValue : totalIngredientCost;

      // CALCULAR COM BASE NO MARKUP OU MARGEM
      let salePrice = 0;
      let profit = 0;
      let profitMargin = 0;
      let markup = 0;

      const markupValue = markupPercent ? parseFloat(markupPercent) : null;
      const profitValue = profitPercent ? parseFloat(profitPercent) : null;
      const expenseValue = parseFloat(expensePercent || 0);
      const taxValue = parseFloat(taxPercent || 0);
      const minProfitValue = parseFloat(minProfit || 0);

      // 1. Calcular despesas sobre o custo
      const expenseAmount = costPerUnit * (expenseValue / 100);
      const costWithExpenses = costPerUnit + expenseAmount;

      if (markupValue !== null) {
        // Usando markup
        markup = markupValue;
        salePrice = costWithExpenses * (1 + markupValue / 100);
        profit = salePrice - costWithExpenses;
        profitMargin = (profit / salePrice) * 100;
      } else if (profitValue !== null) {
        // Usando margem de lucro
        profitMargin = profitValue;
        salePrice = costWithExpenses / (1 - profitValue / 100);
        profit = salePrice - costWithExpenses;
        markup = ((salePrice - costWithExpenses) / costWithExpenses) * 100;
      } else {
        return res.status(400).json({ error: "Informe markupPercent ou profitPercent" });
      }

      // 2. Calcular impostos sobre a venda
      const taxAmount = salePrice * (taxValue / 100);
      salePrice += taxAmount; // Adicionar impostos ao preço final

      // 3. Aplicar lucro mínimo
      let minProfitApplied = false;
      if (profit < minProfitValue) {
        profit = minProfitValue;
        salePrice = costWithExpenses + minProfitValue + taxAmount;
        minProfitApplied = true;
        // Recalcular markup e margem com novo preço
        profitMargin = (profit / salePrice) * 100;
        markup = ((salePrice - costWithExpenses) / costWithExpenses) * 100;
      }

      // Atualizar produto com preços calculados
      const updatedProduct = await prisma.product.update({
        where: { id: parseInt(productId) },
        data: {
          costPrice: parseFloat(costPerUnit.toFixed(2)),
          salePrice: parseFloat(salePrice.toFixed(2)),
          markupPercent: parseFloat(markup.toFixed(2)),
          profitPercent: parseFloat(profitMargin.toFixed(2)),
          expensePercent: expensePercent ? parseFloat(expensePercent) : null,
          taxPercent: taxPercent ? parseFloat(taxPercent) : null,
          minProfit: minProfit ? parseFloat(minProfit) : null,
          priceStatus: "CALCULATED",
          updatedAt: new Date()
        }
      });

      // Estrutura do breakdown
      const breakdown = {
        ingredients: parseFloat(totalIngredientCost.toFixed(2)),
        expenses: parseFloat(expenseAmount.toFixed(2)),
        taxes: parseFloat(taxAmount.toFixed(2)),
        profit: parseFloat(profit.toFixed(2))
      };

      const calculation = {
        ingredientCost: parseFloat(totalIngredientCost.toFixed(2)),
        costPerUnit: parseFloat(costPerUnit.toFixed(2)),
        salePrice: parseFloat(salePrice.toFixed(2)),
        profit: parseFloat(profit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2)),
        markup: parseFloat(markup.toFixed(2)),
        yield: yieldValue,
        minProfitApplied,
        breakdown
      };

      res.status(200).json({
        product: updatedProduct,
        calculation,
        ingredients: {
          totalCost: parseFloat(totalIngredientCost.toFixed(2)),
          yield: yieldValue
        }
      });
    } catch (error) {
      console.error("Erro ao calcular e salvar preço:", error);
      next(error);
    }
  },

  // Recalcula preço (para produtos já calculados)
  async recalculatePrice(req, res, next) {
    try {
      const { productId } = req.params;
      const {
        markupPercent,
        profitPercent,
        expensePercent = 0,
        taxPercent = 0,
        minProfit = 0
      } = req.body;

      // Apenas verificar se foi fornecido markup ou margem
      if (!markupPercent && !profitPercent) {
        return res.status(400).json({ 
          error: "Informe markupPercent ou profitPercent" 
        });
      }

      // Usar a mesma lógica do calculateAndSavePrice
      return await this.calculateAndSavePrice(req, res, next);
    } catch (error) {
      console.error("Erro ao recalcular preço:", error);
      next(error);
    }
  },

  // Reseta o preço do produto (volta para NOT_CALCULATED)
  async resetPrice(req, res, next) {
    try {
      const { productId } = req.params;

      const updatedProduct = await prisma.product.update({
        where: { id: parseInt(productId) },
        data: {
          costPrice: null,
          salePrice: null,
          markupPercent: null,
          profitPercent: null,
          expensePercent: null,
          taxPercent: null,
          minProfit: null,
          priceStatus: "NOT_CALCULATED",
          updatedAt: new Date()
        }
      });

      res.status(200).json({
        message: "Preço resetado com sucesso. O produto voltou para a lista de precificação.",
        product: updatedProduct
      });
    } catch (error) {
      console.error("Erro ao resetar preço:", error);
      next(error);
    }
  }
};