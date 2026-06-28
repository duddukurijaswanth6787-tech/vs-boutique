const categoriesService = require('../services/categories.service');

class CategoriesController {
  // ── Categories ──────────────────────────────────────────────────────
  getActiveCategories = async (req, res) => {
    try {
      const categories = await categoriesService.getActiveCategories();
      return res.json({ success: true, data: categories });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  getAllCategoriesForAdmin = async (req, res) => {
    try {
      const categories = await categoriesService.getAllCategoriesForAdmin();
      return res.json({ success: true, data: categories });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  getCategoryById = async (req, res) => {
    try {
      const category = await categoriesService.getCategoryById(req.params.id);
      return res.json({ success: true, data: category });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  createCategory = async (req, res) => {
    try {
      const category = await categoriesService.createCategory(req.body);
      return res.status(201).json({ success: true, data: category });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  updateCategory = async (req, res) => {
    try {
      const category = await categoriesService.updateCategory(req.params.id, req.body);
      return res.json({ success: true, data: category });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  deleteCategory = async (req, res) => {
    try {
      await categoriesService.deleteCategory(req.params.id);
      return res.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  toggleCategory = async (req, res) => {
    try {
      const category = await categoriesService.toggleCategory(req.params.id);
      return res.json({ success: true, data: category });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  // ── SubCategories ───────────────────────────────────────────────────
  getActiveSubCategories = async (req, res) => {
    try {
      const { categoryId } = req.query;
      const subCategories = await categoriesService.getActiveSubCategories(categoryId);
      return res.json({ success: true, data: subCategories });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  getAllSubCategoriesForAdmin = async (req, res) => {
    try {
      const { categoryId } = req.query;
      const subCategories = await categoriesService.getAllSubCategoriesForAdmin(categoryId);
      return res.json({ success: true, data: subCategories });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  getSubCategoryById = async (req, res) => {
    try {
      const subCategory = await categoriesService.getSubCategoryById(req.params.id);
      return res.json({ success: true, data: subCategory });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  createSubCategory = async (req, res) => {
    try {
      const subCategory = await categoriesService.createSubCategory(req.body);
      return res.status(201).json({ success: true, data: subCategory });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  createSubCategoryForCategory = async (req, res) => {
    try {
      const subCategory = await categoriesService.createSubCategoryForCategory(req.params.id, req.body);
      return res.status(201).json({ success: true, data: subCategory });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  updateSubCategory = async (req, res) => {
    try {
      const subCategory = await categoriesService.updateSubCategory(req.params.id, req.body);
      return res.json({ success: true, data: subCategory });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  deleteSubCategory = async (req, res) => {
    try {
      await categoriesService.deleteSubCategory(req.params.id);
      return res.json({ success: true, message: 'SubCategory deleted successfully' });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };

  toggleSubCategory = async (req, res) => {
    try {
      const subCategory = await categoriesService.toggleSubCategory(req.params.id);
      return res.json({ success: true, data: subCategory });
    } catch (err) {
      return res.status(err.status || 500).json({ success: false, message: err.message });
    }
  };
}

module.exports = new CategoriesController();
