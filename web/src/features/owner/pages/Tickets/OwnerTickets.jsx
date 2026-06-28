import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getOwnerTickets, 
  getTicketById, 
  getTicketMessages, 
  createTicketMessage,
  updateTicketStatusText
} from '@core/services';
import OwnerLayout from '../../../../components/OwnerLayout';
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  Send, 
  Paperclip, 
  ChevronRight, 
  AlertCircle 
} from 'lucide-react';

const OwnerTickets = () => {
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // 1. Fetch Owner Tickets
  const { data: tickets = [], isLoading: isTicketsLoading } = useQuery({
    queryKey: ['ownerTickets'],
    queryFn: getOwnerTickets
  });

  // 2. Fetch Selected Ticket details
  const { data: ticket } = useQuery({
    queryKey: ['ticketDetails', selectedTicketId],
    queryFn: () => getTicketById(selectedTicketId),
    enabled: !!selectedTicketId
  });

  // 3. Fetch Selected Ticket messages
  const { data: messages = [] } = useQuery({
    queryKey: ['ticketMessages', selectedTicketId],
    queryFn: () => getTicketMessages(selectedTicketId),
    enabled: !!selectedTicketId,
    refetchInterval: 5000 // Poll every 5s
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data) => createTicketMessage(selectedTicketId, data),
    onSuccess: () => {
      setReplyText('');
      setAttachmentUrl('');
      queryClient.invalidateQueries(['ticketMessages', selectedTicketId]);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => updateTicketStatusText(selectedTicketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['ticketDetails', selectedTicketId]);
      queryClient.invalidateQueries(['ownerTickets']);
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!replyText.trim() && !attachmentUrl.trim()) return;

    sendMessageMutation.mutate({
      senderType: 'BOUTIQUE',
      senderId: 'owner-mock', // Mock owner id
      senderName: 'Boutique Manager',
      message: replyText,
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentUrl ? 'image' : null
    });
  };

  return (
    <OwnerLayout title="Support Tickets">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Ticket List column */}
        <div className="xl:col-span-1 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col h-[650px]">
          <div className="pb-4 border-b border-gray-50 mb-4 flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900">Boutique Tickets</h3>
            <span className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase">
              {tickets.length} Total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {isTicketsLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-gray-900 text-xs mt-2 truncate">{t.subject}</h4>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{t.description}</p>
                    
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <span className="text-[9px] font-bold text-gray-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                        t.status === 'OPEN' ? 'bg-red-50 text-red-500' :
                        t.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
                        'bg-green-50 text-green-600'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center font-bold text-gray-400 py-20 italic">No tickets assigned to your boutique.</p>
            )}
          </div>
        </div>

        {/* Chat Console column */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {ticket ? (
            <>
              {/* Header */}
              <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                <div className="text-left">
                  <h3 className="font-black text-gray-900 text-sm flex items-center space-x-2">
                    <span>{ticket.subject}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${
                      ticket.status === 'OPEN' ? 'bg-red-50 text-red-500' :
                      ticket.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600' :
                      'bg-green-50 text-green-600'
                    }`}>
                      {ticket.status}
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 font-bold uppercase tracking-wider">
                    Customer: {ticket.user?.name} | Order ID: {ticket.order?.orderId || 'General Enquiry'}
                  </p>
                </div>

                {/* Workflow select */}
                <select
                  value={ticket.status}
                  onChange={(e) => updateStatusMutation.mutate(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black uppercase focus:outline-none"
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              {/* Chat Feed */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gray-50/10">
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

                {messages.map((m) => {
                  const isBoutique = m.senderType === 'BOUTIQUE';
                  const isAdmin = m.senderType === 'ADMIN';

                  return (
                    <div 
                      key={m.id} 
                      className={`flex ${isBoutique ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`rounded-2xl p-4 max-w-lg shadow-sm text-left ${
                        isBoutique 
                          ? 'bg-primary text-white' 
                          : isAdmin
                            ? 'bg-gray-100 text-gray-800'
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
                              View File
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

              {/* Composer */}
              <div className="p-6 border-t border-gray-100 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="text"
                    placeholder="Reply to customer..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 pl-4 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none text-xs font-semibold text-gray-700"
                  />
                  
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter mock attachment URL:');
                      if (url) setAttachmentUrl(url);
                    }}
                    className={`p-3 rounded-xl border transition-all ${
                      attachmentUrl ? 'bg-primary/5 text-primary border-primary/20' : 'bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-900'
                    }`}
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
              <p className="text-xs text-gray-400 mt-1 font-semibold">Select a ticket from the list to view chat history.</p>
            </div>
          )}
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerTickets;
