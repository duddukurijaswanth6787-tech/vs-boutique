import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, Clock, CheckCircle, XCircle, 
  UserPlus, Bell, FileText, ChevronRight, X, ArrowUpRight, 
  MapPin, Video, Home, HelpCircle, AlertCircle, Landmark 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getBookings, getBookingStats, updateBookingStatus, 
  rescheduleBooking, assignBooking, updateBookingNotes, triggerReminder 
} from '@core/services';

const STATUS_BADGES = {
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-100',
  Accepted: 'bg-green-50 text-green-700 border-green-100',
  Rejected: 'bg-red-50 text-red-700 border-red-100',
  Rescheduled: 'bg-blue-50 text-blue-700 border-blue-100',
  Completed: 'bg-gray-50 text-gray-700 border-gray-100'
};

const TYPE_ICONS = {
  HOME_MEASUREMENT: Home,
  STORE_VISIT: Landmark,
  VIDEO_CONSULTATION: Video,
  DESIGN_DISCUSSION: FileText,
  TRIAL_FITTING: HelpCircle,
  FINAL_DELIVERY: CheckCircle
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    convertedOrders: 0,
    conversionRate: 0,
    revenueGenerated: 0,
    averageBookingValue: 0
  });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [bookingType, setBookingType] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [notes, setNotes] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignedOwnerId, setAssignedOwnerId] = useState('');

  const fetchStats = async () => {
    try {
      const res = await getBookingStats();
      if (res?.success) setStats(res.stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookingsList = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(search && { search }),
        ...(status && { status }),
        ...(bookingType && { bookingType })
      };
      const res = await getBookings(params);
      if (res?.success) {
        setBookings(res.data);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchBookingsList();
  }, [page, status, bookingType]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookingsList();
  };

  const handleStatusChange = async (bookingId, newStatus, note = '') => {
    try {
      let orderId = undefined;
      if (newStatus === 'Completed') {
        const orderPrompt = window.prompt('Enter converted Order ID if applicable (leave blank if none):');
        if (orderPrompt) orderId = orderPrompt;
      }
      const res = await updateBookingStatus(bookingId, newStatus, note, orderId);
      if (res?.success) {
        fetchBookingsList();
        fetchStats();
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, status: newStatus, orderId });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const res = await rescheduleBooking(selectedBooking.id, newDate, newTime, 'Rescheduled by administrator');
      if (res?.success) {
        setIsRescheduling(false);
        fetchBookingsList();
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const res = await assignBooking(selectedBooking.id, assignedOwnerId);
      if (res?.success) {
        setIsAssigning(false);
        fetchBookingsList();
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotesUpdate = async () => {
    if (!selectedBooking) return;
    try {
      const res = await updateBookingNotes(selectedBooking.id, notes);
      if (res?.success) {
        setSelectedBooking({ ...selectedBooking, notes });
        alert('Notes updated successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReminder = async (bookingId) => {
    try {
      const res = await triggerReminder(bookingId);
      if (res?.success) {
        alert('Reminder notification sent successfully to client.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl md:text-3xl font-black text-gray-900">Consultation Bookings</h2>
        <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
          Track customer stitch sessions, video appointments, and design previews.
        </p>
      </div>

      {/* Analytics Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Bookings', value: stats.totalBookings, color: 'text-blue-600' },
          { label: 'Converted Orders', value: stats.convertedOrders, color: 'text-green-600' },
          { label: 'Conversion Rate', value: `${stats.conversionRate}%`, color: 'text-purple-600' },
          { label: 'Revenue Generated', value: `₹${Number(stats.revenueGenerated).toLocaleString('en-IN')}`, color: 'text-amber-600' },
          { label: 'Avg Booking Value', value: `₹${Number(stats.averageBookingValue).toLocaleString('en-IN')}`, color: 'text-indigo-600' }
        ].map((s, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-50 shadow-card flex flex-col justify-between">
            <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider">{s.label}</h4>
            <p className={`text-xl font-black mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-card border border-gray-50">
        <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
            <input
              id="search-input"
              type="text"
              placeholder="Search by customer name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
              <Calendar size={16} className="text-gray-500" />
              <select
                id="type-filter"
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value)}
                className="bg-transparent text-sm text-gray-600 focus:outline-none font-bold"
              >
                <option value="">All Categories</option>
                <option value="HOME_MEASUREMENT">Home Measurement</option>
                <option value="STORE_VISIT">Store Visit</option>
                <option value="VIDEO_CONSULTATION">Video Consultation</option>
                <option value="DESIGN_DISCUSSION">Design Discussion</option>
                <option value="TRIAL_FITTING">Trial Fitting</option>
                <option value="FINAL_DELIVERY">Final Delivery</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl">
              <Clock size={16} className="text-gray-500" />
              <select
                id="status-filter"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-transparent text-sm text-gray-600 focus:outline-none font-bold"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Rescheduled">Rescheduled</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <button
              id="search-button"
              type="submit"
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary-dark transition-all shadow-md ml-auto lg:ml-0"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Bookings Directory Table */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Customer Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Boutique</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Schedule Slot</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Conversion Order</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">
                    Loading scheduled sessions...
                  </td>
                </tr>
              ) : bookings.length > 0 ? (
                bookings.map((b) => {
                  const TypeIcon = TYPE_ICONS[b.bookingType] || FileText;
                  return (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900">{b.customerName}</p>
                          <p className="text-xs font-semibold text-gray-400 mt-0.5">{b.customerMobile}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-600">
                        {b.boutique?.name}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{new Date(b.bookingDate).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">{b.bookingTime}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold border border-gray-200">
                          <TypeIcon size={12} className="mr-1" />
                          <span>{b.bookingType.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${STATUS_BADGES[b.status] || 'bg-gray-50'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {b.order ? (
                          <span className="text-green-600 font-extrabold text-sm">Converted ({b.order.orderId})</span>
                        ) : (
                          <span className="text-gray-400 text-xs">Unconverted</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(b);
                              setNotes(b.notes || '');
                            }}
                            className="px-3 py-1.5 bg-gray-50 hover:bg-primary hover:text-white text-gray-600 font-bold rounded-lg text-xs transition-all"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => handleReminder(b.id)}
                            className="p-1.5 bg-gray-50 border border-gray-100 rounded-lg hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-all"
                            title="Send Reminder Notification"
                          >
                            <Bell size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">
                    No scheduled consultation bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Operations Drawer */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="bg-white w-full max-w-lg h-full shadow-2xl border-l border-gray-50 flex flex-col relative"
            >
              <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Manage Consultation</h3>
                  <p className="text-xs font-semibold text-gray-400 mt-0.5">Booking ID: {selectedBooking.id}</p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {/* Customer Contacts details */}
                <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100/50 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Client Credentials</h4>
                  <div className="text-sm font-semibold space-y-2">
                    <p className="text-gray-900">Name: <span className="font-medium text-gray-700">{selectedBooking.customerName}</span></p>
                    <p className="text-gray-900">Mobile: <span className="font-medium text-gray-700">{selectedBooking.customerMobile}</span></p>
                    {selectedBooking.customerEmail && (
                      <p className="text-gray-900">Email: <span className="font-medium text-gray-700">{selectedBooking.customerEmail}</span></p>
                    )}
                    <p className="text-gray-900">Type: <span className="font-medium text-gray-700">{selectedBooking.bookingType.replace('_', ' ')}</span></p>
                  </div>
                </div>

                {/* Status Transitions Controls */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Appointment Controls</h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'Accepted')}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Accept Booking
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'Rejected')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Reject Booking
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedBooking.id, 'Completed')}
                      className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Mark Completed
                    </button>
                    <button
                      onClick={() => setIsRescheduling(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() => setIsAssigning(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all"
                    >
                      Assign Owner
                    </button>
                  </div>
                </div>

                {/* Reschedule Inline Panel */}
                {isRescheduling && (
                  <form onSubmit={handleReschedule} className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-3">
                    <h5 className="text-xs font-black text-blue-800 uppercase tracking-wider">Select Reschedule Slot</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        required
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="p-2 border border-blue-200 rounded bg-white text-sm"
                      />
                      <input
                        type="text"
                        required
                        placeholder="e.g. 02:00 PM"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="p-2 border border-blue-200 rounded bg-white text-sm"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsRescheduling(false)}
                        className="px-3 py-1 bg-white text-gray-500 rounded text-xs font-bold border border-blue-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 bg-blue-600 text-white rounded text-xs font-bold"
                      >
                        Save Slot
                      </button>
                    </div>
                  </form>
                )}

                {/* Staff Assignment Inline Panel */}
                {isAssigning && (
                  <form onSubmit={handleAssign} className="bg-purple-50 border border-purple-100 p-4 rounded-xl space-y-3">
                    <h5 className="text-xs font-black text-purple-800 uppercase tracking-wider">Assign staff member</h5>
                    <input
                      type="text"
                      required
                      placeholder="Enter assigned owner UUID"
                      value={assignedOwnerId}
                      onChange={(e) => setAssignedOwnerId(e.target.value)}
                      className="w-full p-2 border border-purple-200 rounded bg-white text-sm focus:outline-none"
                    />
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAssigning(false)}
                        className="px-3 py-1 bg-white text-gray-500 rounded text-xs font-bold border border-purple-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1 bg-purple-600 text-white rounded text-xs font-bold"
                      >
                        Assign
                      </button>
                    </div>
                  </form>
                )}

                {/* Internal Notes update sheets */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Internal Tailors Notes</label>
                  <textarea
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter internal measurement logs or preferences notes..."
                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                  />
                  <button
                    onClick={handleNotesUpdate}
                    className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-primary/10"
                  >
                    Save Notes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Bookings;
