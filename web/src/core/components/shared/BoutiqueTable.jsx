import React, { memo } from 'react';
import { Trash2, Edit2, Star, MapPin, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const logoHttps = (item) => {
  const u = item.media?.logo || item.logo;
  return typeof u === 'string' && u.startsWith('https://') ? u : null;
};

const LogoThumb = ({ item, className }) => {
  const url = logoHttps(item);
  if (url) {
    return <img src={url} alt={item.name} loading="lazy" className={className} />;
  }
  const initials = (item.name || '?').slice(0, 2).toUpperCase();
  return (
    <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-500 text-[10px] font-black tracking-tight`}>
      {initials}
    </div>
  );
};

const BoutiqueTable = memo(({ boutiques, onDelete, onEdit }) => {
  const navigate = useNavigate();

  return (
    <>
      {/* ── MOBILE: Card List (hidden on md+) ── */}
      <div className="md:hidden space-y-3">
        <AnimatePresence mode="popLayout">
          {boutiques.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => navigate(`/boutiques/${item.id}`)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-start space-x-4 cursor-pointer active:scale-[0.98] transition-transform"
            >
              {/* Logo */}
              <LogoThumb
                item={item}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0 shadow-sm"
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-gray-900 truncate">{item.name}</p>
                    <div className="flex items-center space-x-1 text-gray-400 mt-0.5">
                      <MapPin size={12} />
                      <span className="text-xs font-semibold truncate">{item.city || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex items-center bg-amber-50 px-2 py-1 rounded-xl flex-shrink-0">
                    <Star size={12} className="text-amber-500 fill-current mr-1" />
                    <span className="text-xs font-black text-amber-600">{item.rating || '4.5'}</span>
                  </div>
                </div>

                {/* Tags */}
                {item.servicesOffered?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.servicesOffered.slice(0, 2).map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-wider"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center space-x-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onEdit(item)}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-gray-50 text-gray-500 hover:text-primary hover:bg-primary/5 rounded-xl border border-gray-100 transition-all text-xs font-bold min-h-[40px]"
                  >
                    <Edit2 size={14} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="flex-1 flex items-center justify-center space-x-1.5 py-2 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-xl border border-red-100 transition-all text-xs font-bold min-h-[40px]"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── DESKTOP: Table (hidden on mobile) ── */}
      <div className="hidden md:block bg-white rounded-[2.5rem] shadow-card border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Store Entity</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Zone</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Reputation</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Market Tags</th>
                <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence mode="popLayout">
                {boutiques.map((item) => (
                  <motion.tr
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => navigate(`/boutiques/${item.id}`)}
                    className="hover:bg-gray-50/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-6 whitespace-nowrap min-w-[300px]">
                      <div className="flex items-center space-x-5">
                        <div className="relative flex-shrink-0">
                          <LogoThumb
                            item={item}
                            className="w-16 h-16 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-lg shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink size={12} className="text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-bold text-gray-900 group-hover:text-primary transition-colors truncate">{item.name}</div>
                          <div className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-wider">{item.experienceYears || 'Elite Partner'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center text-sm font-semibold text-gray-600">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mr-3 text-blue-500">
                          <MapPin size={16} />
                        </div>
                        {item.city || 'N/A'}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center text-sm font-black text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl w-fit">
                        <Star size={14} className="mr-1.5 fill-current" />
                        {item.rating || '4.5'}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-wrap gap-2">
                        {item.servicesOffered?.slice(0, 2).map((tag, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-xl bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-wider group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                          className="p-3 bg-white text-gray-400 hover:text-primary hover:shadow-md rounded-2xl border border-gray-100 transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                          className="p-3 bg-white text-gray-400 hover:text-red-500 hover:shadow-md rounded-2xl border border-gray-100 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
});

BoutiqueTable.displayName = 'BoutiqueTable';
export default BoutiqueTable;
