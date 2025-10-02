import prisma from "../prisma.js";


export const FixedExpenseController = {
    async store(req, res, next){
        try{
            const { description, value, date, recurring, category,note} = req.body;


            const f = await prisma.fixedExpense.create({ 
                data: {description, value, date, recurring, category,note},
            });
            res.status(201).json(f);
        }catch (err) {
            next(err);
        }
    },
    async index(req, res, next){
        try{

            let query = {}
    
            if(req.query.date) query.date = req.query.date
            if(req.query.category) query.category = req.query.category
    
            const fs = await prisma.fixedExpense.findMany({
                where:query
            });
            res.status(201).json(fs);
        }catch (err) {
            next(err);}

    },

    async show(req, res, next){
        try{
            const id = Number(req.params.id);
            
            
            const fs = await prisma.fixedExpense.findFirstOrThrow({
              where: {id}
            });
            res.status(201).json(fs);
    }catch (err) {
        next(err);}
    },

    async put(req, res, next){
        try{
            const id = Number(req.params.id);

            let query = {}
            if(req.body.description) query.description = req.body.description
            if(req.body.value) query.value = req.body.value 
            if(req.body.recurring) query.recurring = req.body.recurring
            if(req.body.note) query.note = req.body.note
            
            
            const fs = await prisma.fixedExpense.update({
                where: {id},
                data:query
            });
            res.status(201).json(fs);
    }catch (err) {
        next(err);}
    },

    async delete(req, res, next){
        try{
            const id = Number(req.params.id);
            
            
            const fs = await prisma.fixedExpense.delete({
              where: {id}
            });
            res.status(201).json(fs);
    }catch (err) {
        next(err);}
    },
}

