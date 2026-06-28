import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminCategories, createCategory, updateCategory, deleteCategory, toggleCategory,
  createSubCategory, updateSubCategory, deleteSubCategory, toggleSubCategory
} from '@core/services';
import DeleteConfirm from '@core/components/shared/DeleteConfirm';
import { TableSkeleton } from '@core/components/ui/Skeleton';
import {
  Plus, X, Search, ChevronDown, ChevronRight, Edit2, Trash2,
  Eye, EyeOff, FolderOpen, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '@core/hooks/useDebounce';

const defaultCategoryForm = { name: '', description: '', sortOrder: 0 };
const defaultSubCategoryForm = { name: '', description: '', sortOrder: 0 };

const Categories = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [expandedId, setExpandedId] = useState(null);

  // Category form
  const [showCatForm, setShowCatForm] = useState(false);
  const [catForm, setCatForm] = useState(defaultCategoryForm);
  const [editingCat, setEditingCat] = useState(null);

  // SubCategory form
  const [subFormCategoryId, setSubFormCategoryId] = useState(null);
  const [subForm, setSubForm] = useState(defaultSubCategoryForm);
  const [editingSub, setEditingSub] = useState(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  const catMutation = useMutation({
    mutationFn: async ({ type, ...vars }) => {
      if (type === 'create') return createCategory(vars.data);
      if (type === 'update') return updateCategory(vars.id, vars.data);
      if (type === 'toggle') return toggleCategory(vars.id);
    },
    onSuccess: () => { queryClient.invalidateQueries(['admin-categories']); },
  });

  const subMutation = useMutation({
    mutationFn: async ({ type, ...vars }) => {
      if (type === 'create') return createSubCategory(vars.categoryId, vars.data);
      if (type === 'update') return updateSubCategory(vars.id, vars.data);
      if (type === 'toggle') return toggleSubCategory(vars.id);
    },
    onSuccess: () => { queryClient.invalidateQueries(['admin-categories']); },
  });

  const deleteCatMutation = useMutation({
    mutationFn: ({ id, adminPassword }) => deleteCategory(id, adminPassword),
    onSuccess: () => { queryClient.invalidateQueries(['admin-categories']); },
  });

  const deleteSubMutation = useMutation({
    mutationFn: ({ id, adminPassword }) => deleteSubCategory(id, adminPassword),
    onSuccess: () => { queryClient.invalidateQueries(['admin-categories']); },
  });

  const filteredCategories = useMemo(() => {
    if (!debouncedSearch) return categories;
    const q = debouncedSearch.toLowerCase();
    return categories.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.subCategories?.some(s => s.name?.toLowerCase().includes(q))
    );
  }, [categories, debouncedSearch]);

  const resetCatForm = () => {
    setCatForm(defaultCategoryForm);
    setEditingCat(null);
    setShowCatForm(false);
  };

  const handleEditCat = (cat) => {
    setCatForm({ name: cat.name, description: cat.description || '', sortOrder: cat.sortOrder });
    setEditingCat(cat);
    setShowCatForm(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return;
    if (editingCat) {
      await catMutation.mutateAsync({ type: 'update', id: editingCat.id, data: catForm });
    } else {
      await catMutation.mutateAsync({ type: 'create', data: catForm });
    }
    resetCatForm();
  };

  const handleToggleCat = (id) => {
    catMutation.mutate({ type: 'toggle', id });
  };

  const openDeleteCat = (cat) => {
    setDeleteTarget(cat);
    setDeleteType('category');
    setAdminPassword('');
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const openDeleteSub = (sub) => {
    setDeleteTarget(sub);
    setDeleteType('subcategory');
    setAdminPassword('');
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!adminPassword) { setDeleteError('Please enter admin password.'); return; }
    setDeleteError('');
    if (deleteType === 'category') {
      deleteCatMutation.mutate(
        { id: deleteTarget.id, adminPassword },
        { onError: (err) => setDeleteError(err?.response?.data?.message || 'Delete failed') }
      );
    } else {
      deleteSubMutation.mutate(
        { id: deleteTarget.id, adminPassword },
        { onError: (err) => setDeleteError(err?.response?.data?.message || 'Delete failed') }
      );
    }
    setIsDeleteModalOpen(false);
  };

  const startAddSub = (categoryId) => {
    setSubForm(defaultSubCategoryForm);
    setEditingSub(null);
    setSubFormCategoryId(categoryId);
    setExpandedId(categoryId);
  };

  const handleEditSub = (sub) => {
    setSubForm({ name: sub.name, description: sub.description || '', sortOrder: sub.sortOrder });
    setEditingSub(sub);
    setSubFormCategoryId(sub.categoryId);
  };

  const handleSaveSub = async () => {
    if (!subForm.name.trim()) return;
    if (editingSub) {
      await subMutation.mutateAsync({ type: 'update', id: editingSub.id, data: subForm });
    } else {
      await subMutation.mutateAsync({ type: 'create', categoryId: subFormCategoryId, data: subForm });
    }
    setSubForm(defaultSubCategoryForm);
    setEditingSub(null);
    setSubFormCategoryId(null);
  };

  const handleToggleSub = (id) => {
    subMutation.mutate({ type: 'toggle', id });
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search categories & subcategories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-[1.5rem] shadow-card focus:ring-2 focus:ring-primary/10 outline-none transition-all font-semibold"
          />
        </div>
        <button
          onClick={() => { if (!showCatForm) resetCatForm(); setShowCatForm(!showCatForm); }}
          className={`flex items-center justify-center px-8 py-4 rounded-[1.5rem] font-black transition-all shadow-lg ${
            showCatForm
              ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
          }`}
        >
          {showCatForm ? <><X size={20} className="mr-2" /> Close</> : <><Plus size={20} className="mr-2" /> Add Category</>}
        </button>
      </div>

      <AnimatePresence>
        {showCatForm && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-[2.5rem] shadow-card p-8">
            <h3 className="text-lg font-black text-gray-900 mb-6">{editingCat ? 'Edit Category' : 'New Category'}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Name *</label>
                <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                <input value={catForm.description} onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sort Order</label>
                <input type="number" value={catForm.sortOrder} onChange={e => setCatForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button onClick={resetCatForm} className="px-6 py-3 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100">Cancel</button>
              <button onClick={handleSaveCat} disabled={!catForm.name.trim() || catMutation.isLoading}
                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-60">
                {editingCat ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? <TableSkeleton /> : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredCategories.map(cat => (
              <motion.div key={cat.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[2.5rem] shadow-card border border-gray-50 overflow-hidden">
                <div className="px-8 py-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center space-x-4 min-w-0">
                    <button onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                      className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                      {expandedId === cat.id ? <ChevronDown size={18} className="text-primary" /> : <ChevronRight size={18} className="text-gray-400" />}
                    </button>
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <FolderOpen size={22} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[15px] font-bold text-gray-900">{cat.name}</span>
                        {!cat.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-black rounded-lg uppercase tracking-wider">Inactive</span>
                        )}
                      </div>
                      {cat.description && <p className="text-xs text-gray-400 font-semibold mt-0.5">{cat.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">{cat.subCategories?.length || 0} subs</span>
                    <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-xl">Order {cat.sortOrder}</span>
                    <button onClick={() => handleToggleCat(cat.id)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors" title={cat.isActive ? 'Deactivate' : 'Activate'}>
                      {cat.isActive ? <Eye size={16} className="text-gray-400" /> : <EyeOff size={16} className="text-gray-400" />}
                    </button>
                    <button onClick={() => handleEditCat(cat)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                      <Edit2 size={16} className="text-gray-400" />
                    </button>
                    <button onClick={() => openDeleteCat(cat)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === cat.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-50 bg-gray-50/30">
                      <div className="p-6 space-y-3">
                        {cat.subCategories?.length === 0 && (
                          <p className="text-sm font-semibold text-gray-400 text-center py-4">No subcategories yet</p>
                        )}
                        {cat.subCategories?.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-gray-100">
                            <div className="flex items-center space-x-3 min-w-0">
                              <Tag size={16} className="text-gray-300 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-bold text-gray-700">{sub.name}</span>
                                {!sub.isActive && (
                                  <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-black rounded-lg uppercase">Inactive</span>
                                )}
                                {sub.description && <p className="text-xs text-gray-400 mt-0.5">{sub.description}</p>}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {subFormCategoryId === cat.id && editingSub?.id === sub.id ? null : (
                                <>
                                  <button onClick={() => handleToggleSub(sub.id)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title={sub.isActive ? 'Deactivate' : 'Activate'}>
                                    {sub.isActive ? <Eye size={14} className="text-gray-400" /> : <EyeOff size={14} className="text-gray-400" />}
                                  </button>
                                  <button onClick={() => handleEditSub(sub)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    <Edit2 size={14} className="text-gray-400" />
                                  </button>
                                  <button onClick={() => openDeleteSub(sub)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={14} className="text-red-400" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}

                        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-5">
                          {subFormCategoryId === cat.id ? (
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 flex space-x-3">
                                <input value={subForm.name} onChange={e => setSubForm(p => ({ ...p, name: e.target.value }))}
                                  placeholder="Subcategory name"
                                  className="flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/10 font-bold text-sm" />
                                <input value={subForm.description} onChange={e => setSubForm(p => ({ ...p, description: e.target.value }))}
                                  placeholder="Description (optional)"
                                  className="flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/10 font-bold text-sm" />
                                <input type="number" value={subForm.sortOrder} onChange={e => setSubForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                                  placeholder="Order"
                                  className="w-20 px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/10 font-bold text-sm text-center" />
                              </div>
                              <button onClick={() => { setSubFormCategoryId(null); setEditingSub(null); setSubForm(defaultSubCategoryForm); }}
                                className="p-2.5 bg-gray-50 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={16} />
                              </button>
                              <button onClick={handleSaveSub} disabled={!subForm.name.trim() || subMutation.isLoading}
                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 text-sm disabled:opacity-60">
                                {editingSub ? 'Update' : 'Add'}
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => startAddSub(cat.id)}
                              className="w-full flex items-center justify-center space-x-2 py-2 text-sm font-bold text-gray-400 hover:text-primary transition-colors">
                              <Plus size={16} /> <span>Add Subcategory</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <DeleteConfirm
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setAdminPassword(''); setDeleteError(''); }}
        onConfirm={handleConfirmDelete}
        loading={deleteCatMutation.isLoading || deleteSubMutation.isLoading}
        password={adminPassword}
        onPasswordChange={setAdminPassword}
        errorMessage={deleteError}
      />
    </div>
  );
};

export default Categories;
