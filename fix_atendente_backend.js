import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const rule = await prisma.rule.upsert({
    where: { name: 'ATENDENTE' },
    update: {},
    create: { name: 'ATENDENTE', description: 'Atendimento ao cliente e registro de pedidos' }
  });
  console.log('Rule criada:', rule);

  const group = await prisma.group.upsert({
    where: { name: 'Atendentes' },
    update: {},
    create: { name: 'Atendentes', description: 'Atendimento ao cliente' }
  });
  console.log('Group criado:', group);

  const rg = await prisma.ruleGroup.upsert({
    where: { groupId_ruleId: { groupId: group.id, ruleId: rule.id } },
    update: {},
    create: { groupId: group.id, ruleId: rule.id }
  });
  console.log('RuleGroup vinculado:', rg);
  console.log('Pronto! Group Atendentes criado com ID', group.id);
}

main()
  .catch(e => { console.error('Erro:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
