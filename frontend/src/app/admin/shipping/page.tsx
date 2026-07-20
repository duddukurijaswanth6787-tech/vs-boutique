'use client';

import React, { useState } from 'react';
import {
  useShippingMethods,
  useShippingZones,
  useCreateShippingMethod,
  useCreateShippingZone,
} from '@/features/shipping/shipping.hooks';
import { RateType } from '@/features/shipping/shipping.types';
import { SectionLoader, PageError, ButtonLoader } from '@/components/feedback/FeedbackStates';
import { getApiErrorMessage } from '@/utils/getApiErrorMessage';
import { Plus, Sliders, Map, Calculator, HelpCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { formatMoney } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api/client';

// Schemas for forms
const methodSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(50),
  code: z.string().min(2, 'Code is too short').max(20).regex(/^[A-Z0-9_-]+$/, 'Caps, numbers, dash/underscore only'),
  description: z.string().max(200).optional(),
  estimatedDays: z.string().min(1, 'Estimated days is required'),
});

const zoneSchema = z.object({
  methodId: z.string().uuid('Please select a shipping method'),
  name: z.string().min(2, 'Zone name is too short').max(100),
  countries: z.string(),
  states: z.string(),
  pincodes: z.string(),
  rateType: z.enum([RateType.FLAT, RateType.WEIGHT, RateType.PRICE]),
  rate: z.number().min(0, 'Rate cannot be negative'),
  freeAbove: z.number().min(0).optional(),
  maxWeight: z.number().min(0).optional(),
});

