const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const sessions = await prisma.aISession.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: {
      executions: {
        orderBy: { updatedAt: 'asc' }
      }
    }
  });

  for (const s of sessions) {
    console.log(`Session: ${s.id} | Business: ${s.businessName} | Status: ${s.status}`);
    console.log(`- Executions count: ${s.executions.length}`);
    const valExec = s.executions.find(e => e.agentId === 'validation');
    console.log(`- Validation Exec status: ${valExec?.status} | Output:`, JSON.stringify(valExec?.outputPayload));
    
    const completedCount = s.executions.filter(e => e.status === 'COMPLETED').length;
    console.log(`- Completed: ${completedCount}/12`);
    console.log('-------------------------------------------');
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
