/**
 * Calculadora de Precificação Avançada
 * 
 * Esta classe fornece métodos para calcular preços de produtos
 * considerando múltiplas estratégias, taxas e lucros mínimos.
 */

export class PricingCalculator {
  /**
   * Calcula preço de venda usando markup
   * Markup = (Preço Venda - Custo) / Custo
   * 
   * @param {number} costPrice - Preço de custo
   * @param {number} markupPercent - Percentual de markup (ex: 50 para 50%)
   * @returns {number} Preço de venda calculado
   */
  static calculateByMarkup(costPrice, markupPercent) {
    if (costPrice <= 0) throw new Error('Preço de custo deve ser maior que zero');
    if (markupPercent < 0) throw new Error('Markup não pode ser negativo');
    
    return costPrice * (1 + markupPercent / 100);
  }

  /**
   * Calcula preço de venda usando margem de lucro
   * Margem = (Preço Venda - Custo) / Preço Venda
   * 
   * @param {number} costPrice - Preço de custo
   * @param {number} marginPercent - Percentual de margem (ex: 30 para 30%)
   * @returns {number} Preço de venda calculado
   */
  static calculateByMargin(costPrice, marginPercent) {
    if (marginPercent <= 0 || marginPercent >= 100) {
      throw new Error('Margem deve estar entre 0% e 100%');
    }
    
    return costPrice / (1 - (marginPercent / 100));
  }

  /**
   * Calcula markup a partir do preço de venda
   * 
   * @param {number} costPrice - Preço de custo
   * @param {number} salePrice - Preço de venda
   * @returns {number} Percentual de markup
   */
  static calculateMarkupFromSalePrice(costPrice, salePrice) {
    if (costPrice <= 0) throw new Error('Preço de custo deve ser maior que zero');
    if (salePrice < costPrice) throw new Error('Preço de venda não pode ser menor que custo');
    
    return ((salePrice - costPrice) / costPrice) * 100;
  }

  /**
   * Calcula margem de lucro a partir do preço de venda
   * 
   * @param {number} costPrice - Preço de custo
   * @param {number} salePrice - Preço de venda
   * @returns {number} Percentual de margem
   */
  static calculateMarginFromSalePrice(costPrice, salePrice) {
    if (salePrice <= 0) throw new Error('Preço de venda deve ser maior que zero');
    if (salePrice < costPrice) throw new Error('Preço de venda não pode ser menor que custo');
    
    return ((salePrice - costPrice) / salePrice) * 100;
  }

  /**
   * Aplica múltiplas taxas ao preço base
   * 
   * @param {number} basePrice - Preço base
   * @param {Array} taxes - Array de taxas [{name, type, value}]
   * @returns {Object} {finalPrice, breakdown}
   */
  static applyTaxes(basePrice, taxes = []) {
    let finalPrice = basePrice;
    const breakdown = [];
    let totalTaxes = 0;

    taxes.forEach(tax => {
      let taxAmount = 0;
      
      if (tax.type === 'percent') {
        taxAmount = basePrice * (tax.value / 100);
      } else if (tax.type === 'percent_on_cost') {
        // Para taxas sobre custo, precisamos do costPrice separado
        // Esta lógica será tratada no calculateSuggestedPrice
        throw new Error('percent_on_cost deve ser tratado no calculateSuggestedPrice');
      } else if (tax.type === 'percent_on_sale') {
        taxAmount = basePrice * (tax.value / 100);
      } else if (tax.type === 'fixed') {
        taxAmount = tax.value;
      }
      
      finalPrice += taxAmount;
      totalTaxes += taxAmount;
      
      breakdown.push({
        name: tax.name,
        type: tax.type,
        value: tax.value,
        amount: parseFloat(taxAmount.toFixed(2))
      });
    });

    return {
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      breakdown,
      totalTaxes: parseFloat(totalTaxes.toFixed(2))
    };
  }

  /**
 * Garante que o breakdown tenha todos os campos necessários
 * 
 * @param {Object} calculationResult - Resultado do cálculo
 * @param {number} ingredientCost - Custo total dos ingredientes
 * @returns {Object} Resultado com breakdown completo
 */
static ensureBreakdownStructure(calculationResult, ingredientCost = 0) {
  if (!calculationResult.breakdown) {
    calculationResult.breakdown = {};
  }
  
  // Garantir que tenha o campo ingredients
  calculationResult.breakdown.ingredients = ingredientCost;
  
  return calculationResult;
}

