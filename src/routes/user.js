import express from 'express';
import { UserController } from '../controllers/user.js';
import { verificaToken } from '../middlewares/auth.js';
import rateLimit from 'express-rate-limit';
import { registerSchema, loginSchema, updateSchema } from '../validators/userValidator.js';
import { verificaRule } from '../middlewares/rules.js';

const router = express.Router();

// Middleware para validação com Joi
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

// Rotas
router.post('/', verificaToken, verificaRule(["ADM"]), validate(registerSchema), UserController.store);
router.get('/', verificaToken, verificaRule(["ADM"]), UserController.index);
router.get('/:id', verificaToken, verificaRule(["ADM"]), UserController.show);
router.put('/:id', verificaToken, verificaRule(["ADM"]), validate(updateSchema), UserController.update);
router.delete('/:id', verificaToken, verificaRule(["ADM"]), UserController.del);
router.post('/login', validate(loginSchema), UserController.login);

export default router;
