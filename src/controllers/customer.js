import prisma from "../prisma";

export const customerController = {

    // Criar um novo cliente
    async store(req, res, next) {
        try {

            const { name, cnpj, contact, email, address, modality } = req.body;

            // Verifica se o cliente já existe
            const customerExists = await prisma.customer.findUnique({
                where: { id: parseInt(customerId) },
            });
            if (customerExists) {
                return res.status(400).json({ error: "Cliente já existe" });
            }

            const newCustomer = await prisma.customer.create({
                data: {
                    name,
                    cnpj,
                    contact,
                    email,
                    address,
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

    // Atualizar um cliente existente
    async update (req, res, next) {
        try {
            
            const id = Number(req.params.id);
            
            let query = {};

            if (req.body.name) {query.name = req.body.name;}
            if (req.body.cnpj) {query.cnpj = req.body.cnpj;}
            if (req.body.contact) {query.contact = req.body.contact;}
            if (req.body.email) {query.email = req.body.email;}
            if (req.body.address) {query.address = req.body.address;}
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

    // Deletar um cliente
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