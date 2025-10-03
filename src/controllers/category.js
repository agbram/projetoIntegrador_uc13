import prisma from "../prisma.js";

export const Category = {
    async store(req, res, next){
        try{
            const {name,description} = req.body;


            const c = await prisma.category.create({ 
                data: {name,description},
            });
            res.status(201).json(f);
        }catch (err) {
            next(err);
        }
    },
}