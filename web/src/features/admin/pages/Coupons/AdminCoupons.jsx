import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminCoupons, createAdminCoupon, updateAdminCoupon,
  toggleAdminCoupon, deleteAdminCoupon
} from '@core/services';
import { TableSkeleton } from '@core/components/ui/Skeleton';
import { Plus, X, Search, Edit2, Trash2, Power, PowerOff, Tag, Percent, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useDebounce from '@core/hooks/useDebounce';

const defaultForm = {
  code: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
  minOrderAmount: '', maxDiscount: '', maxUses: '', maxUsesPerUser: '1',
  applicableType: 'ALL', applicableIds: '', firstOrderOnly: false,
  startsAt: '', expiresAt: ''
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const toDateInputValue = (d) => {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 16);
};

const getCouponStatus = (coupon) => {
  if (!coupon.isActive) return { label: 'Inactive', color: 'bg-gray-100 text-gray-500' };
  const now = new Date();
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return { label: 'Expired', color: 'bg-red-50 text-red-500' };
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return { label: 'Scheduled', color: 'bg-yellow-50 text-yellow-600' };
  if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) return { label: 'Exhausted', color: 'bg-orange-50 text-orange-500' };
  return { label: 'Active', color: 'bg-green-50 text-green-600' };
};

const AdminCoupons = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState('all');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [editing, setEditing] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const { data: coupons = [], isLoading, error } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: getAdminCoupons,
  });

  const createMutation = useMutation({
    mutationFn: createAdminCoupon,
    onSuccess: () => { queryClient.invalidateQueries(['admin-coupons']); setShowForm(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminCoupon(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['admin-coupons']); setShowForm(false); resetForm(); },
  });

  const toggleMutation = useMutation({
    mutationFn: toggleAdminCoupon,
    onSuccess: () => queryClient.invalidateQueries(['admin-coupons']),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminCoupon,
    onSuccess: () => { queryClient.invalidateQueries(['admin-coupons']); setIsDeleteModalOpen(false); },
  });

  const resetForm = () => { setForm(defaultForm); setEditing(null); };

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue?.toString() || '',
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '',
      maxUses: coupon.maxUses?.toString() || '',
      maxUsesPerUser: coupon.maxUsesPerUser?.toString() || '1',
      applicableType: coupon.applicableType || 'ALL',
      applicableIds: (coupon.applicableIds || []).join(', '),
      firstOrderOnly: coupon.firstOrderOnly || false,
      startsAt: toDateInputValue(coupon.startsAt),
      expiresAt: toDateInputValue(coupon.expiresAt),
    });
    setEditing(coupon);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.discountValue) return;
    const payload = {
      code: form.code.trim(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue),
      minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
      maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
      maxUses: form.maxUses ? parseInt(form.maxUses) : 0,
      maxUsesPerUser: form.maxUsesPerUser ? parseInt(form.maxUsesPerUser) : 1,
      applicableType: form.applicableType,
      applicableIds: form.applicableIds ? form.applicableIds.split(',').map(s => s.trim()).filter(Boolean) : [],
      firstOrderOnly: form.firstOrderOnly,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  const handleToggle = (id) => {
    toggleMutation.mutate(id);
  };

  const openDelete = (coupon) => {
    setDeleteTarget(coupon);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(deleteTarget.id, {
      onError: (err) => setDeleteError(err?.response?.data?.message || 'Delete failed'),
    });
  };

  const filteredCoupons = useMemo(() => {
    if (!debouncedSearch && statusFilter === 'all') return coupons;
    return coupons.filter(c => {
      const q = debouncedSearch.toLowerCase();
      const matchesSearch = !debouncedSearch ||
        c.code?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q);
      const status = getCouponStatus(c).label.toLowerCase();
      const matchesFilter = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [coupons, debouncedSearch, statusFilter]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex-1 max-w-xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border-none rounded-[1.5rem] shadow-card focus:ring-2 focus:ring-primary/10 outline-none transition-all font-semibold"
          />
        </div>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-5 py-4 bg-white border-none rounded-[1.5rem] shadow-card focus:ring-2 focus:ring-primary/10 outline-none font-semibold text-gray-600"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="scheduled">Scheduled</option>
            <option value="exhausted">Exhausted</option>
          </select>
          <button
            onClick={() => { if (!showForm) resetForm(); setShowForm(!showForm); }}
            className={`flex items-center justify-center px-8 py-4 rounded-[1.5rem] font-black transition-all shadow-lg ${
              showForm
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-primary text-white hover:bg-primary-dark shadow-primary/20'
            }`}
          >
            {showForm ? <><X size={20} className="mr-2" /> Close</> : <><Plus size={20} className="mr-2" /> Add Coupon</>}
          </button>
        </div>
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[2.5rem] shadow-card p-8"
          >
            <h3 className="text-lg font-black text-gray-900 mb-6">
              {editing ? 'Edit Coupon' : 'New Coupon'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Code *</label>
                <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" placeholder="SUMMER20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Discount Type</label>
                <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed (₹)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Discount Value *</label>
                <input type="number" step="0.01" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Min Order Amount</label>
                <input type="number" step="0.01" value={form.minOrderAmount} onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Max Discount</label>
                <input type="number" step="0.01" value={form.maxDiscount} onChange={e => setForm(p => ({ ...p, maxDiscount: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Max Uses (0 = unlimited)</label>
                <input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Max Uses Per User</label>
                <input type="number" value={form.maxUsesPerUser} onChange={e => setForm(p => ({ ...p, maxUsesPerUser: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Applicable To</label>
                <select value={form.applicableType} onChange={e => setForm(p => ({ ...p, applicableType: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold">
                  <option value="ALL">All Items</option>
                  <option value="PRODUCTS">Specific Products</option>
                  <option value="CATEGORIES">Categories</option>
                </select>
              </div>
              {form.applicableType !== 'ALL' && (
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    {form.applicableType === 'PRODUCTS' ? 'Product IDs' : 'Category IDs'}
                  </label>
                  <input value={form.applicableIds} onChange={e => setForm(p => ({ ...p, applicableIds: e.target.value }))}
                    className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" placeholder="Comma-separated IDs" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Starts At</label>
                <input type="datetime-local" value={form.startsAt} onChange={e => setForm(p => ({ ...p, startsAt: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Expires At</label>
                <input type="datetime-local" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 font-bold" />
              </div>
              <div className="flex items-center space-x-4 pt-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input type="checkbox" checked={form.firstOrderOnly} onChange={e => setForm(p => ({ ...p, firstOrderOnly: e.target.checked }))}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                  <span className="font-bold text-gray-600 text-sm">First Order Only</span>
                </label>
              </div>
            </div>
            <div className="flex space-x-4 mt-8">
              <button onClick={() => { setShowForm(false); resetForm(); }}
                className="px-6 py-3 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100">Cancel</button>
              <button onClick={handleSave} disabled={!form.code.trim() || !form.discountValue || createMutation.isPending || updateMutation.isPending}
                className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-60">
                {editing ? 'Update' : 'Create'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading / Error / Empty / Table */}
      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <div className="bg-red-50 rounded-[2.5rem] p-8 text-center">
          <p className="text-red-500 font-bold">Failed to load coupons. Please try again.</p>
          <p className="text-red-400 text-sm mt-2">{error.message}</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] shadow-card p-16 text-center">
          <Tag size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-black text-gray-400 mb-2">No Coupons Found</h3>
          <p className="text-gray-400 font-medium">
            {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Create your first coupon to start offering discounts.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredCoupons.map(coupon => {
                const status = getCouponStatus(coupon);
                return (
                  <motion.div
                    key={coupon.id}
                    layout initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="font-black text-lg text-gray-900">{coupon.code}</span>
                        <p className="text-sm text-gray-500 mt-0.5">{coupon.description || '—'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>{status.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
                      <div><span className="font-semibold">Discount:</span> {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}</div>
                      <div><span className="font-semibold">Usage:</span> {coupon.currentUses || 0}{coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ''}</div>
                      <div><span className="font-semibold">Starts:</span> {formatDate(coupon.startsAt)}</div>
                      <div><span className="font-semibold">Expires:</span> {formatDate(coupon.expiresAt)}</div>
                    </div>
                    <div className="flex items-center space-x-2 pt-2 border-t border-gray-50">
                      <button onClick={() => handleToggle(coupon.id)}
                        className={`p-2 rounded-xl transition-all ${coupon.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                        title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                        {coupon.isActive ? <Power size={16} /> : <PowerOff size={16} />}
                      </button>
                      <button onClick={() => handleEdit(coupon)}
                        className="p-2 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => openDelete(coupon)}
                        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-[2.5rem] shadow-card border border-gray-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Code</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Description</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Discount</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Usage</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Period</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence mode="popLayout">
                    {filteredCoupons.map(coupon => {
                      const status = getCouponStatus(coupon);
                      return (
                        <motion.tr
                          key={coupon.id}
                          layout initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="hover:bg-gray-50/30 transition-colors group"
                        >
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="font-black text-gray-900">{coupon.code}</span>
                          </td>
                          <td className="px-6 py-5 max-w-[200px] truncate">
                            <span className="text-gray-600 font-medium">{coupon.description || '—'}</span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className="font-bold">
                              {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                            </span>
                            {coupon.maxDiscount > 0 && (
                              <span className="text-gray-400 text-sm ml-1">(max ₹{coupon.maxDiscount})</span>
                            )}
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-100 rounded-full h-2 w-24">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses
                                      ? 'bg-red-400'
                                      : 'bg-primary'
                                  }`}
                                  style={{ width: `${coupon.maxUses > 0 ? Math.min((coupon.currentUses || 0) / coupon.maxUses * 100, 100) : 0}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-500">
                                {coupon.currentUses || 0}{coupon.maxUses > 0 ? `/${coupon.maxUses}` : ''}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Calendar size={14} />
                              <span>{formatDate(coupon.startsAt)} — {formatDate(coupon.expiresAt)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              <button onClick={() => handleToggle(coupon.id)}
                                className={`p-2.5 rounded-xl transition-all ${coupon.isActive ? 'text-green-500 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                                title={coupon.isActive ? 'Deactivate' : 'Activate'}>
                                {coupon.isActive ? <Power size={16} /> : <PowerOff size={16} />}
                              </button>
                              <button onClick={() => handleEdit(coupon)}
                                className="p-2.5 rounded-xl text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
                                <Edit2 size={16} />
                              </button>
                              <button onClick={() => openDelete(coupon)}
                                className="p-2.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsDeleteModalOpen(false); setDeleteError(''); }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm relative z-10 p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Coupon?</h3>
              <p className="text-gray-500 font-medium mb-2">
                This will permanently delete <span className="font-bold text-gray-700">{deleteTarget?.code}</span>.
              </p>
              <p className="text-gray-400 text-sm mb-8">This action cannot be undone.</p>
              {deleteError ? (
                <p className="text-sm text-red-500 font-medium mb-4">{deleteError}</p>
              ) : null}
              <div className="flex flex-col space-y-3">
                <button
                  disabled={deleteMutation.isPending}
                  onClick={handleConfirmDelete}
                  className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deleteMutation.isPending ? <Loader2 className="animate-spin" /> : "Yes, Delete Coupon"}
                </button>
                <button
                  onClick={() => { setIsDeleteModalOpen(false); setDeleteError(''); }}
                  className="w-full py-4 bg-gray-50 text-gray-400 font-bold rounded-2xl hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminCoupons;
