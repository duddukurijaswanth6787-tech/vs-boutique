import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ShieldAlert, ShieldCheck, Download, MapPin, 
  Ruler, History, FileText, ChevronRight, X, Plus, Edit2, 
  Trash2, Award, Calendar, Phone, User, Landmark, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getCustomers, getCustomerProfile, toggleCustomerBlock, 
  exportCustomerData, addCustomerAddress, updateCustomerAddress, 
  deleteCustomerAddress 
} from '@core/services';

const SEGMENT_COLORS = {
  NEW: 'bg-blue-50 text-blue-700 border-blue-100',
  ACTIVE: 'bg-green-50 text-green-700 border-green-100',
  VIP: 'bg-purple-50 text-purple-700 border-purple-100 font-extrabold',
  INACTIVE: 'bg-gray-100 text-gray-600 border-gray-200',
  BLOCKED: 'bg-red-50 text-red-700 border-red-100'
};

const Customers = () => {
  // Directory parameters
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [segment, setSegment] = useState('');
  const [loading, setLoading] = useState(false);

  // Profile Viewer modal
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileTab, setProfileTab] = useState('profile'); // profile, addresses, measurements, orders, review_wishlist

  // Block Modal
  const [blockUser, setBlockUser] = useState(null); // customer object to block/unblock
  const [blockReason, setBlockReason] = useState('');
  const [submittingBlock, setSubmittingBlock] = useState(false);

  // Address forms
  const [editingAddress, setEditingAddress] = useState(null); // address object to edit
  const [addressForm, setAddressForm] = useState({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Fetch customer list
  const fetchCustomersList = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(status && { status }),
        ...(segment && { segment })
      };
      const res = await getCustomers(params);
      if (res?.success) {
        setCustomers(res.data || []);
        setTotal(res.total || 0);
        setPages(res.pages || 1);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomersList();
  }, [page, status, segment]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomersList();
  };

  // Fetch full profile details
  const handleOpenProfile = async (id) => {
    setSelectedCustomerId(id);
    setProfileLoading(true);
    setProfileTab('profile');
    try {
      const res = await getCustomerProfile(id);
      if (res?.success) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle block/unblock
  const handleToggleBlockSubmit = async () => {
    if (!blockUser) return;
    setSubmittingBlock(true);
    try {
      const newStatus = blockUser.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
      const res = await toggleCustomerBlock(blockUser.id, newStatus, blockReason || 'Manual status override by administrator');
      if (res?.success) {
        setBlockUser(null);
        setBlockReason('');
        fetchCustomersList();
        // If profile details is open for this customer, refresh it
        if (selectedCustomerId === blockUser.id) {
          handleOpenProfile(blockUser.id);
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setSubmittingBlock(false);
    }
  };

  // Handle Export Data
  const handleExportData = async (customer) => {
    try {
      const res = await exportCustomerData(customer.id);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `customer_${customer.phone}_export.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Error exporting customer:', err);
    }
  };

  // Address actions
  const handleOpenAddressAdd = () => {
    setEditingAddress(null);
    setAddressForm({
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    });
    setShowAddressForm(true);
  };

  const handleOpenAddressEdit = (address) => {
    setEditingAddress(address);
    setAddressForm({
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault
    });
    setShowAddressForm(true);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setAddressLoading(true);
    try {
      if (editingAddress) {
        // Since the backend route updates by addressId, we'll hit PUT /admin/customers/:id/addresses/:addressId
        // The API service updateCustomerAddress signature is (id, addressId, addressData)
        await updateCustomerAddress(selectedCustomerId, editingAddress.id, addressForm);
      } else {
        await addCustomerAddress(selectedCustomerId, addressForm);
      }
      setShowAddressForm(false);
      // Refresh profile to pull fresh address list
      const res = await getCustomerProfile(selectedCustomerId);
      if (res?.success) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error('Error managing address:', err);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleAddressDelete = async (addressId) => {
    if (!selectedCustomerId || !window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await deleteCustomerAddress(selectedCustomerId, addressId);
      // Refresh profile
      const res = await getCustomerProfile(selectedCustomerId);
      if (res?.success) {
        setProfile(res.data);
      }
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-gray-900">Customer Management</h2>
          <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
            Track user segments, block unauthorized profiles, and manage delivery addresses.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-card border border-gray-50">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input
              id="search-input"
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
              <Filter size={16} className="text-gray-500" />
              <select
                id="segment-filter"
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="bg-transparent text-sm text-gray-600 focus:outline-none font-bold"
              >
                <option value="">All Segments</option>
                <option value="NEW">New</option>
                <option value="ACTIVE">Active</option>
                <option value="VIP">VIP</option>
                <option value="INACTIVE">Inactive</option>
                <option value="BLOCKED">Blocked</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
              <ShieldAlert size={16} className="text-gray-500" />
              <select
                id="status-filter"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-transparent text-sm text-gray-600 focus:outline-none font-bold"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="BLOCKED">Blocked Only</option>
              </select>
            </div>

            <button
              id="search-button"
              type="submit"
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-all shadow-md shadow-primary/10 ml-auto lg:ml-0"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Segment</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Total Spent</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Orders</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Registered At</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">
                    Loading customer directory...
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary font-bold">
                          {c.name ? c.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{c.name || 'New User'}</p>
                          <p className="text-xs font-medium text-gray-400 mt-0.5">{c.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        c.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${SEGMENT_COLORS[c.segment] || 'bg-gray-50'}`}>
                        {c.segment}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-gray-900">
                      ₹{Number(c.totalSpent || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-500">
                      {c.ordersCount || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenProfile(c.id)}
                          className="px-3 py-1.5 bg-gray-50 hover:bg-primary hover:text-white text-gray-600 font-bold rounded-lg text-xs transition-all"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => setBlockUser(c)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            c.status === 'BLOCKED' 
                              ? 'border-green-100 bg-green-50 hover:bg-green-100 text-green-700' 
                              : 'border-red-100 bg-red-50 hover:bg-red-100 text-red-700'
                          }`}
                          title={c.status === 'BLOCKED' ? 'Unblock Customer' : 'Block Customer'}
                        >
                          {c.status === 'BLOCKED' ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                        </button>
                        <button
                          onClick={() => handleExportData(c)}
                          className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
                          title="Export Data"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Showing Page {page} of {pages} ({total} Users)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-lg disabled:opacity-50 transition-all"
              >
                Previous
              </button>
              <button
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
                className="px-3.5 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs rounded-lg disabled:opacity-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Block / Unblock Modal */}
      <AnimatePresence>
        {blockUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-6 border border-gray-50"
            >
              <h3 className="text-lg font-black text-gray-900 mb-2">
                {blockUser.status === 'BLOCKED' ? 'Unblock Customer Account' : 'Block Customer Account'}
              </h3>
              <p className="text-sm text-gray-400 font-medium mb-4">
                {blockUser.status === 'BLOCKED' 
                  ? `Are you sure you want to restore access for ${blockUser.name || 'this customer'} (${blockUser.phone})?` 
                  : `Are you sure you want to suspend access for ${blockUser.name || 'this customer'} (${blockUser.phone})? This will restrict them from placing orders.`}
              </p>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Reason for action</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Provide a descriptive reason for auditing logs..."
                  rows={3}
                  className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                />
              </div>

              <div className="flex space-x-3 justify-end">
                <button
                  onClick={() => { setBlockUser(null); setBlockReason(''); }}
                  className="px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-gray-600 font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleToggleBlockSubmit}
                  disabled={submittingBlock}
                  className={`px-5 py-2 font-bold text-sm text-white rounded-xl shadow-md transition-all ${
                    blockUser.status === 'BLOCKED' 
                      ? 'bg-green-600 hover:bg-green-700 shadow-green-600/10' 
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/10'
                  }`}
                >
                  {submittingBlock ? 'Processing...' : blockUser.status === 'BLOCKED' ? 'Confirm Unblock' : 'Confirm Block'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Details Modal/Drawer */}
      <AnimatePresence>
        {selectedCustomerId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-gray-50 flex flex-col relative"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-lg">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900">{profile?.name || 'Customer Profile'}</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">{profile?.phone}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedCustomerId(null); setProfile(null); }}
                  className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {profileLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-400 font-bold">Loading profile details...</p>
                </div>
              ) : profile ? (
                <>
                  {/* Tabs Selector */}
                  <div className="flex border-b border-gray-50 bg-gray-50/50 px-4">
                    {[
                      { id: 'profile', label: 'Overview', icon: User },
                      { id: 'addresses', label: 'Addresses', icon: MapPin },
                      { id: 'measurements', label: 'Measurements', icon: Ruler },
                      { id: 'orders', label: 'Order History', icon: History },
                      { id: 'extra', label: 'Wishlist & Reviews', icon: Award }
                    ].map((t) => {
                      const Icon = t.icon;
                      const isActive = profileTab === t.id;
                      return (
                        <button
                          key={t.id}
                          onClick={() => setProfileTab(t.id)}
                          className={`flex items-center space-x-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                            isActive 
                              ? 'border-primary text-primary' 
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Icon size={14} />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Drawer Content */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    {profileTab === 'profile' && (
                      <div className="space-y-6">
                        {/* Spending Widgets */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100/50">
                            <Landmark size={20} className="text-gray-400 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Spent</p>
                            <p className="text-lg font-black text-gray-900 mt-1">₹{Number(profile.stats.totalSpent || 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100/50">
                            <History size={20} className="text-gray-400 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</p>
                            <p className="text-lg font-black text-gray-900 mt-1">{profile.stats.ordersCount || 0}</p>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-xl text-center border border-gray-100/50">
                            <Landmark size={20} className="text-gray-400 mx-auto mb-1.5" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Average Order</p>
                            <p className="text-lg font-black text-gray-900 mt-1">₹{Number(profile.stats.averageOrderValue || 0).toLocaleString('en-IN')}</p>
                          </div>
                        </div>

                        {/* Profile Info Details */}
                        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4">
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Profile Information</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Name</p>
                              <p className="font-bold text-gray-800 mt-1">{profile.name || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Connection</p>
                              <p className="font-bold text-gray-800 mt-1">{profile.phone}</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer Segment</p>
                              <p className="mt-1">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-lg text-xs font-bold border ${SEGMENT_COLORS[profile.segment]}`}>
                                  {profile.segment}
                                </span>
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Registered</p>
                              <p className="font-semibold text-gray-500 mt-1">
                                {new Date(profile.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Mock Customer Timeline */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Activity History Timeline</h4>
                          <div className="relative border-l border-gray-100 pl-6 ml-3 space-y-6">
                            <div className="relative">
                              <div className="absolute -left-9 top-0.5 bg-primary w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                                <Calendar size={10} className="text-white" />
                              </div>
                              <p className="text-sm font-bold text-gray-900">Registration Complete</p>
                              <p className="text-xs text-gray-400 mt-0.5">Joined VS Boutique marketplace platform.</p>
                              <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase">
                                {new Date(profile.createdAt).toLocaleDateString()}
                              </p>
                            </div>

                            {profile.orders.map((o, idx) => (
                              <div key={o.id} className="relative">
                                <div className="absolute -left-9 top-0.5 bg-blue-500 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm">
                                  <History size={10} className="text-white" />
                                </div>
                                <p className="text-sm font-bold text-gray-900">Custom Order Placed - {o.orderId}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  Purchased customized design at {o.boutique}. Pricing: ₹{o.price}. Status: <span className="font-bold uppercase text-primary">{o.orderStatus}</span>
                                </p>
                                <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase">
                                  {new Date(o.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {profileTab === 'addresses' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Registered Shipping Addresses</h4>
                          <button
                            onClick={handleOpenAddressAdd}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all"
                          >
                            <Plus size={12} />
                            <span>Add Address</span>
                          </button>
                        </div>

                        {showAddressForm && (
                          <motion.form
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleAddressSubmit}
                            className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-4"
                          >
                            <h5 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                              {editingAddress ? 'Modify Address Data' : 'Add New Shipping Destination'}
                            </h5>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Address Line 1</label>
                                <input
                                  type="text"
                                  required
                                  value={addressForm.addressLine1}
                                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                                  placeholder="House No, Suite, Apartment complex..."
                                  className="w-full p-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Address Line 2 (Optional)</label>
                                <input
                                  type="text"
                                  value={addressForm.addressLine2}
                                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                                  placeholder="Road, Area, Landmark..."
                                  className="w-full p-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">City</label>
                                  <input
                                    type="text"
                                    required
                                    value={addressForm.city}
                                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                                    placeholder="City"
                                    className="w-full p-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">State</label>
                                  <input
                                    type="text"
                                    required
                                    value={addressForm.state}
                                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                                    placeholder="State"
                                    className="w-full p-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Pincode</label>
                                  <input
                                    type="text"
                                    required
                                    value={addressForm.pincode}
                                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                                    placeholder="6 digit PIN"
                                    className="w-full p-2.5 bg-white border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="isDefault"
                                  checked={addressForm.isDefault}
                                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="isDefault" className="text-xs font-bold text-gray-500 uppercase tracking-wider">Set as default shipping address</label>
                              </div>
                            </div>
                            <div className="flex space-x-2 justify-end pt-2">
                              <button
                                type="button"
                                onClick={() => setShowAddressForm(false)}
                                className="px-3.5 py-1.5 bg-white border border-gray-100 hover:bg-gray-100 rounded-lg text-xs font-bold text-gray-500 transition-all"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={addressLoading}
                                className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-primary/10"
                              >
                                {addressLoading ? 'Saving...' : 'Save Address'}
                              </button>
                            </div>
                          </motion.form>
                        )}

                        <div className="space-y-3">
                          {profile.addresses.length > 0 ? (
                            profile.addresses.map((a) => (
                              <div key={a.id} className="border border-gray-100 p-4 rounded-xl flex justify-between items-start group">
                                <div className="flex items-start space-x-3">
                                  <MapPin size={18} className="text-gray-400 mt-1" />
                                  <div>
                                    <p className="font-semibold text-gray-800 text-sm">
                                      {a.addressLine1}
                                      {a.addressLine2 && `, ${a.addressLine2}`}
                                    </p>
                                    <p className="text-xs text-gray-400 font-medium mt-1">
                                      {a.city}, {a.state} - {a.pincode}
                                    </p>
                                    {a.isDefault && (
                                      <span className="inline-flex px-2 py-0.5 bg-primary/5 text-primary text-[10px] font-black rounded-lg mt-2 uppercase tracking-wide border border-primary/10">
                                        Default Shipping
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleOpenAddressEdit(a)}
                                    className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
                                  >
                                    <Edit2 size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleAddressDelete(a.id)}
                                    className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-md transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 border border-dashed border-gray-100 rounded-xl text-gray-400 text-sm font-semibold">
                              No addresses saved for this customer.
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {profileTab === 'measurements' && (
                      <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider border-b border-gray-50 pb-2">Digital Sizing Profile</h4>
                        {profile.measurement ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {[
                                { label: 'Chest Size', value: profile.measurement.chest },
                                { label: 'Waist Size', value: profile.measurement.waist },
                                { label: 'Shoulder Width', value: profile.measurement.shoulder },
                                { label: 'Sleeve Length', value: profile.measurement.sleeveLength },
                                { label: 'Neck Circumference', value: profile.measurement.neck },
                                { label: 'Garment Length', value: profile.measurement.length }
                              ].map((m, idx) => (
                                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100/50">
                                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{m.label}</p>
                                  <p className="text-xl font-black text-gray-800 mt-1">{m.value ? `${Number(m.value)}"` : 'N/A'}</p>
                                </div>
                              ))}
                            </div>

                            {profile.measurement.notes && (
                              <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 mt-2">
                                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Tailor Specific Notes</p>
                                <p className="text-sm font-medium text-amber-700">{profile.measurement.notes}</p>
                              </div>
                            )}

                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">
                              Last updated: {new Date(profile.measurement.updatedAt).toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-12 border border-dashed border-gray-100 rounded-xl text-gray-400">
                            <Ruler size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-bold">No digital measurement data registered yet.</p>
                            <p className="text-xs mt-1">Measurements are saved when the customer places custom config orders.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {profileTab === 'orders' && (
                      <div className="space-y-6">
                        <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Purchase History</h4>
                        {profile.orders.length > 0 ? (
                          <div className="space-y-3">
                            {profile.orders.map((o) => (
                              <div key={o.id} className="border border-gray-100 p-4 rounded-xl flex items-center justify-between hover:bg-gray-50/30 transition-colors">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-black text-gray-900 text-sm">{o.orderId}</span>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-extrabold uppercase">{o.category}</span>
                                  </div>
                                  <p className="text-xs text-gray-400 font-semibold">{o.boutique}</p>
                                  <p className="text-[10px] text-gray-400 font-medium">Placed on {new Date(o.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-black text-gray-900 text-sm">₹{Number(o.price).toLocaleString('en-IN')}</p>
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase mt-1.5 ${
                                    o.orderStatus === 'delivered' ? 'bg-green-50 text-green-700' :
                                    o.orderStatus === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                  }`}>
                                    {o.orderStatus}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 border border-dashed border-gray-100 rounded-xl text-gray-400">
                            <History size={32} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-sm font-bold">No purchase transactions found.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {profileTab === 'extra' && (
                      <div className="space-y-6">
                        <div className="border border-amber-100 bg-amber-50/50 p-5 rounded-2xl flex items-start space-x-3">
                          <HelpCircle className="text-amber-600 mt-0.5" size={18} />
                          <div>
                            <h4 className="font-bold text-amber-800 text-sm">Phase 2 Module Lock</h4>
                            <p className="text-xs text-amber-700/80 font-medium mt-1 leading-relaxed">
                              Reviews, Ratings Moderation, and Wishlists Analytics tables are initialized in the schema, but logic handles remain locked until the current customer profiles and address books are verified and approved.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="border border-gray-100 p-5 rounded-2xl text-center bg-gray-50/50 opacity-60">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Customer Reviews</p>
                            <p className="text-xl font-black text-gray-800 mt-2">Locked</p>
                            <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase">Pending Review Module</p>
                          </div>
                          <div className="border border-gray-100 p-5 rounded-2xl text-center bg-gray-50/50 opacity-60">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Saved Designs</p>
                            <p className="text-xl font-black text-gray-800 mt-2">Locked</p>
                            <p className="text-[10px] font-semibold text-gray-400 mt-1 uppercase">Pending Wishlist Module</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Customers;
