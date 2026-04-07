import prisma from "../prisma.js";
import { generateMonthlyExpenses } from "../services/expenseGenerator.js";

export const FixedExpenseController = {
  // Criar uma nova despesa fixa
  async store(req, res, next) {
    try {
      const { description, value, date, recurring, category, note } = req.body;

      // Validações básicas
      if (!description || value === undefined || value === null) {
        return res.status(400).json({ error: "Descrição e valor são obrigatórios." });
      }

      if (Number(value) < 0) {
        return res.status(400).json({ error: "O valor não pode ser negativo." });
      }

      const newExpense = await prisma.fixedExpense.create({
        data: {
          description,
          value: parseFloat(value),
          date: date ? new Date(date) : new Date(),
          recurring: recurring || false,
          category,
          note,
        },
      });

      res.status(201).json(newExpense);
    } catch (err) {
      next(err);
    }
  },

  // Listar todas as despesas (ativas) com filtros opcionais
  async index(req, res, next) {
    try {
      const { startDate, endDate, category, recurring } = req.query;
      const where = {};

      // Se estiver usando soft delete, filtrar apenas ativas
      if (prisma.fixedExpense.fields.isActive) {
        where.isActive = true;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }
      if (category) where.category = category;
      if (recurring !== undefined) where.recurring = recurring === "true";

      const expenses = await prisma.fixedExpense.findMany({
        where,
        orderBy: { date: "desc" },
      });

      res.status(200).json(expenses);
    } catch (err) {
      next(err);
    }
  },

  // Buscar uma despesa por ID
  async show(req, res, next) {
    try {
      const id = Number(req.params.id);
      const expense = await prisma.fixedExpense.findFirstOrThrow({
        where: { id },
      });

      res.status(200).json(expense);
    } catch (err) {
      next(err);
    }
  },

  // Atualizar uma despesa
  async put(req, res, next) {
    try {
      const id = Number(req.params.id);
      const { description, value, date, recurring, category, note } = req.body;

      // Montar objeto com campos permitidos para atualização
      const { isActive } = req.body;
      const data = {};
      if (description !== undefined) data.description = description;
      if (value !== undefined) data.value = parseFloat(value);
      if (date !== undefined) data.date = new Date(date);
      if (recurring !== undefined) data.recurring = recurring;
      if (category !== undefined) data.category = category;
      if (note !== undefined) data.note = note;
      if (isActive !== undefined) data.isActive = isActive;

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ message: "Nenhum campo para atualizar." });
      }

      const updated = await prisma.fixedExpense.update({
        where: { id },
        data,
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  // Excluir uma despesa
  async delete(req, res, next) {
    try {
      const id = Number(req.params.id);

      await prisma.fixedExpense.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },

  // (Opcional) Reativar uma despesa desativada
  async reactivate(req, res, next) {
    try {
      const id = Number(req.params.id);
      const updated = await prisma.fixedExpense.update({
        where: { id },
        data: { isActive: true },
      });
      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  },

  // FixedExpenseController.js - Adicione estes métodos

// Resumo de despesas (totais por mês)
async summary(req, res, next) {
  try {
    const { year, month } = req.query;
    
    let where = {};
    
    // Se usar soft delete
    if (prisma.fixedExpense.fields.isActive) {
      where.isActive = true;
    }
    
    // Filtrar por ano/mês específico ou pegar todos
    if (year && month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }
    
    const expenses = await prisma.fixedExpense.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    
    // Agrupar por mês
    const monthlySummary = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('pt-BR', { month: 'long' });
      
      if (!monthlySummary[monthKey]) {
        monthlySummary[monthKey] = {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          monthName: monthName,
          total: 0,
          count: 0,
          byCategory: {}
        };
      }
      
      monthlySummary[monthKey].total += expense.value;
      monthlySummary[monthKey].count += 1;
      
      // Agrupar por categoria
      if (expense.category) {
        if (!monthlySummary[monthKey].byCategory[expense.category]) {
          monthlySummary[monthKey].byCategory[expense.category] = 0;
        }
        monthlySummary[monthKey].byCategory[expense.category] += expense.value;
      }
    });
    
    // Converter para array e ordenar
    const summaryArray = Object.keys(monthlySummary)
      .sort((a, b) => b.localeCompare(a)) // Mais recentes primeiro
      .map(key => monthlySummary[key]);
    
    res.status(200).json(summaryArray);
  } catch (err) {
    next(err);
  }
},

// Resumo do mês atual
async currentMonthSummary(req, res, next) {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const where = {
      date: {
        gte: startDate,
        lte: endDate
      }
    };
    
    // Se usar soft delete
    if (prisma.fixedExpense.fields.isActive) {
      where.isActive = true;
    }
    
    const expenses = await prisma.fixedExpense.findMany({
      where
    });
    
    const total = expenses.reduce((sum, exp) => sum + exp.value, 0);
    const byCategory = {};
    
    expenses.forEach(exp => {
      if (exp.category) {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.value;
      }
    });
    
    res.status(200).json({
      year,
      month,
      monthName: now.toLocaleString('pt-BR', { month: 'long' }),
      total,
      count: expenses.length,
      byCategory
    });
  } catch (err) {
    next(err);
  }
},

// Comparação com mês anterior
async comparison(req, res, next) {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // Mês atual
    const currentStart = new Date(currentYear, currentMonth - 1, 1);
    const currentEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    
    // Mês anterior
    const previousDate = new Date(currentYear, currentMonth - 2, 1);
    const previousYear = previousDate.getFullYear();
    const previousMonth = previousDate.getMonth() + 1;
    const previousStart = new Date(previousYear, previousMonth - 1, 1);
    const previousEnd = new Date(previousYear, previousMonth, 0, 23, 59, 59);
    
    const whereActive = prisma.fixedExpense.fields.isActive ? { isActive: true } : {};
    
    const [currentExpenses, previousExpenses] = await Promise.all([
      prisma.fixedExpense.findMany({
        where: {
          ...whereActive,
          date: { gte: currentStart, lte: currentEnd }
        }
      }),
      prisma.fixedExpense.findMany({
        where: {
          ...whereActive,
          date: { gte: previousStart, lte: previousEnd }
        }
      })
    ]);
    
    const currentTotal = currentExpenses.reduce((sum, exp) => sum + exp.value, 0);
    const previousTotal = previousExpenses.reduce((sum, exp) => sum + exp.value, 0);
    
    const variation = previousTotal > 0 
      ? ((currentTotal - previousTotal) / previousTotal) * 100 
      : currentTotal > 0 ? 100 : 0;
    
    res.status(200).json({
      current: {
        year: currentYear,
        month: currentMonth,
        monthName: now.toLocaleString('pt-BR', { month: 'long' }),
        total: currentTotal,
        count: currentExpenses.length
      },
      previous: {
        year: previousYear,
        month: previousMonth,
        monthName: previousDate.toLocaleString('pt-BR', { month: 'long' }),
        total: previousTotal,
        count: previousExpenses.length
      },
      variation,
      trend: variation > 0 ? 'up' : variation < 0 ? 'down' : 'stable'
    });
  } catch (err) {
    next(err);
  }
},

// Forçar a geração das contas fixas pontualmente
async generateMonth(req, res, next) {
  try {
    const { year, month } = req.body; // Puxar do front caso tenham
    const result = await generateMonthlyExpenses(year, month);
    res.status(result.count > 0 ? 201 : 200).json({
      message: result.count > 0 
        ? `Geração concluída com sucesso. Foram projetadas ${result.count} contas para o mês atual.`
        : "Nenhuma nova despesa precisou ser gerada neste mês.",
      createdCount: result.count
    });
  } catch (err) {
    next(err);
  }
}
};