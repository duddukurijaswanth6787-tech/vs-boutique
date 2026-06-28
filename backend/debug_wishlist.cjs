const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, status: true, boutiqueId: true }
  });
  console.log('Products in DB:', JSON.stringify(products, null, 2));

  const admins = await prisma.owner.findMany({
    where: { role: 'super_admin' },
    select: { id: true, email: true }
  });
  console.log('Admins:', JSON.stringify(admins, null, 2));

  const loginRes = await fetch('http://localhost:3005/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin@vsboutique.com', password: 'admin@123' })
  });
  const loginData = await loginRes.json();
  console.log('Admin login:', loginRes.status, loginData.token ? 'OK' : loginData.message);

  if (loginData.token && products.length > 0) {
    const pid = products[0].id;
    console.log('Trying wishlist POST for productId:', pid);
    const res = await fetch('http://localhost:3005/products/wishlists/' + pid, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + loginData.token
      }
    });
    const data = await res.json();
    console.log('Wishlist result:', res.status, JSON.stringify(data));
  }
  await prisma.$disconnect();
}
debug().catch(e => { console.error(e); prisma.$disconnect(); });
