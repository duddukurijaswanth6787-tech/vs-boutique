const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const owners = await prisma.owner.findMany();
  console.log('Owners in Postgres:', owners.map(o => ({
    id: o.id,
    username: o.username,
    email: o.email,
    role: o.role,
    status: o.status,
    loginEnabled: o.loginEnabled
  })));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