  /**
   * Calcula preço sugerido com base em múltiplas estratégias
   * 
   * @param {Object} options - Opções de cálculo
   * @param {number} options.costPrice - Preço de custo
   * @param {number|null} options.markupPercent - Percentual de markup (ou null)
   * @param {number|null} options.marginPercent - Percentual de margem (ou null)
   * @param {Array} options.taxes - Taxas a aplicar
   * @param {number} options.minProfit - Lucro mínimo garantido
   * @returns {Object} Resultado do cálculo
   */
  static calculateSuggestedPrice({
    costPrice,
    markupPercent = null,
    marginPercent = null,
    taxes = [],
    minProfit = 0
  }) {
    // Validação básica
    if (costPrice <= 0) {
      throw new Error('Preço de custo deve ser maior que zero');
    }

    if (!markupPercent && !marginPercent) {
      throw new Error('Deve fornecer markupPercent ou marginPercent');
    }

    if (markupPercent && marginPercent) {
      throw new Error('Forneça apenas markupPercent OU marginPercent, não ambos');
    }

    // Separar taxas por tipo
    const taxOnCost = taxes.filter(t => t.type === 'percent_on_cost');
    const taxOnSale = taxes.filter(t => t.type === 'percent_on_sale' || t.type === 'percent' || t.type === 'fixed');

    // Calcular taxas sobre o custo primeiro
    let costWithTaxes = costPrice;
    const costTaxBreakdown = [];
    
    taxOnCost.forEach(tax => {
      const taxAmount = costPrice * (tax.value / 100);
      costWithTaxes += taxAmount;
      costTaxBreakdown.push({
        name: tax.name,
        type: tax.type,
        value: tax.value,
        amount: parseFloat(taxAmount.toFixed(2))
      });
    });

    // Calcular preço base usando o custo com taxas
    let basePrice;
    let strategyUsed;
    
    if (markupPercent !== null) {
      basePrice = this.calculateByMarkup(costWithTaxes, markupPercent);
      strategyUsed = 'markup';
    } else {
      basePrice = this.calculateByMargin(costWithTaxes, marginPercent);
      strategyUsed = 'margin';
    }

    // Aplicar taxas sobre a venda
    const { finalPrice: priceWithTaxes, breakdown: saleTaxBreakdown } = this.applyTaxes(basePrice, taxOnSale);

    // Calcular lucro antes de verificar o mínimo
    const profitBeforeMin = priceWithTaxes - costWithTaxes;
    const profitMarginBeforeMin = (profitBeforeMin / priceWithTaxes) * 100;
    

    // Verifica se atende lucro mínimo
    let finalPrice = priceWithTaxes;
    let finalProfit = profitBeforeMin;
    let minProfitApplied = false;
    
    if (finalProfit < minProfit) {
      finalPrice = costWithTaxes + minProfit;
      finalProfit = minProfit;
      minProfitApplied = true;
    }

    // Calcula margens e markups finais
    const finalMargin = (finalProfit / finalPrice) * 100;
    const finalMarkup = ((finalPrice - costPrice) / costPrice) * 100;

    // Combinar todos os detalhes de taxas
    const allTaxes = [...costTaxBreakdown, ...saleTaxBreakdown];
    const totalTaxesAmount = allTaxes.reduce((sum, tax) => sum + tax.amount, 0);

    // Calcula breakdown detalhado
    const breakdown = {
      costPrice: parseFloat(costPrice.toFixed(2)),
      costWithTaxes: parseFloat(costWithTaxes.toFixed(2)),
      basePrice: parseFloat(basePrice.toFixed(2)),
      taxes: {
        total: parseFloat(totalTaxesAmount.toFixed(2)),
        items: allTaxes
      },
      priceWithTaxes: parseFloat(priceWithTaxes.toFixed(2)),
      minProfitApplied,
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      profit: parseFloat(finalProfit.toFixed(2)),
      profitMargin: parseFloat(finalMargin.toFixed(2)),
      markup: parseFloat(finalMarkup.toFixed(2)),
      strategy: strategyUsed
    };

    return {
      salePrice: parseFloat(finalPrice.toFixed(2)),
      costPrice: parseFloat(costPrice.toFixed(2)),
      costWithTaxes: parseFloat(costWithTaxes.toFixed(2)),
      profit: parseFloat(finalProfit.toFixed(2)),
      profitMargin: parseFloat(finalMargin.toFixed(2)),
      markup: parseFloat(finalMarkup.toFixed(2)),
      strategy: strategyUsed,
      minProfitApplied,
      breakdown
    };
  }

