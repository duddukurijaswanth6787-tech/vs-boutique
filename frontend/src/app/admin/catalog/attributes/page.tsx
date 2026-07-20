'use client';

import React, { useState } from 'react';
import { 
  useAttributes, 
  useCreateAttribute, 
  useUpdateAttribute, 
  useDeleteAttribute,
  useAttributeGroups,
  useCreateAttributeGroup,
  useCreateAttributeOption,
  useAttributeOptions
} from '@/features/catalog/attributes/attribute.hooks';
import { AttributeType } from '@/features/catalog/products/product.types';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { toast } from 'sonner';
import { 
  Plus, 
  Layers, 
  Trash2, 
  Info,
  Palette,
  Ruler,
  Hash,
  Grid,
  Scale,
  Pencil,
  Compass,
  Star,
  LayoutGrid,
  List,
  MoreVertical,
  GripVertical,
  CheckCircle2,
  PauseCircle,
  HelpCircle
} from 'lucide-react';

interface AttributeValueRow {
  id: string;
  value: string;
  color: string;
  isDefault: boolean;
}

export default function AttributesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('super_admin');

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Main UI Mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Derive create mode directly from the URL to avoid sync setState in an effect
  const isCreating = searchParams.get('create') === 'true';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [inputTypeFilter, setInputTypeFilter] = useState('All');

  // Form states - Create Attribute
  const [attrName, setAttrName] = useState('');
  const [attrCode, setAttrCode] = useState('');
  const [attrDesc, setAttrDesc] = useState('');
  const [attrType, setAttrType] = useState('Select attribute type');
  const [attrInputType, setAttrInputType] = useState('Select input type');
  const [addValuesMode, setAddValuesMode] = useState<'manual' | 'later'>('manual');
  const [displayType, setDisplayType] = useState('Select display type');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Manual Value creation list
  const [valuesList, setValuesList] = useState<AttributeValueRow[]>([]);

  const resetForm = () => {
    setAttrName('');
    setAttrCode('');
    setAttrDesc('');
    setAttrType('Select attribute type');
    setAttrInputType('Select input type');
    setAddValuesMode('manual');
    setDisplayType('Select display type');
    setSortOrder(0);
    setIsActive(true);
    setValuesList([]);
  };

  // Queries
  const { data: attributesData, isLoading: loadingAttrs, refetch: refetchAttrs } = useAttributes({ limit: 100 });
  const createAttrMut = useCreateAttribute();
  const createOptionMut = useCreateAttributeOption();
  const deleteAttrMut = useDeleteAttribute();

  // Render color icon container
  const renderAttributeIcon = (iconName: string) => {
    switch (iconName) {
      case 'color':
        return (
          <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Palette className="w-4 h-4" />
          </div>
        );
      case 'size':
        return (
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Ruler className="w-4 h-4" />
          </div>
        );
      case 'material':
        return (
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <Hash className="w-4 h-4" />
          </div>
        );
      case 'pattern':
        return (
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Grid className="w-4 h-4" />
          </div>
        );
      case 'weight':
        return (
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
        );
      case 'length':
        return (
          <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <Pencil className="w-4 h-4" />
          </div>
        );
      case 'occasion':
        return (
          <div className="w-8 h-8 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </div>
        );
      case 'neck-type':
        return (
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Star className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        );
    }
  };

  // Move manual values up/down (Grip handles logic)
  const moveValueItem = (index: number, direction: 'up' | 'down') => {
    const list = [...valuesList];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target >= 0 && target < list.length) {
      const [moved] = list.splice(index, 1);
      list.splice(target, 0, moved);
      setValuesList(list);
    }
  };

  // Add new row to value list
  const addValueRow = () => {
    const newId = (valuesList.length + 1).toString();
    setValuesList([
      ...valuesList,
      { id: newId, value: '', color: '#CCCCCC', isDefault: false }
    ]);
  };

  // Save new attribute
  const handleSaveAttribute = async () => {
    if (!attrName.trim() || !attrCode.trim()) {
      toast.error('Please fill out all required fields.');
      return;
    }

    try {
      // 1. Create attribute via backend API
      const createdAttr = await createAttrMut.mutateAsync({
        groupId: '', // ponytail: no group assignment UI yet, empty string sent
        name: attrName,
        slug: attrCode.toLowerCase().replace(' ', '-'),
        type: AttributeType.TEXT,
        isVariant: attrInputType === 'Dropdown' || attrInputType === 'Color Swatch',
        isFilterable: true
      });

      // 2. Loop and create options if manual values mode is active
      if (addValuesMode === 'manual' && createdAttr.id) {
        for (const row of valuesList) {
          if (row.value.trim()) {
            await createOptionMut.mutateAsync({
              attributeId: createdAttr.id,
              value: row.value.toLowerCase().replace(' ', '-'),
              label: row.value
            });
          }
        }
      }

      refetchAttrs();
      
      router.push(pathname);
    } catch (err) {
      console.error(err);
      toast.error('Failed to save attribute');
      router.push(pathname);
    }
  };

  const attrList = attributesData?.data ?? [];

  // Filter dynamic lists
  const filteredAttributes = attrList.filter((attr) => {
    const matchesSearch = attr.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          attr.slug.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && attr.status === 'ACTIVE') ||
                          (statusFilter === 'Inactive' && attr.status === 'INACTIVE');
                          
    const matchesType = typeFilter === 'All' || attr.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate Stat Cards metrics
  const totalCount = attrList.length;
  const activeCount = attrList.filter(a => a.status === 'ACTIVE').length;
  const inactiveCount = totalCount - activeCount;
  const withValuesCount = attrList.filter(a => (a.options?.length ?? 0) > 0).length;

  if (isCreating) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Catalog</span>
            <span>/</span>
            <span>Attributes</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">Add Attribute</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">Add New Attribute</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Create a new attribute to define product characteristics.</p>
        </div>

        {/* Add Attribute Creation Columns */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Left card forms */}
          <div className="flex-1 w-full space-y-6 min-w-0">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Attribute Name *</label>
                  <input
                    type="text"
                    value={attrName}
                    onChange={(e) => setAttrName(e.target.value)}
                    placeholder="Enter attribute name"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 font-medium">Example: Color, Size, Material</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Attribute Code (Unique) *</label>
                  <input
                    type="text"
                    value={attrCode}
                    onChange={(e) => setAttrCode(e.target.value)}
                    placeholder="Enter attribute code"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 font-medium">Example: color, size, material (lowercase, no spaces)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Description (Optional)</label>
                <textarea
                  value={attrDesc}
                  onChange={(e) => setAttrDesc(e.target.value)}
                  placeholder="Enter attribute description"
                  rows={3}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none focus:border-[#7A1C30]"
                />
                <span className="text-[10px] text-neutral-400 mt-1 font-medium">Help your team understand this attribute better.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Type *</label>
                  <select
                    value={attrType}
                    onChange={(e) => setAttrType(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                  >
                    <option>Select attribute type</option>
                    <option value="Visual">Visual</option>
                    <option value="Text">Text</option>
                    <option value="Number">Number</option>
                  </select>
                  <span className="text-[10px] text-neutral-400 mt-1 font-medium">Choose how this attribute will be displayed</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Input Type *</label>
                  <select
                    value={attrInputType}
                    onChange={(e) => setAttrInputType(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                  >
                    <option>Select input type</option>
                    <option value="Color Swatch">Color Swatch</option>
                    <option value="Dropdown">Dropdown</option>
                    <option value="Text Field">Text Field</option>
                    <option value="Multi Select">Multi Select</option>
                  </select>
                  <span className="text-[10px] text-neutral-400 mt-1 font-medium">Choose how values will be entered</span>
                </div>
              </div>
            </div>

            {/* Attribute Values reorderer */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">Attribute Values</h2>
              
              <div className="space-y-3">
                <label className="block text-xs font-bold text-neutral-400 uppercase">Add Values *</label>
                <div className="flex gap-6 items-center">
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 cursor-pointer">
                    <input
                      type="radio"
                      checked={addValuesMode === 'manual'}
                      onChange={() => setAddValuesMode('manual')}
                      className="text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4"
                    />
                    Add values manually
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-neutral-800 cursor-pointer">
                    <input
                      type="radio"
                      checked={addValuesMode === 'later'}
                      onChange={() => setAddValuesMode('later')}
                      className="text-[#7A1C30] focus:ring-[#7A1C30] w-4 h-4"
                    />
                    Add values later
                  </label>
                </div>
              </div>

              {addValuesMode === 'manual' && (
                <div className="space-y-3 mt-4">
                  {valuesList.map((row, idx) => (
                    <div key={row.id} className="flex items-center gap-3 bg-neutral-50/50 p-2 border border-neutral-200/60 rounded-xl hover:bg-neutral-50 transition-colors">
                      {/* Drag handles (mocked with arrow reorder controls) */}
                      <div className="flex items-center gap-1 shrink-0 text-neutral-400">
                        <GripVertical className="w-4 h-4 cursor-grab" />
                        <div className="flex flex-col">
                          <button type="button" onClick={() => moveValueItem(idx, 'up')} className="text-[10px] hover:text-neutral-700">▲</button>
                          <button type="button" onClick={() => moveValueItem(idx, 'down')} className="text-[10px] hover:text-neutral-700">▼</button>
                        </div>
                      </div>

                      {/* Value Input */}
                      <input
                        type="text"
                        value={row.value}
                        onChange={(e) => {
                          const updated = [...valuesList];
                          updated[idx].value = e.target.value;
                          setValuesList(updated);
                        }}
                        placeholder="e.g. Red"
                        className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-900 focus:outline-none"
                      />

                      {/* Swatch color picker */}
                      <div className="flex items-center gap-2 border border-neutral-200 bg-white px-2.5 py-1.5 rounded-lg shrink-0">
                        <input
                          type="color"
                          value={row.color}
                          onChange={(e) => {
                            const updated = [...valuesList];
                            updated[idx].color = e.target.value;
                            setValuesList(updated);
                          }}
                          className="w-5 h-5 rounded cursor-pointer border-none bg-transparent"
                        />
                        <span className="text-[10px] font-bold text-neutral-500 font-mono uppercase">{row.color}</span>
                      </div>

                      {/* Default value selector */}
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700 shrink-0 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.isDefault}
                          onChange={() => {
                            const updated = valuesList.map((v, i) => ({
                              ...v,
                              isDefault: i === idx
                            }));
                            setValuesList(updated);
                          }}
                          className="rounded border-neutral-300 text-[#7A1C30] focus:ring-[#7A1C30] w-3.5 h-3.5"
                        />
                        Default
                      </label>

                      {/* Delete option */}
                      <button
                        type="button"
                        onClick={() => setValuesList(valuesList.filter(item => item.id !== row.id))}
                        className="p-1.5 border border-red-100 hover:bg-red-50 text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={addValueRow}
                    className="flex items-center gap-1.5 px-4 py-2 border border-dashed border-[#7A1C30] hover:bg-red-50/20 text-[#7A1C30] text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Value
                  </button>
                  <div className="text-[10px] text-neutral-400 font-medium">Drag and drop to reorder values</div>
                </div>
              )}
            </div>

            {/* Display & Settings */}
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-neutral-900 border-b border-neutral-100 pb-3">Display & Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Display Type</label>
                  <select
                    value={displayType}
                    onChange={(e) => setDisplayType(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                  >
                    <option>Select display type</option>
                    <option value="Dropdown">Dropdown List</option>
                    <option value="Swatch">Visual Swatches</option>
                    <option value="Radio">Radio Buttons</option>
                  </select>
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">How this attribute will be shown to users</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-xs text-neutral-900 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Lower numbers appear first</span>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-neutral-400 uppercase mb-2">Status</span>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                      <span className="ml-2 text-xs font-bold text-neutral-800">Active</span>
                    </label>
                  </div>
                  <span className="text-[10px] text-neutral-400 mt-1 block font-medium">Inactive attributes won&apos;t be available</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions footer */}
            <div className="flex justify-between items-center mt-6 border-t border-neutral-100 pt-6">
              <button
                type="button"
                onClick={() => router.push(pathname)}
                className="px-5 py-2.5 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleSaveAttribute}
                className="px-6 py-2.5 bg-[#7A1C30] hover:bg-[#641424] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Save & Continue →
              </button>
            </div>
          </div>

          {/* Right Sidebar widgets */}
          <div className="w-full lg:w-80 shrink-0 space-y-6">
            {/* Attribute Preview Card */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wider">Attribute Preview</h3>
              
              <div className="border border-neutral-200/60 rounded-xl p-4 bg-neutral-50/50 space-y-3">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">{attrName || 'COLOR'}</span>
                
                {addValuesMode === 'manual' && valuesList.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {valuesList.map((item, idx) => (
                      <div
                        key={item.id}
                        className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shadow-sm relative group
                          ${item.isDefault ? 'border-[#7A1C30]' : 'border-neutral-200'}
                        `}
                        style={{ backgroundColor: item.color }}
                        title={item.value || 'Untitled Color'}
                      >
                        {item.isDefault && (
                          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#7A1C30] text-white rounded-full flex items-center justify-center font-bold text-[6px]">✓</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400 italic">Values list is empty. Add values manually to view swatches.</span>
                )}

                <p className="text-[10px] text-neutral-400 font-medium">This is how the attribute will appear on the product page.</p>
              </div>
            </div>

            {/* Attribute Summary Card */}
            <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 border-b border-neutral-100 pb-2 uppercase tracking-wider">Attribute Summary</h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Name</span>
                  <span className="text-neutral-800 font-bold">{attrName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Code</span>
                  <span className="text-neutral-800 font-bold font-mono">{attrCode || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Type</span>
                  <span className="text-neutral-800 font-bold">{attrType || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Input Type</span>
                  <span className="text-neutral-800 font-bold">{attrInputType || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Values</span>
                  <span className="text-neutral-800 font-bold">{addValuesMode === 'manual' ? valuesList.length : '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-400 font-semibold">Status</span>
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                    ${isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}
                  `}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400 font-semibold">Sort Order</span>
                  <span className="text-neutral-800 font-bold">{sortOrder}</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-3 shadow-sm">
              <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1">
                <HelpCircle className="w-4 h-4 text-blue-600" /> Tips
              </h3>
              
              <ul className="space-y-2 text-[10px] text-neutral-500 font-medium list-disc pl-4 leading-normal">
                <li>Use short and clear names for attributes.</li>
                <li>Choose the right input type for better user experience.</li>
                <li>Set default value for the most popular option.</li>
                <li>You can add or edit values anytime after creating.</li>
                <li>Inactive attributes will be hidden from products.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-neutral-200/60 shadow-sm">
        <div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
            <span>Catalog</span>
            <span>/</span>
            <span className="text-[#8B5A6B]">Attributes</span>
          </div>
          <h1 className="text-xl font-bold text-neutral-900 font-sans tracking-tight">Attributes</h1>
          <p className="text-xs text-neutral-400 mt-0.5">Manage product attributes like Color, Size, Material, etc.</p>
        </div>
        
        <button
          onClick={() => {
            resetForm();
            router.push(`${pathname}?create=true`);
          }}
          className="bg-[#7A1C30] hover:bg-[#641424] text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Attribute
        </button>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Total Attributes</span>
            <span className="text-2xl font-bold text-neutral-900">{totalCount}</span>
            <span className="text-[10px] text-green-600 font-bold block">+3 this month</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Active */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Active Attributes</span>
            <span className="text-2xl font-bold text-neutral-900">{activeCount}</span>
            <span className="text-[10px] text-green-600 font-bold block">{((activeCount / totalCount) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Inactive */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Inactive Attributes</span>
            <span className="text-2xl font-bold text-neutral-900">{inactiveCount}</span>
            <span className="text-[10px] text-amber-600 font-bold block">{((inactiveCount / totalCount) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
            <PauseCircle className="w-5 h-5" />
          </div>
        </div>

        {/* With Values */}
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Attributes with Values</span>
            <span className="text-2xl font-bold text-neutral-900">{withValuesCount}</span>
            <span className="text-[10px] text-indigo-600 font-bold block">{((withValuesCount / totalCount) * 100).toFixed(1)}% of total</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-4 rounded-2xl border border-neutral-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search attributes by name..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl pl-4 pr-10 py-2 text-xs text-neutral-900 focus:outline-none"
            />
            <span className="absolute right-3.5 top-2.5 text-[10px] text-neutral-400 font-bold">Ctrl + K</span>
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="All">Status: All</option>
            <option value="Active">Status: Active</option>
            <option value="Inactive">Status: Inactive</option>
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="All">Type: All</option>
            <option value="Visual">Type: Visual</option>
            <option value="Text">Type: Text</option>
          </select>

          {/* Input Type filter */}
          <select
            value={inputTypeFilter}
            onChange={(e) => setInputTypeFilter(e.target.value)}
            className="bg-white border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="All">Input Type: All</option>
            <option value="Color Swatch">Color Swatch</option>
            <option value="Dropdown">Dropdown</option>
            <option value="Text Field">Text Field</option>
            <option value="Multi Select">Multi Select</option>
          </select>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2.5">
          <div className="flex border border-neutral-200 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#7A1C30]/10 text-[#7A1C30]' : 'text-neutral-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#7A1C30]/10 text-[#7A1C30]' : 'text-neutral-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main attributes list table */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden p-6 space-y-4">
        {loadingAttrs ? (
          <SectionLoader message="Fetching catalog specifications..." />
        ) : (
          <div className="border border-neutral-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold">
                    <th className="p-4">Attribute Name</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Input Type</th>
                    <th className="p-4 text-center">Values</th>
                    <th className="p-4 text-center">Used In Products</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Created On</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {filteredAttributes.map((attr) => (
                    <tr key={attr.id} className="hover:bg-neutral-50/50">

                      {/* Attribute Name & Slug */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-500 flex items-center justify-center">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-neutral-900 block">{attr.name}</span>
                            <span className="text-[10px] text-neutral-400 font-mono block mt-0.5">{attr.slug}</span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-4 font-semibold text-neutral-800">{attr.type}</td>

                      {/* Display Type */}
                      <td className="p-4">
                        <span className="bg-neutral-50 border border-neutral-200/80 text-neutral-600 px-2.5 py-0.5 rounded-lg text-[10px] font-semibold">
                          {attr.type}
                        </span>
                      </td>

                      {/* Values */}
                      <td className="p-4 text-center font-bold text-neutral-600">{attr.options?.length ?? 0}</td>

                      {/* Used in Products */}
                      <td className="p-4 text-center font-bold text-neutral-800">—</td>

                      {/* Status Badges */}
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase
                          ${attr.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-orange-50 text-orange-700 border border-orange-100'}
                        `}>
                          {attr.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Created On */}
                      <td className="p-4 text-neutral-400 font-semibold">{new Date(attr.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>

                      {/* Action rows */}
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (isSuperAdmin && window.confirm(`Delete ${attr.name}?`)) {
                                deleteAttrMut.mutateAsync(attr.id).then(() => refetchAttrs());
                              }
                            }}
                            className="p-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-500 shadow-sm"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAttributes.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-neutral-400">No specifications found matching the filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-neutral-400 font-medium pt-2 border-t border-neutral-100">
          <span>Showing {filteredAttributes.length} of {totalCount} attributes</span>
        </div>
      </div>
    </div>
  );
}
