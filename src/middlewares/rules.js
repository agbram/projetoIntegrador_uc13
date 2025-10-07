import prisma from "../prisma.js";

export function verificaRule(requiredRole) {
  const need = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return async (req, res, next) => {
    try {
      const userId = req.usuario?.id;
      if (!userId)
        return res.status(401).json({ error: "Usuário não autenticado" });
      
      const vinculo = await prisma.ruleGroup.findFirst({
        where: {
          rule: { name: { in: need } },
          group: { users: { some: { id: userId } } },
        },
        select: { id: true },
      });
      
      if (!vinculo)
        return res.status(403).json({ error: "Usuário não autorizado" });
      return next();
    } catch (err) {
      console.error("Erro ao verificar regras de acesso!", err);
      return res.status(403).json({ error: "Usuário não autorizado" });
    }
  };
}
