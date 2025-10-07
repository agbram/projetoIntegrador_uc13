import prisma from "../prisma.js";

export const FixedExpenseController = {
 
    async store(req, res, next) {
        try {
            const { description, value, date, recurring, category, note } = req.body;

            const f = await prisma.fixedExpense.create({
                data: { description, value, date, recurring, category, note },
            });

            res.status(201).json(f); 
        } catch (err) {
            console.error("Erro ao criar despesa:", err);
            res.status(500).json({ message: "Erro ao criar despesa fixa." }); 
        }
    },

    // Listar todas as despesas
    async index(req, res, next) {
        try {
            const fs = await prisma.fixedExpense.findMany();
            res.status(200).json(fs); 
        } catch (err) {
            console.error("Erro ao listar despesas:", err);
            res.status(500).json({ message: "Erro ao listar despesas fixas." });
        }
    },

    async show(req, res, next) {
        try {
            const id = Number(req.params.id);

            const fs = await prisma.fixedExpense.findFirstOrThrow({
                where: { id }
            });

            res.status(200).json(fs); 
        } catch (err) {
            console.error("Despesa não encontrada:", err);
            res.status(404).json({ message: "Despesa fixa não encontrada." }); 
        }
    },

    
    async put(req, res, next) {
        try {
            const id = Number(req.params.id);

            let query = {};
            if (req.body.description) query.description = req.body.description;
            if (req.body.value) query.value = req.body.value;
            if (req.body.date) query.date = req.body.date;
            if (req.body.recurring !== undefined) query.recurring = req.body.recurring; 
            if (req.body.category) query.category = req.body.category;
            if (req.body.note) query.note = req.body.note;

            const fs = await prisma.fixedExpense.update({
                where: { id },
                data: query
            });

            res.status(200).json(fs);  
        } catch (err) {
            console.error("Erro ao atualizar despesa:", err);
            if (err.code === "P2025") {  
                res.status(404).json({ message: "Despesa fixa não encontrada para atualizar." });
            } else {
                res.status(500).json({ message: "Erro ao atualizar despesa fixa." });
            }
        }
    },

    async del(req, res, next){
        try{
            const id = Number(req.params.id);

            const fs = await prisma.fixedExpense.delete({
                where: { id }
            });

            res.status(200).json({ message: "Despesa fixa deletada com sucesso.", deleted: fs });
        } catch (err) {
            console.error("Erro ao deletar despesa:", err);
            if (err.code === "P2025") {
                res.status(404).json({ message: "Despesa fixa não encontrada para deletar." });
            } else {
                res.status(500).json({ message: "Erro ao deletar despesa fixa." });
            }
        }
    },
};
