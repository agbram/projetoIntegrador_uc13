import Joi from "joi";

// Validação de cadastro
export const registerSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().pattern(/^[0-9]+$/).optional(),
  group: Joi.number().required(),
});

// Validação de login
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().min(8).required(),
});

// Validação de update
export const updateSchema = Joi.object({
  name: Joi.string().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(8).optional(),
  phone: Joi.string().pattern(/^[0-9]+$/).optional(),
});
