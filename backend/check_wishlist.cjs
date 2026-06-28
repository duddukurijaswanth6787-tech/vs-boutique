const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const items = await prisma.productWishlist.findMany();
  console.log('Wishlists count:', items.length);
  console.log('Items:', JSON.stringify(items, null, 2));
  const products = await prisma.product.findMany({ where: { isDeleted: false } });
  console.log('Products count:', products.length);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); prisma.$disconnect(); });
