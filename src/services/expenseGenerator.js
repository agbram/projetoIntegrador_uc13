import prisma from '../prisma.js';

export const generateMonthlyExpenses = async (targetYear, targetMonth) => {
  const isSpecificDate = targetYear && targetMonth;
  console.log(`🔄 Iniciando geração manual de despesas mensais ${isSpecificDate ? `para ${targetMonth}/${targetYear}` : 'para o mês atual'}...`);
  
  try {
    const today = new Date();
    const currentYear = targetYear ? parseInt(targetYear) : today.getFullYear();
    const currentMonth = targetMonth ? parseInt(targetMonth) - 1 : today.getMonth(); // 0 a 11

    // Calcular o mês anterior
    const previousDate = new Date(currentYear, currentMonth - 1, 1);
    const previousYear = previousDate.getFullYear();
    const previousMonth = previousDate.getMonth();

    const firstDayOfPrevMonth = new Date(previousYear, previousMonth, 1);
    const lastDayOfPrevMonth = new Date(previousYear, previousMonth + 1, 0, 23, 59, 59, 999);

    // 1. Busca todas as despesas do mês anterior que são recorrentes e ativas
    const recurringExpenses = await prisma.fixedExpense.findMany({
      where: {
        recurring: true,
        isActive: true,
        date: {
          gte: firstDayOfPrevMonth,
          lte: lastDayOfPrevMonth
        }
      }
    });

    console.log(`📊 Encontradas ${recurringExpenses.length} despesas base recorrentes ativas no mês passado.`);
    let createdCount = 0;

    const firstDayOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    for (const expense of recurringExpenses) {
      // 2. Verifica se JÁ existe um registro com a mesma descrição, neste mês atual (Impede duplicação garantindo o requisito 4)
      const alreadyExistsThisMonth = await prisma.fixedExpense.findFirst({
        where: {
          description: expense.description, // O Prisma tem "description", e não "name"
          recurring: true,
          date: {
            gte: firstDayOfCurrentMonth,
            lte: lastDayOfCurrentMonth
          }
        }
      });

      // 3. Se NÃO existe log dessa despesa neste mês, ela é criada
      if (!alreadyExistsThisMonth) {
        await prisma.fixedExpense.create({
          data: {
            description: expense.description,
            value: expense.value,
            date: firstDayOfCurrentMonth, // Atualizando a data para o primeiro dia do corrente mês
            recurring: true,
            category: expense.category,
            note: expense.note, // Mantemos tudo sem prefixar lixo na nota, mantendo a original
            isActive: true
          }
        });
        createdCount++;
      }
    }

    console.log(`✅ Operação concluída! Foram geradas ${createdCount} novas despesas neste mês.`);
    return { success: true, count: createdCount };

  } catch (error) {
    console.error('❌ Falha ao processar a geração de despesas:', error);
    throw error;
  }
};
