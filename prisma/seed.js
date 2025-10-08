import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

 
  // Helpers idempotentes (usam únicos `name`)
async function upsertRule({ name, description }) {
  return prisma.rule.upsert({
    where: { name },
    update: { description },
    create: { name, description }
  });
}

async function upsertGroup({ name, description }) {
  return prisma.group.upsert({
    where: { name },
    update: { description },
    create: { name, description }
  });
}

// Vincula regra ao grupo (idempotente via @@unique([groupId, ruleId]))
async function connectRuleToGroup({ groupId, ruleId }) {
  return prisma.ruleGroup.upsert({
    where: {
      // precisa de um identificador único. Criaremos um “composite key surrogate”
      // usando @@unique([groupId, ruleId]) → Prisma exige um nome. Podemos usar um find+create:
      // Porém o upsert requer um unique. Alternativa: try/catch create.
      // Para usar upsert puro, crie um unique artificial:
      // @@unique([groupId, ruleId], name: "group_rule_unique")
      groupId_ruleId: { groupId, ruleId } // nomeamos a unique como "groupId_ruleId"
    },
    update: {},
    create: { groupId, ruleId }
  });
}

// Vincula user ao grupo (idempotente via @@unique([userId, groupId]))
async function connectUserToGroup({ userId, groupId }) {
  return prisma.groupUser.upsert({
    where: {
      userId_groupId: { userId, groupId } // idem: nomeie a unique
    },
    update: {},
    create: { userId, groupId }
  });
}

async function main() {
  // 1) Cria Rules
  const rulesData = [
    { name: 'ADM',   description: 'Acesso total ao sistema'},
    { name: 'CONFEITEIRAS',  description: 'Pode editar a quantidade de produtos no estoque / acesso parcial' },
  ];

  const rules = {};
  for (const r of rulesData) {
    const rule = await upsertRule(r);
    rules[rule.name] = rule; // rules.ADMIN, rules.EDITOR, etc, os names passados acimas
  }
  
  // 2) Cria Groups
  const groupsData = [
    { name: 'Administrador',        description: 'Administrador' },
    { name: 'Confeiteiras',description: 'Funcionário com acesso parcial' },
  ];

  const groups = {};
  for (const g of groupsData) {
    const group = await upsertGroup(g);
    groups[group.name] = group; // groups['Turma TI43'], etc.
  }
  
  // 3) Vincula Rules aos Groups
  // Crie um nome para a unique composta no schema para permitir upsert,
  // ex: @@unique([groupId, ruleId], name: "group_rule_unique")
  
  const passHash = await bcrypt.hash("Adm@123", 10);
  
  const user = await prisma.user.create({

    data: {
      name: "adm",
      email: "adm@gmail.com",
      password: passHash,
      phone: "16992455837"
    }
  });

  console.log("User created:", user);


await connectRuleToGroup({ groupId: groups['Administrador'].id,        ruleId: rules.ADM.id });
await connectRuleToGroup({ groupId: groups['Confeiteiras'].id,        ruleId: rules.CONFEITEIRAS.id });


// 4) (Opcional) Vincula Users a Groups
// Se já existir User com id 1 e 2, por exemplo:
  try {
    await connectUserToGroup({ userId: 1, groupId: groups['Administrador'].id });
    } catch {
    
    console.log('Seed concluído com Rules, Groups, RuleGroup e GroupUser');
  }
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
