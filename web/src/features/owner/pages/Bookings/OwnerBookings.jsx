import React, { useState, useEffect } from 'react';
import OwnerLayout from '../../../../components/OwnerLayout';
import { 
  Calendar, Clock, CheckCircle, XCircle, Search, Filter, 
  FileText, Home, Landmark, Video, HelpCircle, AlertCircle, Bell, Plus, UserPlus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getOwnerBookings, updateBookingStatus, rescheduleBooking, 
  assignBooking, updateBookingNotes, triggerReminder 
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

const OwnerBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Manage states
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [notesText, setNotesText] = useState('');
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignedOwnerId, setAssignedOwnerId] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 10,
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { bookingType: typeFilter })
      };
      const res = await getOwnerBookings(params);
      if (res?.success) {
        setBookings(res.data);
        setTotal(res.total);
        setPages(res.pages);
      }
    } catch (err) {
      console.error('Error fetching boutique bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, typeFilter]);

  const handleStatusChange = async (bookingId, newStatus, note = '') => {
    try {
      let orderId = undefined;
      if (newStatus === 'Completed') {
        const orderPrompt = window.prompt('Enter converted Order ID if applicable (leave blank if none):');
        if (orderPrompt) orderId = orderPrompt;
      }
      const res = await updateBookingStatus(bookingId, newStatus, note, orderId);
      if (res?.success) {
        fetchBookings();
        if (selectedBooking && selectedBooking.id === bookingId) {
          setSelectedBooking({ ...selectedBooking, status: newStatus, orderId });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const res = await rescheduleBooking(selectedBooking.id, rescheduleDate, rescheduleTime, 'Rescheduled by boutique owner');
      if (res?.success) {
        setIsRescheduling(false);
        fetchBookings();
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const res = await assignBooking(selectedBooking.id, assignedOwnerId);
      if (res?.success) {
        setIsAssigning(false);
        fetchBookings();
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedBooking) return;
    try {
      const res = await updateBookingNotes(selectedBooking.id, notesText);
      if (res?.success) {
        setSelectedBooking({ ...selectedBooking, notes: notesText });
        alert('Consultation preferences saved successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReminder = async (bookingId) => {
    try {
      const res = await triggerReminder(bookingId);
      if (res?.success) {
        alert('Friendly notification reminder pushed successfully');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <OwnerLayout title="Bookings Console">
      <div className="space-y-6">
        {/* Sub Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <p className="text-gray-500 font-semibold text-sm">
              Manage client appointments, home measurement visits, and final fitting schedules.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="bg-white p-4 rounded-3xl border border-gray-50 shadow-sm flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All Statuses', value: '' },
              { label: 'Pending', value: 'Pending' },
              { label: 'Accepted', value: 'Accepted' },
              { label: 'Rescheduled', value: 'Rescheduled' },
              { label: 'Completed', value: 'Completed' }
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => {
                  setStatusFilter(st.value);
                  setPage(1);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                  statusFilter === st.value
                    ? 'bg-primary text-white border-primary shadow-sm shadow-primary/10'
                    : 'bg-white text-gray-500 border-gray-100 hover:bg-gray-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-xs font-bold">
            <Filter size={14} className="text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-gray-600 focus:outline-none cursor-pointer"
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
        </div>

        {/* Bookings listing table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-50 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-50">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Schedule Slot</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Session Type</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Staff Assigned</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-gray-400 font-bold">
                      Loading appointments list...
                    </td>
                  </tr>
                ) : bookings.length > 0 ? (
                  bookings.map((b) => {
                    const TypeIcon = TYPE_ICONS[b.bookingType] || FileText;
                    return (
                      <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div>
                            <p className="font-extrabold text-gray-900">{b.customerName}</p>
                            <p className="text-xs font-semibold text-gray-400 mt-0.5">{b.customerMobile}</p>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-semibold text-gray-600">
                          {new Date(b.bookingDate).toLocaleDateString()} at {b.bookingTime}
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-50 border border-gray-100 text-gray-600 text-[10px] font-black rounded-lg uppercase tracking-wider">
                            <TypeIcon size={10} className="mr-1" />
                            <span>{b.bookingType.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-gray-500">
                          {b.assignedOwner?.ownerName || <span className="text-gray-300 italic">Unassigned</span>}
                        </td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_BADGES[b.status] || 'bg-gray-50'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setNotesText(b.notes || '');
                              }}
                              className="px-3.5 py-2 bg-primary hover:bg-primary-dark text-white font-extrabold rounded-xl text-xs transition-all shadow-sm"
                            >
                              Manage
                            </button>
                            <button
                              onClick={() => handleReminder(b.id)}
                              className="p-2 bg-gray-50 border border-gray-100 rounded-xl hover:bg-blue-50 hover:text-blue-600 text-gray-400 transition-all"
                              title="Trigger client reminder SMS/Push"
                            >
                              <Bell size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-gray-400 font-bold">
                      No client bookings recorded for your boutique yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Booking Details Drawer */}
        <AnimatePresence>
          {selectedBooking && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex justify-end">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col relative z-50"
              >
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-black text-gray-900">Manage Consultation</h3>
                    <p className="text-xs font-semibold text-gray-400 mt-0.5">Booking ID: {selectedBooking.id}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      setIsRescheduling(false);
                      setIsAssigning(false);
                    }}
                    className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors"
                  >
                    <XCircle size={22} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-sm font-semibold text-gray-600">
                  <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100/50 space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client Contact</h4>
                    <div className="text-xs space-y-2 font-bold text-gray-800">
                      <p>Name: <span className="font-medium text-gray-600">{selectedBooking.customerName}</span></p>
                      <p>Mobile: <span className="font-medium text-gray-600">{selectedBooking.customerMobile}</span></p>
                      {selectedBooking.customerEmail && (
                        <p>Email: <span className="font-medium text-gray-600">{selectedBooking.customerEmail}</span></p>
                      )}
                      <p>Category: <span className="font-medium text-gray-600">{selectedBooking.bookingType.replace('_', ' ')}</span></p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Appointment Status</h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleStatusChange(selectedBooking.id, 'Accepted')}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedBooking.id, 'Rejected')}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedBooking.id, 'Completed')}
                        className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => setIsRescheduling(!isRescheduling)}
                        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => setIsAssigning(!isAssigning)}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                      >
                        Assign Staff
                      </button>
                    </div>
                  </div>

                  {/* Rescheduling Form Panel */}
                  {isRescheduling && (
                    <form onSubmit={handleRescheduleSubmit} className="bg-blue-50 border border-blue-100 p-5 rounded-2xl space-y-3">
                      <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Select New Slot</h5>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="date"
                          required
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="p-2 border border-blue-200 rounded-xl bg-white text-xs"
                        />
                        <input
                          type="text"
                          required
                          placeholder="e.g. 02:00 PM"
                          value={rescheduleTime}
                          onChange={(e) => setRescheduleTime(e.target.value)}
                          className="p-2 border border-blue-200 rounded-xl bg-white text-xs focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black uppercase tracking-wider"
                        >
                          Confirm
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Staff Assignment Panel */}
                  {isAssigning && (
                    <form onSubmit={handleAssignSubmit} className="bg-purple-50 border border-purple-100 p-5 rounded-2xl space-y-3">
                      <h5 className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Assign owner / manager ID</h5>
                      <input
                        type="text"
                        required
                        placeholder="Owner UUID"
                        value={assignedOwnerId}
                        onChange={(e) => setAssignedOwnerId(e.target.value)}
                        className="w-full p-2 border border-purple-200 rounded-xl bg-white text-xs focus:outline-none"
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-black uppercase tracking-wider"
                        >
                          Assign Staff
                        </button>
                      </div>
                    </form>
                  )}

                  {/* tailors internal notes */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Stitching Preference Notes</label>
                    <textarea
                      rows={4}
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add specific fittings request details, neck designs, or sleeve preferences..."
                      className="w-full p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                    />
                    <button
                      onClick={handleSaveNotes}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-primary/10"
                    >
                      Save Preferences
                    </button>
                  </div>

                  {/* Timeline History log */}
                  {selectedBooking.bookingHistories && selectedBooking.bookingHistories.length > 0 && (
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Consultation Log History</h4>
                      <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                        {selectedBooking.bookingHistories.map((h, i) => (
                          <div key={i} className="flex items-start space-x-3 text-xs pl-6 relative">
                            <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-white absolute left-0.5 top-0.5 flex items-center justify-center" />
                            <div>
                              <p className="font-extrabold text-gray-900">{h.status}</p>
                              <p className="text-gray-500 mt-0.5 font-medium">{h.note}</p>
                              <p className="text-[10px] text-gray-400 font-bold mt-0.5">{new Date(h.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </OwnerLayout>
  );
};

export default OwnerBookings;
