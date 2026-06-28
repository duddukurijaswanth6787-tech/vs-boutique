const prisma = require('../../../utils/prisma');

class CategoriesRepository {
  // ── Categories ──────────────────────────────────────────────────────
  async findActiveCategoriesWithSubcategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async findAllCategoriesWithSubcategories() {
    return prisma.category.findMany({
      include: {
        subCategories: { orderBy: { sortOrder: 'asc' } }
      },
      orderBy: { sortOrder: 'asc' }
    });
  }

  async findCategoryById(id) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        subCategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
  }

  async findCategoryByIdRaw(id) {
    return prisma.category.findUnique({
      where: { id }
    });
  }

  async createCategory(data) {
    return prisma.category.create({ data });
  }

  async updateCategory(id, data) {
    return prisma.category.update({
      where: { id },
      data
    });
  }

  async deleteCategory(id) {
    return prisma.category.delete({
      where: { id }
    });
  }

  // ── SubCategories ───────────────────────────────────────────────────
  async findSubCategories(where) {
    return prisma.subCategory.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ categoryId: 'asc' }, { sortOrder: 'asc' }]
    });
  }

  async findSubCategoryById(id) {
    return prisma.subCategory.findUnique({
      where: { id }
    });
  }

  async findActiveSubCategoryById(id) {
    return prisma.subCategory.findFirst({
      where: { id, isActive: true },
      include: { category: { select: { id: true, name: true } } }
    });
  }

  async createSubCategory(data) {
    return prisma.subCategory.create({ data });
  }

  async updateSubCategory(id, data) {
    return prisma.subCategory.update({
      where: { id },
      data
    });
  }

  async deleteSubCategory(id) {
    return prisma.subCategory.delete({
      where: { id }
    });
  }
}

module.exports = new CategoriesRepository();