  /**
   * Calcula custo por unidade com base no rendimento
   * 
   * @param {number} totalCost - Custo total dos ingredientes
   * @param {number} yield - Rendimento (unidades produzidas)
   * @returns {number} Custo por unidade
   */
  static calculateCostPerUnit(totalCost, yieldValue) {
    if (yieldValue <= 0) {
      throw new Error('Rendimento deve ser maior que zero');
    }
    
    return totalCost / yieldValue;
  }

  /**
   * Calcula preço com base no custo dos ingredientes
   * 
   * @param {Array} ingredients - Array de ingredientes com quantidade e custo
   * @param {number} yieldValue - Rendimento
   * @param {Object} pricingOptions - Opções de precificação
   * @returns {Object} Resultado completo
   */
  static calculateFromIngredients(ingredients, yieldValue = 1, pricingOptions = {}) {
    // Calcula custo total dos ingredientes
    const totalIngredientCost = ingredients.reduce((sum, ing) => {
      return sum + (ing.quantity * ing.unitCost);
    }, 0);

    // Calcula custo por unidade
    const costPerUnit = this.calculateCostPerUnit(totalIngredientCost, yieldValue);

    // Calcula preço sugerido
    const result = this.calculateSuggestedPrice({
      costPrice: costPerUnit,
      ...pricingOptions
    });

    return {
      ...result,
      ingredients: {
        totalCost: parseFloat(totalIngredientCost.toFixed(2)),
        costPerUnit: parseFloat(costPerUnit.toFixed(2)),
        items: ingredients,
        count: ingredients.length
      },
      yield: yieldValue
    };
  }

  /**
   * Simula diferentes cenários de precificação
   * 
   * @param {number} costPrice - Preço de custo
   * @param {Array} scenarios - Array de cenários para testar
   * @returns {Array} Resultados dos cenários
   */
  static simulateScenarios(costPrice, scenarios = []) {
    return scenarios.map(scenario => {
      try {
        const result = this.calculateSuggestedPrice({
          costPrice,
          ...scenario
        });
        
        return {
          ...scenario,
          result,
          success: true
        };
      } catch (error) {
        return {
          ...scenario,
          error: error.message,
          success: false
        };
      }
    });
  }

  /**
   * Analisa viabilidade do preço com base em metas
   * 
   * @param {Object} params - Parâmetros de análise
   * @returns {Object} Análise de viabilidade
   */
  static analyzeFeasibility({
    costPrice,
    targetSalePrice,
    maxMarketPrice,
    minAcceptableMargin = 20,
    expenses = []
  }) {
    // Calcula margem do preço alvo
    const targetMargin = this.calculateMarginFromSalePrice(costPrice, targetSalePrice);
    
    // Calcula markup do preço alvo
    const targetMarkup = this.calculateMarkupFromSalePrice(costPrice, targetSalePrice);
    
    // Calcula despesas totais
    const totalExpenses = expenses.reduce((sum, exp) => {
      if (exp.type === 'percent') {
        return sum + (targetSalePrice * (exp.value / 100));
      }
      return sum + exp.value;
    }, 0);
    
    // Calcula lucro líquido
    const netProfit = targetSalePrice - costPrice - totalExpenses;
    const netMargin = (netProfit / targetSalePrice) * 100;
    
    // Verifica se atende margem mínima
    const meetsMinMargin = netMargin >= minAcceptableMargin;
    
    // Verifica se está abaixo do preço máximo do mercado
    const withinMarketLimit = targetSalePrice <= maxMarketPrice;
    
    // Sugere ajustes
    const suggestions = [];
    
    if (!meetsMinMargin) {
      const minPrice = costPrice / (1 - (minAcceptableMargin / 100));
      suggestions.push(`Para ${minAcceptableMargin}% de margem, preço mínimo: R$ ${minPrice.toFixed(2)}`);
    }
    
    if (!withinMarketLimit) {
      suggestions.push(`Preço acima do mercado (máximo: R$ ${maxMarketPrice.toFixed(2)})`);
    }
    
    // Classifica viabilidade
    let feasibility = 'ALTA';
    if (!withinMarketLimit) feasibility = 'BAIXA';
    else if (!meetsMinMargin) feasibility = 'MÉDIA';
    
    return {
      costPrice,
      targetSalePrice,
      targetMargin: parseFloat(targetMargin.toFixed(2)),
      targetMarkup: parseFloat(targetMarkup.toFixed(2)),
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      netProfit: parseFloat(netProfit.toFixed(2)),
      netMargin: parseFloat(netMargin.toFixed(2)),
      meetsMinMargin,
      withinMarketLimit,
      feasibility,
      suggestions
    };
  }

