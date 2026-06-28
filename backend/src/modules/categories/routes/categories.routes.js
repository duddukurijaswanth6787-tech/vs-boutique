const express = require('express');
const categoriesController = require('../controllers/categories.controller');
const { protect, authorize } = require('../../../middleware/authMiddleware');

const adminMiddleware = [protect, authorize('super-admin')];

// Router 1: /categories
const categoriesRouter = express.Router();

categoriesRouter.get('/', categoriesController.getActiveCategories);
categoriesRouter.get('/admin', ...adminMiddleware, categoriesController.getAllCategoriesForAdmin);
categoriesRouter.get('/:id', categoriesController.getCategoryById);
categoriesRouter.post('/', ...adminMiddleware, categoriesController.createCategory);
categoriesRouter.put('/:id', ...adminMiddleware, categoriesController.updateCategory);
categoriesRouter.delete('/:id', ...adminMiddleware, categoriesController.deleteCategory);
categoriesRouter.put('/:id/toggle', ...adminMiddleware, categoriesController.toggleCategory);

// Nested subcategories under /categories/:id/subcategories
categoriesRouter.post('/:id/subcategories', ...adminMiddleware, categoriesController.createSubCategoryForCategory);

// Legacy/Alternative subcategory endpoints defined inside category routes
categoriesRouter.put('/subcategories/:id', ...adminMiddleware, categoriesController.updateSubCategory);
categoriesRouter.delete('/subcategories/:id', ...adminMiddleware, categoriesController.deleteSubCategory);
categoriesRouter.put('/subcategories/:id/toggle', ...adminMiddleware, categoriesController.toggleSubCategory);


// Router 2: /subcategories
const subCategoriesRouter = express.Router();

subCategoriesRouter.get('/', categoriesController.getActiveSubCategories);
subCategoriesRouter.get('/admin', ...adminMiddleware, categoriesController.getAllSubCategoriesForAdmin);
subCategoriesRouter.get('/:id', categoriesController.getSubCategoryById);
subCategoriesRouter.post('/', ...adminMiddleware, categoriesController.createSubCategory);
subCategoriesRouter.put('/:id', ...adminMiddleware, categoriesController.updateSubCategory);
subCategoriesRouter.delete('/:id', ...adminMiddleware, categoriesController.deleteSubCategory);
subCategoriesRouter.put('/:id/toggle', ...adminMiddleware, categoriesController.toggleSubCategory);


module.exports = {
  categoriesRouter,
  subCategoriesRouter
};
