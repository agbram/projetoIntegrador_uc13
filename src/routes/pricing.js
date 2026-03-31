import express from 'express';
import { PricingController } from '../controllers/pricing.js';
import { IngredientController } from '../controllers/ingredient.js';
import { verificaRule } from '../middlewares/rules.js';

const router = express.Router();

// Rotas para precificação
router.get('/products/not-calculated', verificaRule(["ADM"]), PricingController.getProductsForPricing); // Produtos para calcular
router.get('/products/calculated', verificaRule(["ADM"]), PricingController.getCalculatedProducts); // Produtos já calculados (para editar)
router.get('/products/:productId', verificaRule(["ADM"]), PricingController.getProductForPricing); // Detalhes do produto para precificação

// Gerenciamento de ingredientes do produto
router.post('/products/:productId/ingredients', verificaRule(["ADM"]), PricingController.addIngredient);
router.delete('/products/:productId/ingredients/:ingredientId', verificaRule(["ADM"]), PricingController.removeIngredient);
router.put('/products/:productId/ingredients/:ingredientId', verificaRule(["ADM"]), PricingController.updateIngredient);

// Cálculos de preço
router.post('/products/:productId/simulate', verificaRule(["ADM"]), PricingController.simulatePrice); // Simular
router.post('/products/:productId/calculate', verificaRule(["ADM"]), PricingController.calculateAndSavePrice); // Calcular e salvar
router.put('/products/:productId/recalculate', verificaRule(["ADM"]),  PricingController.recalculatePrice); // Recalcular (já calculado)
router.post('/products/:productId/reset', verificaRule(["ADM"]), PricingController.resetPrice); // Resetar para não calculado

// Rotas para matriz de ingredientes
router.post('/ingredients', verificaRule(["ADM"]), IngredientController.store);
router.get('/ingredients', verificaRule(["ADM"]), IngredientController.index);
router.get('/ingredients/search', verificaRule(["ADM"]), IngredientController.search); // Busca rápida
router.get('/ingredients/report', verificaRule(["ADM"]), IngredientController.report); // Relatório
router.get('/ingredients/:id', verificaRule(["ADM"]), IngredientController.show);
router.put('/ingredients/:id', verificaRule(["ADM"]), IngredientController.update);
router.delete('/ingredients/:id', verificaRule(["ADM"]), IngredientController.delete);

export default router;