import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Trash2, Edit3, Star, Loader2, ChevronLeft } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { useAddress } from '@core/contexts';
import AddressFormModal from '@core/components/shared/AddressFormModal';
import { useCustomerAuth } from '@core/contexts';
import OtpModal from '@core/components/shared/OtpModal';
import EmptyState from '@core/components/ui/EmptyState';

const CustomerAddresses = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const { addresses, loading, saving, addAddress, editAddress, removeAddress, makeDefault } = useAddress();
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formKey, setFormKey] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showOtp, setShowOtp] = useState(false);

  if (!isAuthenticated) return (
    <CustomerLayout>
      <EmptyState
        title="Saved Addresses"
        description="Sign in to view and manage your shipping addresses"
        actionLabel="Sign In"
        onAction={() => setShowOtp(true)}
        icon={MapPin}
      />
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );

  const handleSave = async (data) => {
    if (editTarget) {
      await editAddress(editTarget.id, data);
    } else {
      await addAddress(data);
    }
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleDelete = async (id) => {
    await removeAddress(id);
    setConfirmDelete(null);
  };

  const openEdit = (addr) => {
    setEditTarget(addr);
    setFormKey(k => k + 1);
    setFormOpen(true);
  };

  const openAdd = () => {
    setEditTarget(null);
    setFormKey(k => k + 1);
    setFormOpen(true);
  };

  if (loading) return (
    <CustomerLayout>
      <div className="px-4 pt-4 space-y-4">
        <div className="flex items-center space-x-3 mb-6">
          <button onClick={() => navigate('/customer/profile')} className="p-2 -ml-2"><ChevronLeft size={20} className="text-gray-600" /></button>
          <h1 className="text-xl font-bold text-gray-900">Saved Addresses</h1>
        </div>
        {[1,2].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
      </div>
    </CustomerLayout>
  );

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center space-x-3 mb-6">
          <button onClick={() => navigate('/customer/profile')} className="p-2 -ml-2"><ChevronLeft size={20} className="text-gray-600" /></button>
          <h1 className="text-xl font-bold text-gray-900">Saved Addresses</h1>
          <span className="text-sm text-gray-400">({addresses.length})</span>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={28} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No saved addresses</h3>
            <p className="text-sm text-gray-400 mb-6">Add a delivery address for faster checkout</p>
            <button onClick={openAdd} className="px-8 py-3.5 bg-primary text-white rounded-2xl text-sm font-semibold shadow-lg shadow-primary/20">
              Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map(a => (
              <div key={a.id} className="bg-white rounded-2xl p-4 border border-gray-50 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.fullName}</p>
                      {a.isDefault && (
                        <span className="flex items-center space-x-0.5 text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          <Star size={8} className="fill-amber-500" /> <span>Default</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                    <p className="text-xs text-gray-500">{a.city}, {a.state} - {a.pincode}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{a.phone}</p>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <button onClick={() => openEdit(a)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors" title="Edit">
                      <Edit3 size={14} className="text-gray-400 hover:text-primary" />
                    </button>
                    <button onClick={() => setConfirmDelete(a)} className="p-2 hover:bg-red-50 rounded-xl transition-colors" title="Delete">
                      <Trash2 size={14} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
                {!a.isDefault && (
                  <button onClick={() => makeDefault(a.id)} disabled={saving}
                    className="mt-3 text-xs font-semibold text-primary flex items-center space-x-1 hover:underline disabled:opacity-50">
                    <Star size={12} /> <span>Set as Default</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {addresses.length > 0 && (
          <button onClick={openAdd}
            className="w-full mt-4 py-3.5 border-2 border-dashed border-gray-200 rounded-2xl text-sm font-semibold text-gray-400 flex items-center justify-center space-x-2 hover:border-primary/30 hover:text-primary transition-all">
            <Plus size={18} /> <span>Add New Address</span>
          </button>
        )}
      </div>

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Address?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete the address at {confirmDelete.addressLine1}, {confirmDelete.city}?
            </p>
            <div className="flex space-x-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)} disabled={saving}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center">
                {saving ? <Loader2 className="animate-spin" size={18} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddressFormModal
        key={`${editTarget?.id || 'new'}-${formKey}`}
        visible={formOpen}
        onClose={() => { setFormOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        address={editTarget}
        saving={saving}
      />
    </CustomerLayout>
  );
};

export default CustomerAddresses;
