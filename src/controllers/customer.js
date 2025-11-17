import prisma from "../prisma.js";

export const CustomerController = {
  // Criar um novo cliente
  async store(req, res, next) {
    try {
      const { name, document, type, contact, email, address, note, modality } =
        req.body;

      const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [{ document: document }, { email: email }],
        },
      });

      if (existingCustomer) {
        return res.status(400).json({
          error: "Cliente já cadastrado com este CNPJ ou e-mail.",
        });
      }

      const newCustomer = await prisma.customer.create({
        data: {
          name,
          document: document.replace(/\D/g, ""),
          type,
          contact,
          email,
          address,
          note,
          modality,
        },
      });
      res.status(201).json(newCustomer);
    } catch (err) {
      next(err);
    }
  },

  // Listar todos os clientes ou filtrar por nome
async index(req, res, next) {
  try {
    const { isActive } = req.query;

    let filter = {};
    if (isActive == undefined) {
      filter.isActive = isActive !== "true";
    }

    const customers = await prisma.customer.findMany({
      where: filter,
    });

    res.status(200).json(customers);
  } catch (err) {
    console.error(err);
    next(err);
  }
},

async inactives(req, res, next) {
  try {
    const inactiveCustomers = await prisma.customer.findMany({
      where: { isActive: false },
    });

    if (inactiveCustomers.length === 0) {
      return res.status(404).json({ message: "Nenhum cliente desativado encontrado." });
    }

    res.status(200).json(inactiveCustomers);
  } catch (err) {
    next(err);
  }
},


  async show(req, res, next) {
    try {
      const document = req.params.document;
      let check;

      check = await prisma.customer.findFirstOrThrow({
        where: { document },
      });
      if (check) {
        return res.status(200).json({ customer: check });
      } else {
        return res.status(404).send();
      }
    } catch (err) {
      next(err);
    }
  },

    async search(req, res, next) {
    try {
      const {name} = req.query;
      const filter = {};

      if (name) {
        // Busca parcial no nome
        filter.name = {
          contains: name,
        };
      }


      const customers = await prisma.customer.findMany({
        where: filter,
      });

      if (customers.length === 0) {
        return res
          .status(404)
          .json({ message: "Nenhum cliente encontrado com os filtros fornecidos." });
      }

      return res.status(200).json(customers);
    } catch (err) {
      next(err);
    }
  },

  // Atualizar um cliente existente
  async put(req, res, next) {
    console.log(req.body);
    try {
      const id = Number(req.params.id);

      let query = {};

      if (req.body.name !== undefined) query.name = req.body.name;
      if (req.body.contact !== undefined) query.contact = req.body.contact;
      if (req.body.email !== undefined) query.email = req.body.email;
      if (req.body.address !== undefined) query.address = req.body.address;
      if (req.body.note !== undefined) query.note = req.body.note;
      if (req.body.modality !== undefined) query.modality = req.body.modality;
      if (req.body.isActive !== undefined) query.isActive = req.body.isActive;

      // 👇 Garante que pelo menos um campo foi enviado
      if (Object.keys(query).length === 0) {
        return res
          .status(400)
          .json({ message: "Nenhum campo para atualizar." });
      }

      const c = await prisma.customer.update({
        where: { id },
        data: query,
      });

      res.status(200).json(c);
    } catch (err) {
      next(err);
    }
  },

  // Deletar um cliente por ID
  async delete(req, res, next) {
    try {
      const id = Number(req.params.id);
      const c = await prisma.customer.update({
        where: { id },
        data: { isActive: false },
      });

      res.status(200).json("Usuário desativado com sucesso!");
    } catch (err) {
      next(err);
    }
  },
};
