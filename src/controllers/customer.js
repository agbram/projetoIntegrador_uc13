import prisma from "../prisma.js";

export const CustomerController = {

    // Criar um novo cliente
    async store(req, res, next) {
        try {

            const { name, cnpj, contact, email, address, note, modality } = req.body;

                  const existingCustomer = await prisma.customer.findFirst({
        where: {
          OR: [
            { cnpj: cnpj },
            { email: email }
          ]
        }
      });

      if (existingCustomer) {
        return res.status(400).json({
          error: "Cliente já cadastrado com este CNPJ ou e-mail."
        });
      }

            const newCustomer = await prisma.customer.create({
                data: {
                    name,
                    cnpj,
                    contact,
                    email,
                    address,
                    note,
                    modality
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
            const { name } = req.query;
            let customers;
            if (name) {

                customers = await prisma.customer.findMany({
                    where: { name: { contains: name } },
                });
            } else {
                customers = await prisma.customer.findMany();
            }
            res.status(200).json(customers);
        } catch (err) {
            next(err);
        }
    },

    async show(req, res, next){
        try{
           const cnpj = req.params.cnpj;
           let check;

           check = await prisma.customer.findFirst({
            where:{cnpj},
           });
           if (check) {
            return res.status(200).json({customer: check});
           } else {
            return res.status(404).send();
           }

        } catch(err){
            next(err);
        }
    },

    // Atualizar um cliente existente
    async update(req, res, next) {
        try {
            
            const id = Number(req.params.id);
            
            let query = {};

            if (req.body.name) {query.name = req.body.name;}
            if (req.body.cnpj) {query.cnpj = req.body.cnpj;}
            if (req.body.contact) {query.contact = req.body.contact;}
            if (req.body.email) {query.email = req.body.email;}
            if (req.body.address) {query.address = req.body.address;}
            if (req.body.note) {query.note = req.body.note;}
            if (req.body.modality) {query.modality = req.body.modality;}

            const c = await prisma.customer.update({
                where: { id },
                data: query
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
            let cd = await prisma.customer.delete({
                where: { id },
            });
            res.status(200).json(cd);
        } catch (err) {
            next(err);
        }
    }


}