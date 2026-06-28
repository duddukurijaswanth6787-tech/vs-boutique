import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Clock, User, Tag, ChevronRight, Search, Filter, Loader2, ArrowRight } from 'lucide-react';
import { api } from '@core/services';

const ActivityLogs = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('All');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await api.get('/dashboard/audit-logs');
                setLogs(response.data);
                setFilteredLogs(response.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    useEffect(() => {
        let result = logs;
        if (searchTerm) {
            result = result.filter(log => 
                log.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.actionType.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (actionFilter !== 'All') {
            result = result.filter(log => log.actionType.includes(actionFilter));
        }
        setFilteredLogs(result);
    }, [searchTerm, actionFilter, logs]);

    const getActionColor = (action) => {
        if (action.includes('DELETE')) return 'bg-red-50 text-red-600';
        if (action.includes('CREATE') || action.includes('INVITE')) return 'bg-green-50 text-green-600';
        if (action.includes('UPDATE')) return 'bg-amber-50 text-amber-600';
        return 'bg-blue-50 text-blue-600';
    };

    const renderChanges = (changes) => {
        if (!changes || (!changes.before && !changes.after)) return <span className="text-gray-400 italic">No detailed changes tracked</span>;
        
        return (
            <div className="space-y-1">
                {Object.keys(changes.after || {}).map(key => (
                    <div key={key} className="flex items-center space-x-2 text-[10px] font-bold">
                        <span className="text-gray-400 uppercase tracking-widest">{key}:</span>
                        <span className="text-red-400 line-through">{JSON.stringify(changes.before?.[key])}</span>
                        <ArrowRight size={10} className="text-gray-300" />
                        <span className="text-green-500">{JSON.stringify(changes.after?.[key])}</span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Audit Logs & History</h2>
                    <p className="text-gray-500 font-medium mt-1">Enterprise-level activity tracking for full system transparency.</p>
                </div>
                <div className="flex items-center space-x-2 text-xs font-black text-gray-400 uppercase bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
                   <Clock size={14} /> <span>{logs.length} Actions Recorded</span>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-6">
                    <div className="flex-1 min-w-[300px] relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            placeholder="Search by Entity ID or Action..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/10 transition-all" 
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <select 
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="px-6 py-4 bg-gray-50 border-none rounded-2xl text-xs font-black uppercase tracking-widest text-gray-500 focus:ring-2 focus:ring-primary/10"
                        >
                            <option>All</option>
                            <option>CREATE</option>
                            <option>UPDATE</option>
                            <option>DELETE</option>
                            <option>STATUS</option>
                        </select>
                        <button className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Action Type</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Performed By</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Entity</th>
                                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Changes (Diff)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredLogs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-gray-900">{new Date(log.timestamp).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${getActionColor(log.actionType)}`}>
                                            {log.actionType.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-xs font-black uppercase shadow-sm">
                                                {log.performedBy?.ownerName?.charAt(0) || 'A'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-gray-900">{log.performedBy?.ownerName || 'System Admin'}</span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">IP: {log.ipAddress || 'Internal'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Tag size={12} className="text-primary" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{log.entityType}</span>
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-400 font-bold mt-1">ID: {log.entityId}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {renderChanges(log.changes || log.metadata)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredLogs.length === 0 && (
                    <div className="text-center py-20 bg-gray-50/50">
                        <Clock size={48} className="text-gray-200 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-gray-900 mb-1">No Activity Found</h3>
                        <p className="text-gray-400 font-medium italic">Try adjusting your filters or search terms.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityLogs;