  /**
   * Formata valores monetários
   * 
   * @param {number} value - Valor a formatar
   * @returns {string} Valor formatado
   */
  static formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  }

  /**
   * Gera relatório de precificação
   * 
   * @param {Object} calculation - Resultado do cálculo
   * @returns {string} Relatório formatado
   */
  static generateReport(calculation) {
    const { costPrice, salePrice, profit, profitMargin, markup, breakdown, strategy } = calculation;
    
    let report = `=== RELATÓRIO DE PRECIFICAÇÃO ===\n\n`;
    report += `Estratégia usada: ${strategy === 'markup' ? 'Markup' : 'Margem de Lucro'}\n`;
    report += `Custo: ${this.formatCurrency(costPrice)}\n`;
    report += `Preço de Venda: ${this.formatCurrency(salePrice)}\n`;
    report += `Lucro: ${this.formatCurrency(profit)} (${profitMargin.toFixed(2)}%)\n`;
    report += `Markup: ${markup.toFixed(2)}%\n\n`;
    
    if (breakdown.taxes.items.length > 0) {
      report += `--- TAXAS APLICADAS ---\n`;
      breakdown.taxes.items.forEach(tax => {
        report += `${tax.name}: ${tax.type === 'percent' ? `${tax.value}%` : this.formatCurrency(tax.value)} = ${this.formatCurrency(tax.amount)}\n`;
      });
      report += `Total Taxas: ${this.formatCurrency(breakdown.taxes.total)}\n\n`;
    }
    
    report += `--- DETALHES ---\n`;
    report += `Preço Base: ${this.formatCurrency(breakdown.basePrice)}\n`;
    report += `Preço com Taxas: ${this.formatCurrency(breakdown.priceWithTaxes)}\n`;
    report += `Lucro Mínimo Aplicado: ${breakdown.minProfitApplied ? 'Sim' : 'Não'}\n`;
    
    return report;
  }

  /**
   * Converte entre unidades de medida comuns
   * 
   * @param {number} value - Valor a converter
   * @param {string} fromUnit - Unidade de origem
   * @param {string} toUnit - Unidade de destino
   * @returns {number} Valor convertido
   */
  static convertUnit(value, fromUnit, toUnit) {
    const conversions = {
      // Massa
      'kg': { 'g': 1000, 'kg': 1 },
      'g': { 'kg': 0.001, 'g': 1 },
      // Volume
      'L': { 'ml': 1000, 'L': 1 },
      'ml': { 'L': 0.001, 'ml': 1 },
      // Unidades
      'un': { 'un': 1 }
    };

    if (!conversions[fromUnit] || !conversions[fromUnit][toUnit]) {
      throw new Error(`Conversão não suportada: ${fromUnit} para ${toUnit}`);
    }

    return value * conversions[fromUnit][toUnit];
  }

  /**
   * Valida se um valor monetário é válido
   * 
   * @param {any} value - Valor a validar
   * @returns {boolean} True se for válido
   */
  static isValidMonetaryValue(value) {
    if (value === null || value === undefined) return false;
    const num = parseFloat(value);
    return !isNaN(num) && isFinite(num) && num >= 0;
  }

  /**
   * Arredonda valor para 2 casas decimais
   * 
   * @param {number} value - Valor a arredondar
   * @returns {number} Valor arredondado
   */
  static roundToTwoDecimals(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}

/**
 * Funções auxiliares (pode ser usada separadamente)
 */

/**
 * Calcula o custo total de uma lista de ingredientes
 * @param {Array} ingredients - Lista de ingredientes
 * @returns {number} Custo total
 */
export function calculateTotalIngredientCost(ingredients) {
  return ingredients.reduce((total, ing) => {
    return total + (ing.quantity * ing.unitCost);
  }, 0);
}

/**
 * Calcula o custo por unidade baseado no rendimento
 * @param {number} totalCost - Custo total
 * @param {number} yieldValue - Rendimento
 * @returns {number} Custo por unidade
 */
export function calculateUnitCost(totalCost, yieldValue = 1) {
  if (yieldValue <= 0) throw new Error('Rendimento deve ser maior que zero');
  return totalCost / yieldValue;
}

/**
 * Formata um valor para exibição monetária
 * @param {number} value - Valor a formatar
 * @returns {string} Valor formatado
 */
export function formatToCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

/**
 * Calcula a porcentagem de um valor em relação a outro
 * @param {number} part - Parte
 * @param {number} whole - Todo
 * @returns {number} Porcentagem
 */
export function calculatePercentage(part, whole) {
  if (whole === 0) return 0;
  return (part / whole) * 100;

}


export default PricingCalculator;