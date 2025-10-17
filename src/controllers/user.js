import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

//assincrona nome_da_funcao(requisicao, resposta, proximo)
export const UserController = {
  async login(req, res, next) {
    try {
      console.log(req.body);
      const { email, senha } = req.body;

      let u = await prisma.user.findFirst({
        where: { email: email },
      });

      if (!u) {
        res.status(404).json({ error: "Não tem usuário com esse email..." });
        return;
      }

      const ok = await bcrypt.compare(senha, u.password);
      if (!ok) {
        return res.status(401).json({ erro: "Email ou senha inválidos..." });
      }

      const token = jwt.sign(
        {
          sub: u.id,
          email: u.email,
          name: u.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: "8h" }
      );

      return res.json({ token });
    } catch (e) {
      next(e);
    }
  },

async store(req, res) {
  try {
    const { name, email, password, phone, group } = req.body;

    if (!name || !email || !password || !group) {
      return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
    }

    // Criptografa a senha
    const hash = await bcrypt.hash(password, 10);

    // Cria usuário e conecta aos grupos
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        phone
      }
  });

      await prisma.groupUser.create({
      data: {
        userId: user.id,
        groupId: group, // aqui você passa o ID do grupo que veio do body
      },
    });

    const userWithGroup = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        group: {
          include: {
            group:{select: { id: true, name: true }}, // isso puxa os dados do Group real
          },
        },
      },
    });

    res.status(201).json(userWithGroup);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    res.status(500).json({ error: "Erro interno ao criar usuário." });
  }
},
  
  async index(req, res, _next) {
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
        // se nao tiver filtro, retorna todos
        users = await prisma.user.findMany({
      include: {
        group: {
          include: {
            group: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar usuarios!" });
    }
  },

  async show(req, res, _next) {
    try {
      const id = Number(req.params.id);

      const u = await prisma.user.findFirstOrThrow({
        where: { id },
      });

      res.status(200).json(u);
    } catch (err) {
      res.status(404).json("Error: Id nao encontrado!");
    }
  },

  async del(req, res, _next) {
    try {
      const id = Number(req.params.id);
      if (id === 1) {
        return res
          .status(403)
          .json({ error: "Não é permitido deletar o usuário administrador." });
      }
      const u = await prisma.user.delete({
        where: { id },
      });
      console.log(u);
      res.status(200).json(u);
    } catch (err) {
      res.status(404).json("Error: Id nao encontrado!");
    }
  },

  async update(req, res, next) {
    try {
      let body = {};

      if (req.body.password) body.password = req.body.password;
      if (req.body.email) body.email = req.body.email;
      if (req.body.name) body.name = req.body.name;
      if (req.body.phone) body.phone = req.body.phone;

      const id = Number(req.params.id);

      if (id === 1) {
        if (req.body.permission === false || req.body.email) {
          return res.status(403).json({
            error:
              "Não é permitido desativar ou alterar o email do administrador.",
          });
        }
      }
      const u = await prisma.user.update({
        where: { id },
        data: body,
      });

      res.status(200).json(u);
    } catch (err) {
      res
        .status(404)
        .json("Error: Usuário não encontrado ou não pode ser alterado...");
    }
  },
};
