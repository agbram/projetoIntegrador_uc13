import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { registerSchema, loginSchema, updateSchema } from "./validators/UserValidator.js";

export const UserController = {
  async login(req, res, next) {
    try {
      // Validação
      const { error } = loginSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { email, senha } = req.body;

      const u = await prisma.user.findFirst({ where: { email } });
      if (!u) return res.status(404).json({ error: "Usuário não encontrado" });

      const ok = await bcrypt.compare(senha, u.password);
      if (!ok) return res.status(401).json({ error: "Email ou senha inválidos" });

      const token = jwt.sign(
        { sub: u.id, email: u.email, name: u.name },
        process.env.JWT_SECRET,
        { expiresIn: "10h" }
      );

      return res.json({ token });
    } catch (e) {
      next(e);
    }
  },

  async store(req, res) {
    try {
      // Validação
      const { error } = registerSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const { name, email, password, phone, group } = req.body;

      // Criptografa a senha
      const hash = await bcrypt.hash(password, 12);

      // Cria usuário
      const user = await prisma.user.create({
        data: { name, email, password: hash, phone },
      });

      // Conecta aos grupos
      await prisma.groupUser.create({
        data: { userId: user.id, groupId: group },
      });

      const userWithGroup = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          group: { include: { group: { select: { id: true, name: true } } } },
        },
      });

      res.status(201).json(userWithGroup);
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      res.status(500).json({ error: "Erro interno ao criar usuário." });
    }
  },

  async index(req, res) {
    try {
      const { name, email, phone } = req.query;

      let users;
      if (name || email || phone) {
        users = await prisma.user.findMany({
          where: {
            OR: [
              name ? { name: { contains: name } } : undefined,
              email ? { email: { contains: email } } : undefined,
              phone ? { phone: { contains: phone } } : undefined,
            ].filter(Boolean),
          },
        });
      } else {
        users = await prisma.user.findMany({
          include: {
            group: {
              include: { group: { select: { id: true, name: true } } },
            },
          },
        });
      }

      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar usuários!" });
    }
  },

  async show(req, res) {
    try {
      const id = Number(req.params.id);
      const u = await prisma.user.findFirstOrThrow({ where: { id } });
      res.status(200).json(u);
    } catch (err) {
      res.status(404).json({ error: "Id não encontrado!" });
    }
  },

  async del(req, res) {
    try {
      const id = Number(req.params.id);
      if (id === 1) {
        return res.status(403).json({ error: "Não é permitido deletar o administrador." });
      }

      const u = await prisma.user.delete({ where: { id } });
      res.status(200).json(u);
    } catch (err) {
      res.status(404).json({ error: "Id não encontrado!" });
    }
  },

  async update(req, res) {
    try {
      // Validação
      const { error } = updateSchema.validate(req.body);
      if (error) return res.status(400).json({ error: error.details[0].message });

      const body = {};
      if (req.body.password) body.password = await bcrypt.hash(req.body.password, 12);
      if (req.body.email) body.email = req.body.email;
      if (req.body.name) body.name = req.body.name;
      if (req.body.phone) body.phone = req.body.phone;

      const id = Number(req.params.id);

      if (id === 1 && (req.body.permission === false || req.body.email)) {
        return res.status(403).json({
          error: "Não é permitido desativar ou alterar o email do administrador.",
        });
      }

      const u = await prisma.user.update({ where: { id }, data: body });
      res.status(200).json(u);
    } catch (err) {
      res.status(404).json({ error: "Usuário não encontrado ou não pode ser alterado." });
    }
  },
};
