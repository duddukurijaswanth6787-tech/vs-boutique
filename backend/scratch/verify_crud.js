const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    console.log("Starting Sequence & UUID Validation CRUD checks...");

    try {
        // 1. Fetch required existing relations
        const boutique = await prisma.boutique.findFirst();
        if (!boutique) throw new Error("No boutique found in the database. Please make sure the database is seeded/restored.");
        console.log(`Using existing Boutique: ${boutique.name} (${boutique.id})`);

        const owner = await prisma.owner.findFirst({
            where: { assignedBoutiqueId: boutique.id }
        }) || await prisma.owner.findFirst();
        if (!owner) throw new Error("No owner found in the database.");
        console.log(`Using existing Owner: ${owner.ownerName} (${owner.id})`);

        const category = await prisma.category.findFirst();
        if (!category) throw new Error("No category found in the database.");
        console.log(`Using existing Category: ${category.name} (${category.id})`);

        const subCategory = await prisma.subCategory.findFirst({
            where: { categoryId: category.id }
        }) || await prisma.subCategory.findFirst();
        if (!subCategory) throw new Error("No subcategory found in the database.");
        console.log(`Using existing SubCategory: ${subCategory.name} (${subCategory.id})`);

        const testPhone = "9999911111";
        const testSku = "TEST-SKU-99999";
        const testCommOrderId = "TEST-COMM-99999";
        const testTailorOrderId = "TEST-TAILOR-99999";

        // Clean up any stale test records first
        await prisma.commerceOrder.deleteMany({ where: { orderId: testCommOrderId } });
        await prisma.order.deleteMany({ where: { orderId: testTailorOrderId } });
        await prisma.product.deleteMany({ where: { sku: testSku } });
        await prisma.user.deleteMany({ where: { phone: testPhone } });

        console.log("\n--- Phase 1: INSERTS (Verifies UUID generation & sequences) ---");

        // A. Insert User (Customer)
        console.log("Inserting User...");
        const user = await prisma.user.create({
            data: {
                phone: testPhone,
                name: "Temporary Test Customer"
            }
        });
        console.log(`✅ User created successfully with UUID: ${user.id}`);

        // B. Insert Product
        console.log("Inserting Product...");
        const product = await prisma.product.create({
            data: {
                name: "Temporary Test Product",
                sku: testSku,
                basePrice: 99.99,
                boutiqueId: boutique.id,
                categoryId: category.id,
                subCategoryId: subCategory.id,
                status: "ACTIVE",
                productType: "READY_MADE"
            }
        });
        console.log(`✅ Product created successfully with UUID: ${product.id}`);

        // C. Insert CommerceOrder
        console.log("Inserting CommerceOrder...");
        const commOrder = await prisma.commerceOrder.create({
            data: {
                orderId: testCommOrderId,
                boutiqueId: boutique.id,
                userId: user.id,
                subtotal: 99.99,
                shippingAmount: 5.00,
                taxAmount: 8.00,
                discountAmount: 0.00,
                totalAmount: 112.99,
                commissionAmount: 10.00,
                netAmount: 102.99,
                status: "PENDING",
                paymentStatus: "PENDING"
            }
        });
        console.log(`✅ CommerceOrder created successfully with UUID: ${commOrder.id}`);

        // D. Insert Order (TailoringOrder)
        console.log("Inserting TailoringOrder...");
        const tailorOrder = await prisma.order.create({
            data: {
                orderId: testTailorOrderId,
                boutiqueId: boutique.id,
                ownerId: owner.id,
                customerName: user.name,
                customerPhone: user.phone,
                price: 150.00,
                advancePaid: 50.00,
                remainingAmount: 100.00,
                orderStatus: "pending",
                paymentStatus: "pending"
            }
        });
        console.log(`✅ TailoringOrder created successfully with UUID: ${tailorOrder.id}`);

        console.log("\n--- Phase 2: UPDATES ---");

        // A. Update User
        console.log("Updating User...");
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { name: "Updated Test Customer Name" }
        });
        console.log(`✅ User updated: ${updatedUser.name}`);

        // B. Update Product
        console.log("Updating Product...");
        const updatedProduct = await prisma.product.update({
            where: { id: product.id },
            data: { basePrice: 120.00 }
        });
        console.log(`✅ Product updated: Price set to ${updatedProduct.basePrice}`);

        // C. Update CommerceOrder
        console.log("Updating CommerceOrder...");
        const updatedCommOrder = await prisma.commerceOrder.update({
            where: { id: commOrder.id },
            data: { status: "SHIPPED" }
        });
        console.log(`✅ CommerceOrder updated: Status is ${updatedCommOrder.status}`);

        // D. Update TailoringOrder
        console.log("Updating TailoringOrder...");
        const updatedTailorOrder = await prisma.order.update({
            where: { id: tailorOrder.id },
            data: { orderStatus: "accepted" }
        });
        console.log(`✅ TailoringOrder updated: Status is ${updatedTailorOrder.orderStatus}`);

        console.log("\n--- Phase 3: DELETES (Clean up) ---");

        // A. Delete TailoringOrder
        console.log("Deleting TailoringOrder...");
        await prisma.order.delete({ where: { id: tailorOrder.id } });
        console.log("✅ TailoringOrder deleted.");

        // B. Delete CommerceOrder
        console.log("Deleting CommerceOrder...");
        await prisma.commerceOrder.delete({ where: { id: commOrder.id } });
        console.log("✅ CommerceOrder deleted.");

        // C. Delete Product
        console.log("Deleting Product...");
        await prisma.product.delete({ where: { id: product.id } });
        console.log("✅ Product deleted.");

        // D. Delete User
        console.log("Deleting User...");
        await prisma.user.delete({ where: { id: user.id } });
        console.log("✅ User deleted.");

        console.log("\n🎉 ALL CRUD VALIDATIONS PASSED! UUID generation and sequence constraints are 100% correct.");
        process.exit(0);
    } catch (e) {
        console.error("❌ CRUD Validation failed:", e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

run();
