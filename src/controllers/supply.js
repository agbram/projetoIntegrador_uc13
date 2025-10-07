import prisma from "..prisma.js";

export const SupplyController = {
    async store(req,res, next){
        try{
            const { name,description,unit,unitPrice,stockQty} = req.body

            const s = await prisma.supply.create({
                data: { name,description,unit,unitPrice,stockQty }
            });

            res.status(201).json(s);
        }catch (err){
            console.error("Erro ao :", err);
            res.status(500).json({ message: "Erro ao  ." });
        }

    }

}