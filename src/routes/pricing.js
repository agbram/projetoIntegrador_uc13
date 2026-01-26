import express from 'express';
import { PricingController } from '../controllers/pricing.js';
import { IngredientController } from '../controllers/ingredient.js';

const router = express.Router();

// Rotas para precificação
router.get('/products/not-calculated', PricingController.getProductsForPricing); // Produtos para calcular
router.get('/products/calculated', PricingController.getCalculatedProducts); // Produtos já calculados (para editar)
router.get('/products/:productId', PricingController.getProductForPricing); // Detalhes do produto para precificação

// Gerenciamento de ingredientes do produto
router.post('/products/:productId/ingredients', PricingController.addIngredient);
router.delete('/products/:productId/ingredients/:ingredientId', PricingController.removeIngredient);
router.put('/products/:productId/ingredients/:ingredientId', PricingController.updateIngredient);

// Cálculos de preço
router.post('/products/:productId/simulate', PricingController.simulatePrice); // Simular
router.post('/products/:productId/calculate', PricingController.calculateAndSavePrice); // Calcular e salvar
router.put('/products/:productId/recalculate', PricingController.recalculatePrice); // Recalcular (já calculado)
router.post('/products/:productId/reset', PricingController.resetPrice); // Resetar para não calculado

// Rotas para matriz de ingredientes
router.post('/ingredients', IngredientController.store);
router.get('/ingredients', IngredientController.index);
router.get('/ingredients/search', IngredientController.search); // Busca rápida
router.get('/ingredients/report', IngredientController.report); // Relatório
router.get('/ingredients/:id', IngredientController.show);
router.put('/ingredients/:id', IngredientController.update);
router.delete('/ingredients/:id', IngredientController.delete);

export default router;