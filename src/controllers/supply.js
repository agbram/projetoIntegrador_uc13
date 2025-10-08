import prisma from "../prisma.js";

export const SupplyController = {
    async store(req,res, next){
        try{
            const { name, description, unit, unitPrice, stockQty} = req.body
            console.log(stockQty);
            const s = await prisma.supply.create({
                data: { name, description, unit, unitPrice, stockQty }
            });

            res.status(201).json(s);
        }catch (err){
            console.error("Erro ao fornecer:", err);
            res.status(500).json({ message: "Erro no item." });
        }

    },

    async index(req, res, next) {
        try {
            const ss = await prisma.supply.findMany();
            res.status(200).json(ss); 
        } catch (err) {
            console.error("Erro ao listar despesas:", err);
            res.status(500).json({ message: "Erro ao listar ." });
        }
    },
    async show(req, res, next) {
        try {
            const id = Number(req.params.id);

            const ss = await prisma.supply.findFirstOrThrow({
                where: { id }
            });

            res.status(200).json(ss); 
        } catch (err) {
            console.error("fornecedor não encontrado", err);
            res.status(404).json({ message: "item não encontrado." }); 
        }
    },

    async put(req, res, next) {
        try {
            const id = Number(req.params.id);

            let query = {};
            if (req.body.description) query.description = req.body.description;
            if (req.body.name) query.name = req.body.name;
            if (req.body.unit) query.unit = req.body.unit;
            if (req.body.recurring !== undefined) query.recurring = req.body.recurring; 
            if (req.body.unitPrice) query.unitPrice = req.body.unitPrice;
            if (req.body.stockQty) query.stockQty = req.body.stockQty;

            const ss = await prisma.supply.update({
                where: { id },
                data: query
            });

            res.status(200).json(ss);  
        } catch (err) {
            console.error("Erro ao atualizar despesa:", err);
            if (err.code === "P2025") {  
                res.status(404).json({ message: "item não encontrado para atualizar." });
            } else {
                res.status(500).json({ message: "Erro ao atualizar item." });
            }
        }
    },

    async del(req, res, next){
        try{
            const id = Number(req.params.id);

            const ss = await prisma.supply.delete({
                where: { id }
            });

            res.status(200).json({ message: "item deletado com sucesso.", deleted: ss });
        } catch (err) {
            console.error("Erro ao deletar item:", err);
            if (err.code === "P2025") {
                res.status(404).json({ message: "item não encontrado para deletar." });
            } else {
                res.status(500).json({ message: "Erro ao deletar item." });
            }
        }
    },

}