export default function ShippingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'METHODS' | 'ZONES' | 'CALCULATOR'>('METHODS');

  // Queries
  const { data: methods, isLoading: isLoadingMethods, isError: isErrorMethods, refetch: refetchMethods } = useShippingMethods();
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  const { data: zones, isLoading: isLoadingZones, refetch: refetchZones } = useShippingZones(selectedMethodId || undefined);

  // Mutations
  const createMethodMut = useCreateShippingMethod();
  const createZoneMut = useCreateShippingZone();

  // Method form
  const {
    register: regMethod,
    handleSubmit: handleSubMethod,
    reset: resetMethod,
    formState: { errors: errorsMethod, isSubmitting: isSubmittingMethod },
  } = useForm<z.infer<typeof methodSchema>>({
    resolver: zodResolver(methodSchema),
    defaultValues: { name: '', code: '', description: '', estimatedDays: '3-5 Days' },
  });

  // Zone form
  const {
    register: regZone,
    handleSubmit: handleSubZone,
    reset: resetZone,
    formState: { errors: errorsZone, isSubmitting: isSubmittingZone },
  } = useForm<z.infer<typeof zoneSchema>>({
    resolver: zodResolver(zoneSchema),
    defaultValues: { methodId: '', name: '', countries: '', states: '', pincodes: '', rateType: RateType.FLAT, rate: 0, freeAbove: 0, maxWeight: 0 },
  });

  // Calculator State
  const [calcCode, setCalcCode] = useState('');
  const [calcCountry, setCalcCountry] = useState('India');
  const [calcState, setCalcState] = useState('');
  const [calcPincode, setCalcPincode] = useState('');
  const [calcWeight, setCalcWeight] = useState(1);
  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcResult, setCalcResult] = useState<{
    rate: number;
    methodName: string;
    methodCode: string;
    estimatedDelivery: string;
    freeShipping: boolean;
  } | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const onAddMethod = async (values: z.infer<typeof methodSchema>) => {
    try {
      await createMethodMut.mutateAsync(values);
      resetMethod();
      refetchMethods();
    } catch (err) {
      console.error(err);
    }
  };

  const onAddZone = async (values: z.infer<typeof zoneSchema>) => {
    try {
      const splitComma = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
      await createZoneMut.mutateAsync({
        ...values,
        countries: splitComma(values.countries),
        states: splitComma(values.states),
        pincodes: splitComma(values.pincodes),
      });
      resetZone();
      refetchZones();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalcLoading(true);
    setCalcError(null);
    setCalcResult(null);
    try {
      const response = await apiClient.get(`/shipping/methods/${calcCode}/calculate`, {
        params: {
          country: calcCountry,
          state: calcState,
          pincode: calcPincode || undefined,
          weight: calcWeight,
          orderAmount: calcAmount,
        },
      });
      setCalcResult(response.data?.data);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message
        : getApiErrorMessage(err);
      setCalcError(message || 'Failed to calculate shipping rate');
    } finally {
      setCalcLoading(false);
    }
  };

  const isEditor = user?.roles?.some(r => ['super_admin', 'admin'].includes(r));

  return (
    <div className="space-y-6">
      {/* Top Header Panel */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-sans">Shipping Operations & Rates</h1>
          <p className="text-xs text-neutral-400 mt-1">Configure shipping carrier methods, build shipping pricing zones, and test calculation logic.</p>
        </div>
      </div>

      {/* Carrier disclaimer alert */}
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-800 leading-normal">
        <HelpCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Carrier Integration Notice:</span>
          <p className="mt-0.5">Vasanthi Designers backend does not support external API integrations (e.g. DTDC Booking). All carriers listed below represent custom billing rate zones managed manually. DTDC CARRIER INTEGRATION NOT IMPLEMENTED IN BACKEND.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200">
        {(['METHODS', 'ZONES', 'CALCULATOR'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition -mb-px
              ${activeTab === tab
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'METHODS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Method listing */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Shipping Methods Configuration
            </h3>
            {isLoadingMethods ? (
              <SectionLoader message="Loading methods..." />
            ) : isErrorMethods ? (
              <PageError title="Fetch Failure" message="Could not fetch shipping methods." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-wider text-[9px] font-bold border-b border-neutral-200">
                      <th className="p-3">Name</th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Estimated Delivery</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {methods?.map((m) => (
                      <tr key={m.id} className="hover:bg-neutral-50/50 transition">
                        <td className="p-3 font-bold text-neutral-800">{m.name}</td>
                        <td className="p-3 font-mono font-semibold text-[10px] text-neutral-500">{m.code}</td>
                        <td className="p-3 text-neutral-600 font-semibold">{m.estimatedDays}</td>
                        <td className="p-3 text-neutral-500">{m.description || '-'}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                            ${m.isActive ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-neutral-100 text-neutral-500'}
                          `}>
                            {m.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add method form (Only if admin editor) */}
          {isEditor && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
                New Shipping Method
              </h3>
              <form onSubmit={handleSubMethod(onAddMethod)} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Method Name</label>
                  <input
                    type="text"
                    {...regMethod('name')}
                    placeholder="e.g. Standard Courier Delivery"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                  {errorsMethod.name && <p className="text-[10px] text-red-650 mt-1">{errorsMethod.name.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Method Code</label>
                  <input
                    type="text"
                    {...regMethod('code')}
                    placeholder="e.g. STANDARD_DELIVERY"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
                  />
                  {errorsMethod.code && <p className="text-[10px] text-red-650 mt-1">{errorsMethod.code.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Estimated Days</label>
                  <input
                    type="text"
                    {...regMethod('estimatedDays')}
                    placeholder="e.g. 3-5 Business Days"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                  {errorsMethod.estimatedDays && <p className="text-[10px] text-red-650 mt-1">{errorsMethod.estimatedDays.message}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Description (Optional)</label>
                  <input
                    type="text"
                    {...regMethod('description')}
                    placeholder="Provide details about carrier..."
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingMethod}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  {isSubmittingMethod ? <ButtonLoader /> : <Plus className="w-4 h-4 mr-1 inline-block" />} Create Method
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ZONES' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Zones listing */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                Shipping Zones Config
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-400 font-semibold">Filter Method:</span>
                <select
                  value={selectedMethodId}
                  onChange={(e) => setSelectedMethodId(e.target.value)}
                  className="bg-neutral-50 border border-neutral-200 rounded px-2 py-1 text-2xs focus:outline-none"
                >
                  <option value="">All Methods</option>
                  {methods?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {isLoadingZones ? (
              <SectionLoader message="Retrieving shipping zones..." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-400 uppercase tracking-wider text-[9px] font-bold border-b border-neutral-200">
                      <th className="p-3">Zone Name</th>
                      <th className="p-3">Countries</th>
                      <th className="p-3">States</th>
                      <th className="p-3">Rate Type</th>
                      <th className="p-3 text-right">Base Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-700">
                    {zones?.map((z) => (
                      <tr key={z.id} className="hover:bg-neutral-50/50 transition">
                        <td className="p-3 font-bold text-neutral-800">{z.name}</td>
                        <td className="p-3 font-medium text-neutral-500 truncate max-w-[120px]">{z.countries.join(', ')}</td>
                        <td className="p-3 font-medium text-neutral-500 truncate max-w-[120px]">{z.states.join(', ')}</td>
                        <td className="p-3 font-semibold text-[10px] text-neutral-500 uppercase">{z.rateType}</td>
                        <td className="p-3 text-right font-mono font-bold text-neutral-900">{formatMoney(z.rate)}</td>
                      </tr>
                    ))}
                    {(!zones || zones.length === 0) && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-neutral-400">
                          No shipping zones created for this method yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add zone form */}
          {isEditor && (
            <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
                New Shipping Zone
              </h3>
              <form onSubmit={handleSubZone(onAddZone)} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Carrier Method</label>
                  <select
                    {...regZone('methodId')}
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="">-- Choose Method --</option>
                    {methods?.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {errorsZone.methodId && <p className="text-[10px] text-red-650 mt-1">{errorsZone.methodId.message as string}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Zone Name</label>
                  <input
                    type="text"
                    {...regZone('name')}
                    placeholder="e.g. South India Flat Zone"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                  {errorsZone.name && <p className="text-[10px] text-red-650 mt-1">{errorsZone.name.message as string}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Countries (Comma Separated)</label>
                  <input
                    type="text"
                    {...regZone('countries')}
                    placeholder="e.g. India, Sri Lanka"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">States (Comma Separated)</label>
                  <input
                    type="text"
                    {...regZone('states')}
                    placeholder="e.g. Maharashtra, Karnataka"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Pincodes (Comma Separated)</label>
                  <input
                    type="text"
                    {...regZone('pincodes')}
                    placeholder="e.g. 400001, 560001"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Rate Type</label>
                    <select
                      {...regZone('rateType')}
                      className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none"
                    >
                      <option value={RateType.FLAT}>FLAT RATE</option>
                      <option value={RateType.WEIGHT}>WEIGHT BASE</option>
                      <option value={RateType.PRICE}>PRICE BASE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Rate Cost (₹)</label>
                    <input
                      type="number"
                      step="any"
                      {...regZone('rate', { valueAsNumber: true })}
                      className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 focus:outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmittingZone}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  {isSubmittingZone ? <ButtonLoader /> : <Plus className="w-4 h-4 mr-1 inline-block" />} Create Zone
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {activeTab === 'CALCULATOR' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rate sandbox form */}
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100 flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-neutral-400" /> Rate Calculation Sandbox
            </h3>
            <form onSubmit={handleCalculate} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Shipping Method Code</label>
                <select
                  value={calcCode}
                  onChange={(e) => setCalcCode(e.target.value)}
                  required
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none font-mono"
                >
                  <option value="">-- Select Code --</option>
                  {methods?.map(m => (
                    <option key={m.id} value={m.code}>{m.code}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Country</label>
                  <input
                    type="text"
                    value={calcCountry}
                    onChange={(e) => setCalcCountry(e.target.value)}
                    required
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">State</label>
                  <input
                    type="text"
                    value={calcState}
                    onChange={(e) => setCalcState(e.target.value)}
                    required
                    placeholder="e.g. Maharashtra"
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Order Value (₹)</label>
                  <input
                    type="number"
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(parseFloat(e.target.value))}
                    required
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(parseFloat(e.target.value))}
                    required
                    className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Pincode (Optional)</label>
                <input
                  type="text"
                  value={calcPincode}
                  onChange={(e) => setCalcPincode(e.target.value)}
                  placeholder="e.g. 400001"
                  className="mt-1 w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={calcLoading}
                className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold py-2 rounded-xl text-xs transition"
              >
                {calcLoading ? 'Calculating...' : 'Run sandbox rate'}
              </button>
            </form>
          </div>

          {/* Sandbox result */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Calculation Output
            </h3>
            {calcLoading && <SectionLoader message="Running pricing calculation algorithms..." />}
            {calcError && (
              <div className="flex gap-2 bg-red-50 border border-red-100 text-red-700 text-xs p-4 rounded-xl items-center font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{calcError}</span>
              </div>
            )}
            {calcResult ? (
              <div className="space-y-4 text-xs">
                <div className="bg-green-50 border border-green-150 p-4 rounded-xl text-green-800 flex justify-between font-bold items-center text-sm">
                  <span>Calculated Rate Cost:</span>
                  <span className="font-mono text-lg">{formatMoney(calcResult.rate)}</span>
                </div>
                <div className="space-y-2.5 text-neutral-700">
                  <div className="flex justify-between pb-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Method Name:</span>
                    <span className="font-semibold">{calcResult.methodName}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Method Code:</span>
                    <span className="font-mono font-semibold">{calcResult.methodCode}</span>
                  </div>
                  <div className="flex justify-between pb-1.5 border-b border-neutral-100">
                    <span className="text-neutral-500">Estimated Delivery:</span>
                    <span className="font-semibold">{calcResult.estimatedDelivery}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Eligible for Free Shipping:</span>
                    <span className="font-bold">{calcResult.freeShipping ? 'YES' : 'NO'}</span>
                  </div>
                </div>
              </div>
            ) : (
              !calcLoading && (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-neutral-200 rounded-xl text-neutral-400">
                  <Calculator className="w-8 h-8 opacity-40 mb-2" />
                  <p className="text-2xs font-semibold">Input params and click run calculation to test pricing rates.</p>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCircle({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}
