import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerLayout from '../../../../components/OwnerLayout';
import { getOwnerBoutique, updateOwnerServices } from '@core/services';
import { Plus, X, Scissors, Briefcase, Save, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { AuthContext } from '@core/contexts';
import AppPreviewMockup from '@core/components/shared/AppPreviewMockup';

const ICON_PREVIEWS = {
    'Bridal Wear': '👑',
    'Custom Blouse': '👚',
    'Lehengas': '✨',
    'Sarees': '🥻',
    'Gowns': '👗',
    'Kids Wear': '👶',
    'Anarkalis': '🌸',
    'Suits': '👔',
    'Pattu Langa Stitching': '🪡',
    'Birthday Frocks': '🎂',
    'New Born Sets': '🍼',
    "Boy's Dhoti Sets": '👦',
    'Salwar Kameez': '👗',
};

const ChipInput = ({ label, items, setItems, placeholder, icon: Icon, disabled, suggestions = [] }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = (val) => {
    const newItem = typeof val === 'string' ? val.trim() : inputValue.trim();
    if (newItem && !items.includes(newItem) && items.length < 20) {
      setItems([...items, newItem]);
      setInputValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const removeChip = (index) => {
    if (disabled) return;
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className={`bg-white p-8 rounded-[3rem] border border-gray-50 shadow-sm space-y-6 ${disabled ? 'opacity-60 grayscale' : ''}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black text-gray-900 flex items-center">
          <Icon className="mr-3 text-primary" size={20} /> {label}
        </h3>
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{items.length}/20 Items</span>
      </div>

      <div className="space-y-4">
        {!disabled && (
            <div className="space-y-3">
                <div className="relative">
                    <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <button 
                        onClick={() => handleAdd()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                
                {suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {suggestions.map(sug => (
                            <button
                                key={sug}
                                onClick={() => handleAdd(sug)}
                                disabled={items.includes(sug)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${items.includes(sug) ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : 'bg-primary/5 text-primary hover:bg-primary/10'}`}
                            >
                                {ICON_PREVIEWS[sug] || ''} {sug} +
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}

        <Reorder.Group 
          axis="y" 
          values={items} 
          onReorder={setItems}
          className="flex flex-wrap gap-3 min-h-[50px] pt-4"
        >
          <AnimatePresence>
            {items.map((item, index) => (
              <Reorder.Item
                key={item}
                value={item}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center bg-gray-900 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest group shadow-md cursor-grab active:cursor-grabbing"
              >
                <span className="mr-2 text-base">{ICON_PREVIEWS[item] || '🏷️'}</span>
                <span>{item}</span>
                {!disabled && (
                    <button 
                        onClick={() => removeChip(index)}
                        className="ml-3 text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
              </Reorder.Item>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <div className="w-full py-4 text-center text-gray-300 font-bold italic text-sm">No items added yet.</div>
          )}
        </Reorder.Group>
      </div>
    </div>
  );
};

const OwnerServices = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [boutique, setBoutique] = useState(null);
  const [services, setServices] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canEdit = user?.permissions?.canEditServices;

  // Hard guard — redirect if permission revoked
  useEffect(() => {
    if (!loading && user && canEdit === false) {
      navigate('/owner/dashboard', { replace: true });
    }
  }, [canEdit, loading, user, navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOwnerBoutique();
        setBoutique(data);
        setServices(data.servicesOffered || []);
        setSpecialties(data.workTypeSpecialty || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOwnerServices({ 
        servicesOffered: services, 
        workTypeSpecialty: specialties 
      });
      alert('Services updated successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <OwnerLayout title="Services"><div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" size={40} /></div></OwnerLayout>;

  return (
    <OwnerLayout title="Services & Specialty">
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Manage Your Expertise</h2>
            <p className="text-sm font-medium text-gray-400 mt-1">Define the services and specialties your boutique is known for.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={saving || !canEdit}
            className="flex items-center space-x-2 px-10 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> <span>Save Changes</span></>}
          </button>
        </div>

        {!canEdit && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center space-x-3 text-amber-700">
                <AlertCircle size={20} />
                <p className="text-xs font-black uppercase tracking-widest">Read-Only Mode: Service management is disabled by Super Admin.</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <ChipInput 
              label="Services Offered" 
              items={services} 
              setItems={setServices} 
              placeholder="e.g., Maggam Work, Alterations..." 
              icon={Scissors}
              disabled={!canEdit}
            />
            <ChipInput
              label="Work Type / Specialty"
              icon={Briefcase}
              items={specialties}
              setItems={setSpecialties}
              placeholder="e.g. Bridal Wear, Custom Blouse..."
              disabled={!canEdit}
              suggestions={Object.keys(ICON_PREVIEWS)}
            />
          </div>
          
          {/* ── RIGHT: Preview Panel ───────────────────────────────── */}
          <div className="lg:col-span-1 lg:sticky lg:top-8 h-fit pb-8">
             <div className="hidden lg:block">
                 <h3 className="text-sm font-black text-gray-900 flex items-center mb-4 uppercase tracking-widest">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
                     Live App Preview
                 </h3>
                 <AppPreviewMockup boutique={boutique} specialties={specialties} />
             </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerServices;
