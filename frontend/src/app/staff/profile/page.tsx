'use client';

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUpdateStaff } from '@/features/staff/staff.hooks';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { User, Mail, Phone, Home, Star, Save } from 'lucide-react';

export default function StaffProfilePage() {
  const { user } = useAuth();
  const updateMut = useUpdateStaff();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    phone: '',
  });

  const handleSave = async () => {
    if (!user?.id) return;
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('First and last name are required');
      return;
    }
    try {
      await updateMut.mutateAsync({ id: user.id, dto: formData });
      toast.success('Profile updated');
      setIsEditing(false);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My Profile</h1>
        <p className="text-xs text-neutral-500 mt-0.5">View and manage your account details</p>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-neutral-400" />
          </div>
          <div className="flex-1 space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full mt-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full mt-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 rounded-lg border border-neutral-200 px-3 py-2 text-xs focus:border-neutral-950 focus:outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={updateMut.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-[#7A1C30] hover:bg-[#641424] text-white text-xs font-bold rounded-xl disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> {updateMut.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">{user?.firstName} {user?.lastName ?? ''}</h2>
                  <p className="text-xs text-neutral-400">{user?.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Mail className="w-4 h-4" /> {user?.email ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Home className="w-4 h-4" /> {(user as any)?.department ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Star className="w-4 h-4" /> {(user as any)?.designation ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500">
                    <User className="w-4 h-4" /> {user?.userType ?? '—'}
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-neutral-200 text-neutral-700 text-xs font-bold rounded-xl hover:bg-neutral-50"
                >
                  Edit Profile
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Roles & Permissions */}
      <div className="bg-white rounded-2xl border border-neutral-200/60 shadow-sm p-6">
        <h3 className="text-sm font-bold text-neutral-900 mb-4">Roles & Permissions</h3>
        <div className="flex flex-wrap gap-2">
          {(user?.roles ?? []).map((role: string) => (
            <span key={role} className="px-3 py-1 rounded-lg bg-neutral-50 border border-neutral-200 text-[10px] font-bold text-neutral-700 uppercase">
              {role}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
