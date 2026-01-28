import express from 'express';
import { UserController } from '../controllers/user.js';
import { verificaToken } from '../middlewares/auth.js';
import rateLimit from 'express-rate-limit';
import { registerSchema, loginSchema, updateSchema } from './validators/userValidator.js';

const router = express.Router();

// ====================
// Rate limiter login
// ====================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas
  message: { error: "Muitas tentativas de login. Tente novamente mais tarde." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ====================
// Middleware de validação
// ====================
function validate(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    next();
  };
}

// ====================
// Rotas Usuário
// ====================

// Criação de usuário (POST /users)
router.post('/', verificaToken, validate(registerSchema), UserController.store);

// Listagem de usuários (GET /users)
router.get('/', verificaToken, UserController.index);

// Buscar usuário por ID (GET /users/:id)
router.get('/:id', verificaToken, UserController.show);

// Atualizar usuário (PUT /users/:id)
router.put('/:id', verificaToken, validate(updateSchema), UserController.update);

// Deletar usuário (DELETE /users/:id)
router.delete('/:id', verificaToken, UserController.del);

// Login de usuário (POST /users/login)
router.post('/login', loginLimiter, validate(loginSchema), UserController.login);

export default router;
