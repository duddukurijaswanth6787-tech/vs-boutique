'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useCustomer, useCustomerProfile } from '@/features/customers/customers.hooks';
import { SectionLoader, PageError } from '@/components/feedback/FeedbackStates';
import { formatDateTime } from '@/utils/format';
import { ChevronLeft, User, Mail, Phone, MapPin } from 'lucide-react';

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: customer, isLoading, isError, refetch } = useCustomer(id);
  const { data: profile } = useCustomerProfile(id);

  if (isLoading) return <SectionLoader message="Loading customer details..." />;
  if (isError || !customer) return <PageError title="Customer not found" message="Could not load customer details." retry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/customers" className="text-neutral-500 hover:text-neutral-900 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{customer.firstName} {customer.lastName ?? ''}</h1>
          <p className="text-xs text-neutral-500">Customer since {formatDateTime(customer.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Contact</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-neutral-400" /><span>{customer.email}</span></div>
            {customer.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-neutral-400" /><span>{customer.phone}</span></div>}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-neutral-500 uppercase">Status</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase
            ${customer.accountStatus === 'ACTIVE' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}
          `}>{customer.accountStatus}</span>
        </div>
      </div>

      {profile && (
        <div className="bg-white p-5 rounded-2xl border border-neutral-200/60 shadow-sm">
          <h3 className="text-xs font-bold text-neutral-500 uppercase mb-4">Profile</h3>
          <pre className="text-xs text-neutral-700 whitespace-pre-wrap">{JSON.stringify(profile, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
