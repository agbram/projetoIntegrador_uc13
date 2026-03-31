import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export const UserController = {
async login(req, res, next) {
  try {
    const { email, senha, password } = req.body;
    const userPassword = senha || password;

    if (!userPassword) {
      return res.status(400).json({ error: "Senha não fornecida" });
    }

    const u = await prisma.user.findFirst({ where: { email } });
    if (!u) return res.status(404).json({ error: "Usuário não encontrado" });

    // Verifica se o usuário está ativo
    if (u.isActive === false) {
      return res.status(403).json({ error: "Sua conta está desativada. Contate o administrador." });
    }

    const ok = await bcrypt.compare(userPassword, u.password);
    if (!ok) return res.status(401).json({ error: "Email ou senha inválidos" });

    // Atualiza o horário de último acesso
    await prisma.user.update({
      where: { id: u.id },
      data: { lastSeen: new Date() }
    });

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
      // já validado em rota
      const { name, email, senha, phone, group } = req.body;

      // Criptografa a senha
      const hash = await bcrypt.hash(senha, 12);

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
          groups: { include: { group: { select: { id: true, name: true } } } },
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
            groups: {
              include: { group: { select: { id: true, name: true } } },
            },
          },
        });
      }

      res.status(200).json(users);
    } catch (err) {
      console.error("Erro detalhado na listagem de usuários:", err);
      res.status(500).json({ error: "Erro ao buscar usuários no Banco de Dados!" });
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

      // Remove associações antes de deletar
      await prisma.groupUser.deleteMany({ where: { userId: id } });
      await prisma.order.updateMany({ where: { userId: id }, data: { userId: null } });

      const u = await prisma.user.delete({ where: { id } });
      res.status(200).json(u);
    } catch (err) {
      console.error("Erro ao deletar:", err);
      res.status(500).json({ error: "Erro ao remover usuário." });
    }
  },

  async update(req, res) {
    try {
      const { email, name, phone, senha, isActive, group: groupId } = req.body;
      const id = Number(req.params.id);

      if (id === 1 && (isActive === false || email)) {
        return res.status(403).json({
          error: "Não é permitido desativar ou alterar o email do administrador.",
        });
      }

      const body = {};
      if (senha) body.password = await bcrypt.hash(senha, 12);
      if (email) body.email = email;
      if (name) body.name = name;
      if (phone) body.phone = phone;
      if (isActive !== undefined) body.isActive = isActive;

      // Update basic fields
      const u = await prisma.user.update({
        where: { id },
        data: body,
      });

      // Update group if provided
      if (groupId) {
        await prisma.groupUser.deleteMany({ where: { userId: id } });
        await prisma.groupUser.create({
          data: { userId: id, groupId: Number(groupId) },
        });
      }

      const userWithGroup = await prisma.user.findUnique({
        where: { id },
        include: {
          groups: { include: { group: { select: { id: true, name: true } } } },
        },
      });

      res.status(200).json(userWithGroup);
    } catch (err) {
      console.error("Erro no update:", err);
      res.status(404).json({ error: "Usuário não encontrado ou erro na atualização." });
    }
  },
};
