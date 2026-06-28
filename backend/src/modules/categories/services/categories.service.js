const categoriesRepository = require('../repositories/categories.repository');

class CategoriesService {
  // ── Categories ──────────────────────────────────────────────────────
  async getActiveCategories() {
    return categoriesRepository.findActiveCategoriesWithSubcategories();
  }

  async getAllCategoriesForAdmin() {
    return categoriesRepository.findAllCategoriesWithSubcategories();
  }

  async getCategoryById(id) {
    const category = await categoriesRepository.findCategoryById(id);
    if (!category) {
      throw { status: 404, message: 'Category not found' };
    }
    return category;
  }

  async createCategory(body) {
    const { name, description, image, sortOrder } = body;
    if (!name) {
      throw { status: 400, message: 'Category name is required' };
    }

    try {
      return await categoriesRepository.createCategory({
        name,
        description,
        image,
        sortOrder: sortOrder ?? 0
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'Category name already exists' };
      }
      throw err;
    }
  }

  async updateCategory(id, body) {
    const { name, description, image, sortOrder, isActive } = body;

    try {
      return await categoriesRepository.updateCategory(id, {
        name,
        description,
        image,
        sortOrder,
        isActive
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'Category name already exists' };
      }
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Category not found' };
      }
      throw err;
    }
  }

  async deleteCategory(id) {
    try {
      await categoriesRepository.deleteCategory(id);
    } catch (err) {
      if (err.code === 'P2025') {
        throw { status: 404, message: 'Category not found' };
      }
      throw err;
    }
  }

  async toggleCategory(id) {
    const category = await categoriesRepository.findCategoryByIdRaw(id);
    if (!category) {
      throw { status: 404, message: 'Category not found' };
    }

    return categoriesRepository.updateCategory(id, {
      isActive: !category.isActive
    });
  }

  // ── SubCategories ───────────────────────────────────────────────────
  async getActiveSubCategories(categoryId) {
    const where = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    return categoriesRepository.findSubCategories(where);
  }

  async getAllSubCategoriesForAdmin(categoryId) {
    const where = {};
    if (categoryId) where.categoryId = categoryId;
    return categoriesRepository.findSubCategories(where);
  }

  async getSubCategoryById(id) {
    const subCategory = await categoriesRepository.findActiveSubCategoryById(id);
    if (!subCategory) {
      throw { status: 404, message: 'SubCategory not found' };
    }
    return subCategory;
  }

  async createSubCategory(body) {
    const { categoryId, name, description, image, sortOrder } = body;
    if (!categoryId) {
      throw { status: 400, message: 'Category ID is required' };
    }
    if (!name) {
      throw { status: 400, message: 'SubCategory name is required' };
    }

    const category = await categoriesRepository.findCategoryByIdRaw(categoryId);
    if (!category) {
      throw { status: 404, message: 'Category not found' };
    }

    try {
      return await categoriesRepository.createSubCategory({
        categoryId,
        name,
        description,
        image,
        sortOrder: sortOrder ?? 0
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'SubCategory name already exists in this category' };
      }
      throw err;
    }
  }

  async createSubCategoryForCategory(categoryId, body) {
    const { name, description, image, sortOrder } = body;
    if (!name) {
      throw { status: 400, message: 'SubCategory name is required' };
    }

    const category = await categoriesRepository.findCategoryByIdRaw(categoryId);
    if (!category) {
      throw { status: 404, message: 'Category not found' };
    }

    try {
      return await categoriesRepository.createSubCategory({
        categoryId,
        name,
        description,
        image,
        sortOrder: sortOrder ?? 0
      });
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'SubCategory name already exists in this category' };
      }
      throw err;
    }
  }

  async updateSubCategory(id, body) {
    const { categoryId, name, description, image, sortOrder, isActive } = body;

    const data = {};
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (image !== undefined) data.image = image;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;
    if (isActive !== undefined) data.isActive = isActive;

    try {
      return await categoriesRepository.updateSubCategory(id, data);
    } catch (err) {
      if (err.code === 'P2002') {
        throw { status: 409, message: 'SubCategory name already exists in this category' };
      }
      if (err.code === 'P2025') {
        throw { status: 404, message: 'SubCategory not found' };
      }
      throw err;
    }
  }

  async deleteSubCategory(id) {
    try {
      await categoriesRepository.deleteSubCategory(id);
    } catch (err) {
      if (err.code === 'P2025') {
        throw { status: 404, message: 'SubCategory not found' };
      }
      throw err;
    }
  }

  async toggleSubCategory(id) {
    const subCategory = await categoriesRepository.findSubCategoryById(id);
    if (!subCategory) {
      throw { status: 404, message: 'SubCategory not found' };
    }

    return categoriesRepository.updateSubCategory(id, {
      isActive: !subCategory.isActive
    });
  }
}

module.exports = new CategoriesService();
