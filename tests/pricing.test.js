import request from "supertest";
import { describe, expect, it, beforeAll, afterAll } from "@jest/globals";
import { app } from "../src/api.js";
import prisma from "../src/prisma.js";
import jwt from "jsonwebtoken";

describe("PricingController API Mathematical Engine", () => {
  let productId;
  let ingredientId;
  let token;

  beforeAll(async () => {
    // 1. Gerar Token Fake Válido para transpassar auth.js
    token = jwt.sign(
      { sub: 1, email: "test@jest.com", name: "Jest Simulator", rule: "ADM" },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "10h" }
    );

    // 2. Criar Ingediente MOCK de Custo Fixo
    // O ingrediente vai custar R$ 10.00 por unidade ('un')
    const ing = await prisma.ingredient.create({
      data: {
        name: "Mock Farinha " + Date.now(),
        unitCost: 10.00,
        unit: "un",
      }
    });
    ingredientId = ing.id;

    // 3. Criar Produto MOCK
    // Rendimento: 1
    const prod = await prisma.product.create({
      data: {
        name: "Mock Bolo Matemático " + Date.now(),
        category: "BOLOS",
        yield: 1,
      }
    });
    productId = prod.id;

    // 4. Inserir Ingrediente no Produto: 1 unidade
    // Custo Total esperado: R$ 10.00
    await prisma.productIngredient.create({
      data: {
        productId: productId,
        ingredientId: ingredientId,
        quantity: 1,
        unit: "un",
        totalCost: 10.00,
      }
    });
  });

  afterAll(async () => {
    // Apagar lixo gerado no banco de testes
    if (productId) {
      await prisma.productIngredient.deleteMany({ where: { productId } });
      await prisma.product.delete({ where: { id: productId } });
    }
    if (ingredientId) {
      await prisma.ingredient.delete({ where: { id: ingredientId } });
    }
    await prisma.$disconnect();
  });

  // ========== TESTE 1: MARKUP SEM IMPOSTO ========== //
  it("CT-PRICE-01: Deve calcular corretamente Markup (Ignorando Impostos)", async () => {
    // Fórmula: Custo 10 + 10% Despesa Mínima = 11. 
    // Markup 50% = 11 * 1.5 = 16.50
    const payload = {
      markupPercent: 50,
      expensePercent: 10,
      taxPercent: 0,
      minProfit: 0
    };

    const res = await request(app)
      .post(`/pricing/products/${productId}/simulate`)
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.costPerUnit).toBe(10.00);
    expect(res.body.breakdown.expenses).toBe(1.00); // 10% de 10
    expect(res.body.salePrice).toBe(16.50); // Custo 11 + 50%
    expect(res.body.profit).toBe(5.50); // 16.50 - 11.00
  });

  // ========== TESTE 2: MARKUP COM TRIBUTAÇÃO ========== //
  it("CT-PRICE-02: Deve calcular Impostos Corretamente (Repasse Direto)", async () => {
    // Fórmula: Custo 10 + 10% (Despesa) = 11.
    // Markup 50% = 11 * 1.5 = 16.50
    // Taxa 10% sobre Preço Base = 16.50 * 0.1 = 1.65.
    // SalePrice Final = 16.50 + 1.65 = 18.15.
    const payload = {
      markupPercent: 50,
      expensePercent: 10,
      taxPercent: 10,
      minProfit: 0
    };

    const res = await request(app)
      .post(`/pricing/products/${productId}/simulate`)
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.salePrice).toBe(18.15);
    expect(res.body.profit).toBe(5.50); // Lucro preservado e intocável!
    expect(res.body.breakdown.taxes).toBeGreaterThan(1.64);
  });

  // ========== TESTE 3: MARGEM BRUTA ========== //
  it("CT-PRICE-03: Deve calcular corretamente Margem Desejada Fixa", async () => {
    // Fórmula Margem: Custo / (1 - Margem). 
    // Custo Base 10 + 10%(despesa) = 11.
    // Margem 25%. => Preço Base = 11 / (1 - 0.25) = 14.666
    const payload = {
      profitPercent: 25,
      expensePercent: 10,
      taxPercent: 0,
    };

    const res = await request(app)
      .post(`/pricing/products/${productId}/simulate`)
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.salePrice).toBeCloseTo(14.67, 1);
    expect(res.body.profit).toBeCloseTo(3.67, 1); // 14.67 - 11 = 3.67
    expect(res.body.profitMargin).toBeCloseTo(25.00, 1);
  });

  // ========== TESTE 4: LUCRO MÍNIMO (CORREÇÃO EFETUADA) ========== //
  it("CT-PRICE-04: O Lucro Mínimo DEVE forçar novo repasse tributário e garantir o lucro", async () => {
    // Custo 11. 
    // Lucro mínimo forçado: 10 reais.
    // Preço Base Mínimo exigido = Custo 11 + Lucro 10 = 21.
    // Imposto 15% de 21 = 3.15.
    // SalePrice = 21 + 3.15 = 24.15.
    const payload = {
      markupPercent: 1, // um lucro tão pífio que forçará ativar o minProfit de 10
      expensePercent: 10,
      taxPercent: 15,
      minProfit: 10
    };

    const res = await request(app)
      .post(`/pricing/products/${productId}/simulate`)
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.minProfitApplied).toBe(true);
    expect(res.body.profit).toBe(10.00); // Garantiu os 10ão!
    expect(res.body.salePrice).toBe(24.15); // Cobrou o imposto novo proporcionalmente sem esmagar o lucro do coitado.
  });
});
