import { PrismaClient, UserType, AccountStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as argon2 from 'argon2';

dotenv.config({ path: path.join(__dirname, '../.env') });

const benchmarkDbUrl = 'postgresql://postgres:postgres@localhost:5432/vasanthi_benchmark?schema=public';

async function main() {
  const currentDbUrl = process.env.DATABASE_URL || benchmarkDbUrl;
  console.log(`Current DATABASE_URL: ${currentDbUrl}`);

  // Safety checks
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL ERROR: Cannot run benchmark seed in PRODUCTION mode!');
    process.exit(1);
  }
  if (!currentDbUrl.includes('vasanthi_benchmark')) {
    console.error('CRITICAL ERROR: DATABASE_URL must point to "vasanthi_benchmark" database!');
    process.exit(1);
  }

  console.log('Isolated benchmark environment confirmed.');
  console.log('Initializing Prisma client with target database...');

  const pool = new Pool({ connectionString: currentDbUrl });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  // Configurable scale (SMALL by default)
  const scale = {
    brands: 10,
    categories: 10,
    products: 1000,
    variantsPerProduct: 2,
    customers: 2000,
    orders: 5000,
    socialPosts: 10000,
    warehouses: 2
  };

  console.log(`Configured scale profile:`, scale);

  try {
    // 1. Clean existing tables (in order of dependencies)
    console.log('Cleaning existing benchmark tables...');
    await prisma.socialReport.deleteMany({});
    await prisma.socialComment.deleteMany({});
    await prisma.socialLike.deleteMany({});
    await prisma.socialPostProduct.deleteMany({});
    await prisma.socialPostMedia.deleteMany({});
    await prisma.socialPost.deleteMany({});
    await prisma.orderTimeline.deleteMany({});
    await prisma.orderAddress.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.customerAddress.deleteMany({});
    await prisma.customerProfile.deleteMany({});
    await prisma.variantWarehouseInventory.deleteMany({});
    await prisma.inventoryMovement.deleteMany({});
    await prisma.inventory.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.productCategory.deleteMany({});
    await prisma.productAttribute.deleteMany({});
    await prisma.productMedia.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.brand.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.warehouse.deleteMany({});
    
    // Keep baseline users/roles seeded earlier, but clean up seeded customer users
    await prisma.userRole.deleteMany({
      where: {
        role: { name: 'customer' }
      }
    });
    await prisma.user.deleteMany({
      where: {
        userType: UserType.CUSTOMER
      }
    });

    console.log('Tables cleared.');

    // Pre-calculate password hash to save substantial argon2 computation overhead
    console.log('Hashing default user password once...');
    const defaultPasswordHash = await argon2.hash('CustomerPass123!');
    console.log('Password hash ready.');

    // 2. Seed Warehouses
    console.log('Seeding warehouses...');
    const warehouseData = [];
    for (let w = 1; w <= scale.warehouses; w++) {
      warehouseData.push({
        id: `wh-uuid-${w}`,
        code: `WH-${w}`,
        name: `Warehouse ${w}`,
        address: `${w} Warehouse St`,
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'IN',
        postalCode: '600001',
        status: 'ACTIVE'
      });
    }
    await prisma.warehouse.createMany({ data: warehouseData });

    // 3. Seed Brands
    console.log('Seeding brands...');
    const brandData = [];
    for (let b = 1; b <= scale.brands; b++) {
      brandData.push({
        id: `brand-uuid-${b}`,
        name: `Brand ${b}`,
        slug: `brand-${b}`,
        description: `Description for Brand ${b}`,
        status: 'ACTIVE',
        isVisible: true
      });
    }
    await prisma.brand.createMany({ data: brandData });

    // 4. Seed Categories
    console.log('Seeding categories...');
    const categoryData = [];
    for (let c = 1; c <= scale.categories; c++) {
      categoryData.push({
        id: `category-uuid-${c}`,
        name: `Category ${c}`,
        slug: `category-${c}`,
        description: `Description for Category ${c}`,
        status: 'ACTIVE',
        isVisible: true,
        displayOrder: c
      });
    }
    await prisma.category.createMany({ data: categoryData });

    // 5. Seed Products
    console.log('Seeding products...');
    const productData = [];
    const productCategoryLinks = [];
    for (let p = 1; p <= scale.products; p++) {
      const brandId = `brand-uuid-${(p % scale.brands) + 1}`;
      const status = p % 10 === 0 ? 'DRAFT' : p % 15 === 0 ? 'ARCHIVED' : 'ACTIVE';
      const visibility = status === 'ACTIVE' ? 'VISIBLE' : 'HIDDEN';

      productData.push({
        id: `prod-uuid-${p}`,
        sku: `SKU-${p}-${100000 + p}`,
        barcode: `BARCODE-${p}-${100000 + p}`,
        name: `Product Title ${p}`,
        slug: `product-title-${p}`,
        brandId,
        basePrice: 1000 + (p * 50) % 5000,
        type: p % 2 === 0 ? 'READYMADE' : 'FABRIC',
        status,
        visibility,
        isPublished: status === 'ACTIVE',
        isFeatured: p % 8 === 0,
        isNewArrival: p % 12 === 0,
        isBestSeller: p % 15 === 0,
        createdAt: new Date(Date.now() - p * 30 * 60 * 1000) // spread created dates
      });

      // Product category link
      productCategoryLinks.push({
        productId: `prod-uuid-${p}`,
        categoryId: `category-uuid-${(p % scale.categories) + 1}`
      });
    }
    await prisma.product.createMany({ data: productData });
    await prisma.productCategory.createMany({ data: productCategoryLinks });

    // 6. Seed ProductVariants & Inventory
    console.log('Seeding product variants & inventory items...');
    const variantData = [];
    const inventoryData = [];
    const warehouseInventoryData = [];

    let variantCounter = 1;
    for (let p = 1; p <= scale.products; p++) {
      for (let v = 1; v <= scale.variantsPerProduct; v++) {
        const variantId = `var-uuid-${variantCounter}`;
        const sku = `SKU-${p}-VAR-${v}`;
        variantData.push({
          id: variantId,
          productId: `prod-uuid-${p}`,
          sku,
          barcode: `BARCODE-${p}-VAR-${v}`,
          title: `Size ${v === 1 ? 'M' : 'L'} / Color ${v === 1 ? 'Red' : 'Blue'}`,
          priceOverride: v === 1 ? 0 : 200,
          weight: 0.5,
          isActive: true,
          status: 'ACTIVE'
        });

        // Inventory
        const inventoryId = `inv-uuid-${variantCounter}`;
        const availableQuantity = 10 + (variantCounter * 17) % 150;
        const stockStatus = availableQuantity === 0 ? 'OUT_OF_STOCK' : availableQuantity < 15 ? 'LOW_STOCK' : 'IN_STOCK';
        
        inventoryData.push({
          id: inventoryId,
          variantId,
          availableQuantity,
          reservedQuantity: (variantCounter * 3) % availableQuantity,
          damagedQuantity: 0,
          returnedQuantity: 0,
          minimumStock: 5,
          maximumStock: 200,
          reorderLevel: 10,
          stockStatus
        });

        // Warehouse Inventory
        for (let w = 1; w <= scale.warehouses; w++) {
          warehouseInventoryData.push({
            id: `wh-inv-uuid-${variantCounter}-${w}`,
            variantId,
            warehouseId: `wh-uuid-${w}`,
            availableQuantity: Math.floor(availableQuantity / scale.warehouses),
            reservedQuantity: 0
          });
        }

        variantCounter++;
      }
    }
    await prisma.productVariant.createMany({ data: variantData });
    await prisma.inventory.createMany({ data: inventoryData });
    await prisma.variantWarehouseInventory.createMany({ data: warehouseInventoryData });

    // 7. Seed Customers (Users & CustomerProfiles)
    console.log('Seeding customer users & profiles...');
    const userData = [];
    const profileData = [];
    const customerRole = await prisma.role.findUnique({ where: { name: 'customer' } });

    for (let c = 1; c <= scale.customers; c++) {
      const userId = `user-customer-uuid-${c}`;
      const customerId = `cust-profile-uuid-${c}`;
      
      userData.push({
        id: userId,
        email: `customer${c}@example.com`,
        passwordHash: defaultPasswordHash,
        userType: UserType.CUSTOMER,
        accountStatus: AccountStatus.ACTIVE,
        firstName: `CustomerFirst${c}`,
        lastName: `CustomerLast${c}`,
        isEmailVerified: true,
        createdAt: new Date(Date.now() - c * 2 * 3600 * 1000)
      });

      profileData.push({
        id: customerId,
        userId,
        phone: `9876543${c.toString().padStart(3, '0')}`,
        gender: c % 3 === 0 ? 'MALE' : 'FEMALE',
        preferredLanguage: 'en',
        preferredCurrency: 'INR'
      });
    }

    // Batch insert users and profiles
    const batchSize = 500;
    for (let i = 0; i < userData.length; i += batchSize) {
      const userBatch = userData.slice(i, i + batchSize);
      await prisma.user.createMany({ data: userBatch });
    }
    for (let i = 0; i < profileData.length; i += batchSize) {
      const profileBatch = profileData.slice(i, i + batchSize);
      await prisma.customerProfile.createMany({ data: profileBatch });
    }

    // Link customer roles
    if (customerRole) {
      const userRoleLinks = [];
      for (let c = 1; c <= scale.customers; c++) {
        userRoleLinks.push({
          userId: `user-customer-uuid-${c}`,
          roleId: customerRole.id
        });
      }
      for (let i = 0; i < userRoleLinks.length; i += batchSize) {
        await prisma.userRole.createMany({ data: userRoleLinks.slice(i, i + batchSize) });
      }
    }

    // 8. Seed Orders and OrderItems
    console.log('Seeding orders & order items...');
    const orderData = [];
    const orderItemData = [];
    const orderAddressData = [];
    const orderTimelineData = [];

    const orderStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];

    let orderItemCounter = 1;
    for (let o = 1; o <= scale.orders; o++) {
      const customerId = `cust-profile-uuid-${(o % scale.customers) + 1}`;
      const status = orderStatuses[o % orderStatuses.length];
      const subtotal = 1500 + (o * 100) % 5000;
      const taxTotal = Math.round(subtotal * 0.18);
      const grandTotal = subtotal + taxTotal;

      const orderId = `order-uuid-${o}`;
      const orderNumber = `ORD-${1000000 + o}`;

      orderData.push({
        id: orderId,
        orderNumber,
        customerId,
        status,
        subtotal,
        discountTotal: 0,
        taxTotal,
        shippingCharge: 50,
        grandTotal: grandTotal + 50,
        createdAt: new Date(Date.now() - o * 4 * 3600 * 1000)
      });

      // Add 1-2 items per order
      const itemsCount = 1 + (o % 2);
      for (let item = 1; item <= itemsCount; item++) {
        const productIndex = ((o * 7 + item) % scale.products) + 1;
        const productId = `prod-uuid-${productIndex}`;
        const variantIndex = (productIndex - 1) * scale.variantsPerProduct + 1;
        const variantId = `var-uuid-${variantIndex}`;

        orderItemData.push({
          id: `order-item-uuid-${orderItemCounter}`,
          orderId,
          productId,
          variantId,
          productName: `Product Title ${productIndex}`,
          sku: `SKU-${productIndex}-VAR-1`,
          quantity: 1 + (o % 3),
          unitPrice: 1000,
          totalPrice: 1000 * (1 + (o % 3))
        });
        orderItemCounter++;
      }

      // Order Address
      orderAddressData.push({
        id: `order-addr-uuid-${o}`,
        orderId,
        addressType: 'SHIPPING',
        fullName: `Customer Name ${o}`,
        phone: '9876543210',
        addressLine1: `${o} Order St`,
        city: 'Chennai',
        state: 'Tamil Nadu',
        postalCode: '600001',
        country: 'IN'
      });

      // Order Timeline
      orderTimelineData.push({
        id: `order-time-uuid-${o}`,
        orderId,
        status,
        message: `Order status moved to ${status}`,
        createdAt: new Date(Date.now() - o * 4 * 3600 * 1000)
      });
    }

    // Batch insert orders
    console.log('Writing orders and details...');
    for (let i = 0; i < orderData.length; i += batchSize) {
      await prisma.order.createMany({ data: orderData.slice(i, i + batchSize) });
    }
    for (let i = 0; i < orderItemData.length; i += batchSize) {
      await prisma.orderItem.createMany({ data: orderItemData.slice(i, i + batchSize) });
    }
    for (let i = 0; i < orderAddressData.length; i += batchSize) {
      await prisma.orderAddress.createMany({ data: orderAddressData.slice(i, i + batchSize) });
    }
    for (let i = 0; i < orderTimelineData.length; i += batchSize) {
      await prisma.orderTimeline.createMany({ data: orderTimelineData.slice(i, i + batchSize) });
    }

    // 9. Seed Social Posts
    console.log('Seeding social posts & analytics...');
    const socialPostData = [];
    const adminUser = await prisma.user.findFirst({
      where: {
        userType: UserType.SUPER_ADMIN
      }
    });

    if (!adminUser) {
      throw new Error('Super admin user not found in database to author social posts.');
    }

    const postTypes = ['POST', 'REEL', 'STORY'];

    for (let sp = 1; sp <= scale.socialPosts; sp++) {
      const contentType = postTypes[sp % postTypes.length];
      const likeCount = (sp * 7) % 500;
      const commentCount = (sp * 3) % 100;
      const shareCount = (sp * 2) % 50;
      const saveCount = (sp * 4) % 120;
      const viewCount = likeCount * 5 + (sp % 1000);
      const playCount = contentType === 'REEL' ? viewCount : 0;

      socialPostData.push({
        id: `post-uuid-${sp}`,
        authorId: adminUser.id,
        contentType,
        caption: `Benchmark Social Saree Post #${sp} ${contentType.toLowerCase()}`,
        hashtags: ['#benchmark', `#${contentType.toLowerCase()}`],
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        likeCount,
        commentCount,
        shareCount,
        saveCount,
        viewCount,
        playCount,
        publishedAt: new Date(Date.now() - sp * 10 * 60 * 1000),
        createdAt: new Date(Date.now() - sp * 10 * 60 * 1000)
      });
    }

    for (let i = 0; i < socialPostData.length; i += batchSize) {
      await prisma.socialPost.createMany({ data: socialPostData.slice(i, i + batchSize) });
    }

    console.log('Benchmark seeding completed successfully!');
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(console.error);
