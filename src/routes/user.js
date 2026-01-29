import express from 'express';
import { UserController } from '../controllers/user.js';
import { verificaToken } from '../middlewares/auth.js';
import rateLimit from 'express-rate-limit';
import { registerSchema, loginSchema, updateSchema } from '../validators/userValidator.js';

const router = express.Router();

// Middleware para validação com Joi
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

// Rotas
router.post('/', verificaToken, validate(registerSchema), UserController.store);
router.get('/', verificaToken, UserController.index);
router.get('/:id', verificaToken, UserController.show);
router.put('/:id', verificaToken, validate(updateSchema), UserController.update);
router.delete('/:id', verificaToken, UserController.del);
router.post('/login', validate(loginSchema), UserController.login);

export default router;
