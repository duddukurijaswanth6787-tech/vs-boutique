'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCampaigns, useCreateCampaign, useSendCampaign } from '@/features/campaigns/campaign.hooks';
import { CampaignResponse } from '@/features/campaigns/campaign.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { Search, Plus, Send, X, Mail, MessageSquare, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatDate } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

// Zod schema
const campaignSchema = z.object({
  name: z.string().min(3, 'Name is too short').max(50),
  description: z.string().max(200).optional(),
  type: z.string().min(2, 'Type is required'),
  channel: z.enum(['EMAIL', 'SMS']),
  subject: z.string().max(100).optional().or(z.literal('')),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  audience: z.string().optional(),
});

type FormValues = z.infer<typeof campaignSchema>;

export default function CampaignsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // URL States
  const pageParam = parseInt(searchParams.get('page') || '1');
  const channel = searchParams.get('channel') || '';

  // Queries
  const { data: listData, isLoading, isError, refetch } = useCampaigns({
    page: pageParam,
    limit: 10,
    channel: channel || undefined,
  });

  const [activeCampaign, setActiveCampaign] = useState<CampaignResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSendOpen, setIsSendOpen] = useState(false);

  const sendMut = useSendCampaign();

  const updateQuery = (key: string, value: string | number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value.toString());
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/admin/promotions/campaigns?${params.toString()}`);
  };

  const handleSendTrigger = (campaign: CampaignResponse) => {
    setActiveCampaign(campaign);
    setIsSendOpen(true);
  };

  const executeSend = async () => {
    if (!activeCampaign) return;
    try {
      await sendMut.mutateAsync(activeCampaign.id);
      setIsSendOpen(false);
      setActiveCampaign(null);
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Marketing Campaigns</h1>
          <p className="text-xs text-neutral-400 mt-1">Design promotional emails or SMS messages, target user groups, and coordinate schedules.</p>
        </div>
        {isEditor && (
          <button
            onClick={() => {
              setActiveCampaign(null);
              setIsDialogOpen(true);
            }}
            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Create Campaign
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-neutral-500 font-sans">Filters:</span>
        </div>
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={channel}
            onChange={(e) => updateQuery('channel', e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 focus:outline-none"
          >
            <option value="">All Channels</option>
            <option value="EMAIL">EMAIL</option>
            <option value="SMS">SMS</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <SectionLoader message="Retrieving marketing campaigns..." />
      ) : isError ? (
        <PageError title="Connection Failure" message="Could not fetch campaigns from server." retry={refetch} />
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Campaign details</th>
                  <th className="p-4">Delivery Channel</th>
                  <th className="p-4">Target Audience</th>
                  <th className="p-4 text-center">Open Rate / Clicks</th>
                  <th className="p-4 text-center">Total Sent</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-700">
                {listData?.data?.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-neutral-900">{c.name}</div>
                      <div className="text-[10px] text-neutral-400 max-w-[200px] truncate">{c.description || 'No description'}</div>
                      {c.subject && <div className="text-[10px] text-neutral-500 italic mt-0.5">Subject: {c.subject}</div>}
                    </td>
                    <td className="p-4 uppercase tracking-wider text-2xs font-semibold text-neutral-600">
                      <span className="inline-flex items-center gap-1">
                        {c.channel === 'EMAIL' ? <Mail className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        {c.channel}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-500 max-w-[150px] truncate">
                      {c.audience ? (typeof c.audience === 'object' ? JSON.stringify(c.audience) : String(c.audience)) : 'All Customers'}
                    </td>
                    <td className="p-4 text-center font-mono text-neutral-700">
                      <span className="font-bold">{c.openCount}</span> / <span className="font-semibold text-neutral-500">{c.clickCount}</span>
                    </td>
                    <td className="p-4 text-center font-bold font-mono text-neutral-900">{c.sentCount}</td>
                    <td className="p-4">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                        ${c.status === 'SENT' ? 'bg-green-50 text-green-700 border border-green-100' : c.status === 'SCHEDULED' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-neutral-100 text-neutral-500'}
                      `}>
                        {c.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        {isEditor && c.status === 'DRAFT' && (
                          <button
                            onClick={() => handleSendTrigger(c)}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-1.5 px-3 rounded-lg text-2xs flex items-center gap-1 shadow-sm transition"
                            title="Send Campaign Now"
                          >
                            <Send className="w-3 h-3" /> Send
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!listData?.data || listData.data.length === 0) && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-400 font-medium">
                      No marketing campaigns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {listData?.meta && listData.meta.totalPages > 1 && (
            <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex justify-between items-center">
              <span className="text-xs text-neutral-500 font-medium">
                Page {listData.meta.page} of {listData.meta.totalPages} (Total: {listData.meta.total})
              </span>
              <div className="flex gap-2">
                <button
                  disabled={!listData.meta.hasPrevious}
                  onClick={() => updateQuery('page', pageParam - 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg bg-white text-xs font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={!listData.meta.hasNext}
                  onClick={() => updateQuery('page', pageParam + 1)}
                  className="px-3 py-1.5 border border-neutral-200 rounded-lg bg-white text-xs font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isDialogOpen && (
        <CampaignDialog
          onClose={() => setIsDialogOpen(false)}
          onSuccess={() => refetch()}
        />
      )}

      {/* Confirmation Send Dialog */}
      {isSendOpen && activeCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 text-amber-700">
                <AlertTriangle className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">Transmit Campaign Message?</h3>
                <p className="text-xs text-neutral-400 mt-1">You are sending campaign &quot;{activeCampaign.name}&quot; via {activeCampaign.channel}. This cannot be undone.</p>
                <p className="text-[10px] text-amber-600 bg-amber-50/50 p-2 border border-amber-100 rounded mt-2 leading-relaxed">
                  <strong>Notice:</strong> Developing logs mode is enabled. Messages are simulated in local BullMQ queue workers. Real email delivery is disabled.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5 pt-3 border-t border-neutral-100">
              <button
                onClick={() => setIsSendOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition"
              >
                Cancel
              </button>
              <button
                disabled={sendMut.isPending}
                onClick={executeSend}
                className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition flex items-center"
              >
                {sendMut.isPending && <ButtonLoader />} Confirm and Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Creation Dialog
function CampaignDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const createMut = useCreateCampaign();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'Newsletter',
      channel: 'EMAIL',
      subject: '',
      content: '',
      audience: '',
    },
  });

  const selectedChannel = watch('channel');

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const audienceArray = values.audience ? values.audience.split(',').map(s => s.trim()).filter(Boolean) : undefined;
      await createMut.mutateAsync({
        ...values,
        audience: audienceArray,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setError(message || 'Failed to create campaign');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-neutral-200 max-h-[90vh] overflow-y-auto scrollbar-thin animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <h3 className="text-sm font-bold text-neutral-900">Create Marketing Campaign</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mt-4 rounded-lg bg-red-50 border border-red-100 p-2.5 text-2xs text-red-655 font-semibold">{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Campaign Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="e.g. Diwali Fashion Launch"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
              {errors.name && <p className="text-[9px] text-red-650 mt-1">{errors.name.message}</p>}
            </div>
            {/* Channel */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Channel</label>
              <select
                {...register('channel')}
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="EMAIL">EMAIL MESSAGE</option>
                <option value="SMS">SMS TEXT</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Campaign Type</label>
              <input
                type="text"
                {...register('type')}
                placeholder="e.g. Newsletter, Flash Sale"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
            </div>
            {/* Audience */}
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Audience (Comma Separated)</label>
              <input
                type="text"
                {...register('audience')}
                placeholder="e.g. VIP, inactive"
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
            </div>
          </div>

          {/* Subject (Only if EMAIL) */}
          {selectedChannel === 'EMAIL' && (
            <div>
              <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email Subject</label>
              <input
                type="text"
                {...register('subject')}
                placeholder="Subject line for campaign email..."
                className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              />
            </div>
          )}

          {/* Content */}
          <div>
            <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Message Content Body</label>
            <textarea
              {...register('content')}
              rows={5}
              placeholder="Write marketing copy here..."
              className="mt-1 w-full bg-neutral-55 border border-neutral-200 rounded-lg p-2.5 focus:outline-none resize-none font-sans"
            />
            {errors.content && <p className="text-[9px] text-red-650 mt-1">{errors.content.message}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition shadow-sm disabled:opacity-55 flex items-center"
            >
              {isSubmitting && <ButtonLoader />} Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
