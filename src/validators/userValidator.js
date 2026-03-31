import Joi from "joi";

// Validação de cadastro (usando "senha" para ficar consistente com o front)
export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  senha: Joi.string().min(4).required(),
  phone: Joi.string().pattern(/^[0-9]+$/).optional().allow(''),
  group: Joi.number().integer().required(),
  isActive: Joi.boolean().optional(),
});

// Validação de login (campo "senha")
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().min(1).required(),
});

// Validação de update (opcional)
export const updateSchema = Joi.object({
  name: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  senha: Joi.string().min(4).optional(),
  phone: Joi.string().optional().allow(''),
  group: Joi.number().integer().optional(),
  isActive: Joi.boolean().optional(),
});
