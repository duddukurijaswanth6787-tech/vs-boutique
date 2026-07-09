import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  getAdminTickets, 
  getTicketById, 
  getTicketMessages, 
  createTicketMessage, 
  getTicketNotes, 
  createTicketNote, 
  assignTicket, 
  updateTicketStatusText,
  getTicketAnalytics,
  getBoutiques
} from '@core/services';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Send, 
  Search, 
  Paperclip, 
  FileText, 
  UserPlus, 
  Activity, 
  ShieldAlert, 
  Play, 
  X,
  Plus,
  RefreshCw,
  ClockAlert,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminTickets = () => {
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  
  // Input states
  const [replyText, setReplyText] = useState('');
  const [adminNoteText, setAdminNoteText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // 1. Fetch Analytics
  const { data: analyticsRes, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['ticketAnalytics'],
    queryFn: getTicketAnalytics
  });
  const stats = analyticsRes?.success ? analyticsRes.data : null;

  // 2. Fetch Tickets list
  const { data: ticketsRes, isLoading: isTicketsLoading } = useQuery({
    queryKey: ['adminTickets', statusFilter, priorityFilter, riskFilter],
    queryFn: () => getAdminTickets({ 
      status: statusFilter || undefined, 
      priority: priorityFilter || undefined,
      riskLevel: riskFilter || undefined
    })
  });
  const tickets = ticketsRes || [];

  // 3. Fetch Selected Ticket details
  const { data: ticket } = useQuery({
    queryKey: ['ticketDetails', selectedTicketId],
    queryFn: () => getTicketById(selectedTicketId),
    enabled: !!selectedTicketId
  });

  // 4. Fetch Selected Ticket messages
  const { data: messages = [] } = useQuery({
    queryKey: ['ticketMessages', selectedTicketId],
    queryFn: () => getTicketMessages(selectedTicketId),
    enabled: !!selectedTicketId,
    refetchInterval: 5000 // Poll every 5 seconds for new chat messages
  });

  // 5. Fetch Selected Ticket admin notes
  const { data: notes = [] } = useQuery({
    queryKey: ['ticketNotes', selectedTicketId],
    queryFn: () => getTicketNotes(selectedTicketId),
    enabled: !!selectedTicketId && isNotesOpen
  });

  // Fetch Boutiques / Admin list to assign
  const [admins, setAdmins] = useState([
    { id: 'admin-1', ownerName: 'Admin Sarah' },
    { id: 'admin-2', ownerName: 'Admin Mike' }
  ]);

  // Mutations
  const backendUrl = window.VITE_API_URL || import.meta.env.VITE_API_URL || '';

  const replyTicketMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${backendUrl}/tickets/${selectedTicketId}/reply`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    onSuccess: () => {
      setReplyText('');
      setAttachmentUrl('');
      queryClient.invalidateQueries(['ticketMessages', selectedTicketId]);
      queryClient.invalidateQueries(['ticketDetails', selectedTicketId]);
      queryClient.invalidateQueries(['adminTickets']);
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => createTicketMessage(selectedTicketId, data),
    onSuccess: () => {
      setReplyText('');
      setAttachmentUrl('');
      queryClient.invalidateQueries(['ticketMessages', selectedTicketId]);
    }
  });

  const sendNoteMutation = useMutation({
    mutationFn: (data) => createTicketNote(selectedTicketId, data),
    onSuccess: () => {
      setAdminNoteText('');
      queryClient.invalidateQueries(['ticketNotes', selectedTicketId]);
    }
  });

  const assignAdminMutation = useMutation({
    mutationFn: (assignedAdminId) => assignTicket(selectedTicketId, assignedAdminId),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticketDetails', selectedTicketId]);
      queryClient.invalidateQueries(['adminTickets']);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => updateTicketStatusText(selectedTicketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticketDetails', selectedTicketId]);
      queryClient.invalidateQueries(['adminTickets']);
      queryClient.invalidateQueries(['ticketAnalytics']);
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    replyTicketMutation.mutate({
      reply: replyText,
      status: ticket?.status || 'RESOLVED'
    });
  };

  const handleSendNote = (e) => {
    e.preventDefault();
    if (!adminNoteText.trim()) return;

    sendNoteMutation.mutate({
      note: adminNoteText
    });
  };

  return (
    <div className="space-y-8">
      
      {/* Page Title */}
      <div>
        <h2 className="text-xl md:text-3xl font-black text-gray-900">Support Ticket Workspace</h2>
        <p className="text-gray-500 mt-1 font-medium text-sm md:text-base">
          Track customer issues, resolve SLA requests, verify refund fraud risk indices, and chat live.
        </p>
      </div>

      {/* Analytics widgets */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Tickets</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-gray-900">{stats.openTickets + stats.inProgressTickets}</span>
              <span className="text-xs text-gray-400 font-bold">Open/In Progress</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resolution Rate</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-green-600">{stats.resolutionRate}%</span>
              <span className="text-xs text-gray-400 font-bold">({stats.resolvedTickets} Resolved)</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Resolution Time</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-gray-900">{stats.avgResolutionHours}h</span>
              <span className="text-xs text-gray-400 font-bold">per ticket</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">SLA Breached</span>
            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-red-600">{stats.slaBreaches}</span>
              <span className="text-xs text-gray-400 font-bold">tickets breached</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace split panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Ticket List column */}
        <div className="xl:col-span-1 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-premium flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
            <h3 className="text-base font-black text-gray-900">Tickets Inbox</h3>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-black uppercase">
                {tickets.length} Total
              </span>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600 focus:outline-none"
            >
              <option value="">Status</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600 focus:outline-none"
            >
              <option value="">Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-600 focus:outline-none"
            >
              <option value="">Risk</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          {/* Tickets Scroll View */}
          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
            {isTicketsLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : tickets.length > 0 ? (
              tickets.map((t) => {
                const isSelected = t.id === selectedTicketId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm shadow-primary/5'
                        : 'border-gray-50 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.ticketType}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        t.priority === 'CRITICAL' ? 'bg-red-100 text-red-700 animate-pulse' :
                        t.priority === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                        t.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-gray-900 text-xs mt-2 truncate">{t.subject}</h4>
                    <p className="text-[9px] text-gray-400 font-bold mt-0.5">{t.ticketNumber || 'TKT-General'} | By: {t.user?.name || t.name || 'Guest'}</p>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{t.description}</p>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <span className="text-[9px] font-bold text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                      
                      <div className="flex items-center space-x-1.5">
                        {t.riskLevel === 'HIGH' && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-[8px] font-black tracking-wide border border-red-100">
                            HIGH RISK
                          </span>
                        )}
                        {t.slaBreached && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded text-[8px] font-black tracking-wide border border-rose-100">
                            SLA BREACH
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                          t.status === 'OPEN' ? 'bg-red-50 text-red-500' :
                          t.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
                          'bg-green-50 text-green-600'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center font-bold text-gray-400 py-20 italic">No tickets found.</p>
            )}
          </div>
        </div>

        {/* Chat Console Panel */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-premium flex flex-col h-[700px] overflow-hidden">
          {ticket ? (
            <>
              {/* Ticket Details Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-black text-gray-900 text-base">{ticket.subject}</h3>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                      ticket.status === 'OPEN' ? 'bg-red-50 text-red-500' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 font-bold">
                    User: {ticket.user?.name || ticket.name || 'Guest'} ({ticket.user?.phone || ticket.phone || 'N/A'}) {ticket.email ? `| ${ticket.email}` : ''} | Boutique: {ticket.boutique?.name || 'Platform'}
                  </p>
                </div>

                {/* Workflow Actions */}
                <div className="flex items-center space-x-2">
                  {/* Status update */}
                  <select
                    value={ticket.status}
                    onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                    className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black uppercase focus:outline-none"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>

                  {/* Note Toggle */}
                  <button
                    onClick={() => setIsNotesOpen(!isNotesOpen)}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                      isNotesOpen ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    Notes ({notes.length})
                  </button>
                </div>
              </div>

              {/* Central split chat feed vs note drawer */}
              <div className="flex-1 flex min-h-0 overflow-hidden relative">
                
                {/* Chat Bubble List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/20">
                  
                  {/* Ticket Description as first bubble */}
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-50 rounded-2xl p-4 max-w-lg shadow-sm text-left">
                      <p className="text-xs font-black text-primary uppercase tracking-wide">Ticket Details</p>
                      <p className="text-xs text-gray-600 mt-2 font-medium leading-relaxed">{ticket.description}</p>
                      
                      {ticket.attachmentUrl && (
                        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center space-x-2">
                          <Paperclip size={14} className="text-primary" />
                          <a href={ticket.attachmentUrl} target="_blank" rel="noreferrer" className="text-[10px] font-black text-primary hover:underline uppercase tracking-wider">
                            View Attachment ({ticket.attachmentType || 'File'})
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Chat messages */}
                  {messages.map((m) => {
                    const isAdmin = m.senderType === 'ADMIN';
                    const isBoutique = m.senderType === 'BOUTIQUE';
                    
                    return (
                      <div 
                        key={m.id} 
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`rounded-2xl p-4 max-w-lg shadow-sm text-left ${
                          isAdmin 
                            ? 'bg-primary text-white' 
                            : isBoutique 
                              ? 'bg-green-50 border border-green-100 text-green-800' 
                              : 'bg-white border border-gray-50 text-gray-800'
                        }`}>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">
                            {m.senderName} ({m.senderType})
                          </p>
                          <p className="text-xs mt-1.5 font-medium leading-relaxed">{m.message}</p>
                          
                          {m.attachmentUrl && (
                            <div className="mt-2 pt-2 border-t border-white/10 flex items-center space-x-1.5">
                              <Paperclip size={12} />
                              <a href={m.attachmentUrl} target="_blank" rel="noreferrer" className="text-[9px] font-black uppercase hover:underline">
                                View File ({m.attachmentType || 'Attachment'})
                              </a>
                            </div>
                          )}

                          <span className="block text-[8px] mt-2 opacity-50 text-right">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sliding Admin Notes Drawer */}
                <AnimatePresence>
                  {isNotesOpen && (
                    <motion.div
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      className="absolute inset-y-0 right-0 w-80 bg-white border-l border-gray-100 p-6 flex flex-col justify-between shadow-2xl z-10"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-gray-50 pb-4 mb-4">
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Internal Notes</h4>
                          <button onClick={() => setIsNotesOpen(false)} className="text-gray-400 hover:text-gray-900">
                            <X size={16} />
                          </button>
                        </div>

                        {/* Notes scroll */}
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                          {notes.map(n => (
                            <div key={n.id} className="p-3 bg-gray-50 rounded-xl text-left border border-gray-100">
                              <p className="text-[10px] text-gray-400 font-bold">
                                Admin | {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-gray-600 font-medium mt-1 leading-relaxed">
                                {n.note}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add note form */}
                      <form onSubmit={handleSendNote} className="mt-4 pt-4 border-t border-gray-50">
                        <textarea
                          placeholder="Add admin note..."
                          value={adminNoteText}
                          onChange={(e) => setAdminNoteText(e.target.value)}
                          className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-xs font-semibold text-gray-700 min-h-[80px]"
                        />
                        <button
                          type="submit"
                          className="w-full mt-2 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-black transition-colors"
                        >
                          Save Note
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Chat composer box */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Type message..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-xs font-semibold text-gray-700"
                  />
                  
                  {/* Mock file attachment selector */}
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter mock attachment image/pdf URL:');
                      if (url) setAttachmentUrl(url);
                    }}
                    className={`p-3 rounded-xl border transition-all ${
                      attachmentUrl ? 'bg-primary/5 text-primary border-primary/20' : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-900'
                    }`}
                    title="Attach mock file"
                  >
                    <Paperclip size={16} />
                  </button>

                  <button
                    type="submit"
                    className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all flex items-center justify-center shadow-lg shadow-primary/20"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-40">
              <MessageSquare size={48} className="mb-4 text-gray-300" />
              <h4 className="font-extrabold text-sm uppercase tracking-wider">No Ticket Selected</h4>
              <p className="text-xs text-gray-400 mt-1 font-semibold">Select a ticket from the inbox to open chat.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTickets;
