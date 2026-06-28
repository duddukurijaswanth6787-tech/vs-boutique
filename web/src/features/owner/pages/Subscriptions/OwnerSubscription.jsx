import React, { useState, useEffect } from 'react';
import OwnerLayout from '../../../../components/OwnerLayout';
import { 
  getOwnerSubscription, 
  upgradeSubscription, 
  cancelSubscription,
  getSubscriptionPlans,
  requestCustomPlan,
  createSubscriptionPaymentOrder,
  verifySubscriptionPayment,
  getOwnerCustomPlanRequests
} from '@core/services';
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  Info,
  DollarSign,
  Download,
  Check,
  Settings,
  X
} from 'lucide-react';
import { motion } from 'framer-motion';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const OwnerSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Custom request modal states
  const [customRequestModalOpen, setCustomRequestModalOpen] = useState(false);
  const [requestForm, setRequestForm] = useState({
    requestedDesigns: 100,
    requestedOrders: 500,
    requestedGallery: 200,
    requestedStaff: 5,
    reason: ''
  });
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [customRequests, setCustomRequests] = useState([]);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError('');
      const subRes = await getOwnerSubscription();
      if (subRes?.success) {
        setSubscription(subRes.data.subscription);
      }
      const plansRes = await getSubscriptionPlans();
      if (plansRes?.success) {
        setPlans(plansRes.data);
      }
      const reqsRes = await getOwnerCustomPlanRequests();
      if (reqsRes?.success) {
        setCustomRequests(reqsRes.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load subscription details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleUpgrade = async (planName) => {
    try {
      setActionLoading(true);
      
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay SDK failed to load. Are you offline?');
        return;
      }

      // 2. Create subscription payment order
      const orderRes = await createSubscriptionPaymentOrder(planName);
      if (!orderRes?.success) {
        alert(orderRes?.message || 'Failed to initiate checkout.');
        return;
      }

      const { orderId, amount, currency, planId, keyId, isMock } = orderRes.data;

      if (isMock) {
        const confirmPayment = window.confirm(
          `✨ [Demo Mode] Simulated Payment ✨\n\nPlan: ${planName}\nAmount: ₹${amount / 100}\nOrder ID: ${orderId}\n\nWould you like to simulate a successful payment to upgrade your subscription?`
        );
        if (confirmPayment) {
          setActionLoading(true);
          const verifyRes = await verifySubscriptionPayment({
            razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
            razorpay_order_id: orderId,
            razorpay_signature: 'mock_signature',
            planId: planId
          });

          if (verifyRes?.success) {
            alert(`[Demo Mode] Successfully upgraded to ${planName}!`);
            await fetchSubscriptionData();
          } else {
            alert('[Demo Mode] Payment verification failed.');
          }
          return;
        } else {
          setActionLoading(false);
          return;
        }
      }

      // 3. Setup Razorpay options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Boutique Subscriptions',
        description: `Upgrade to ${planName} Plan`,
        order_id: orderId,
        handler: async function (response) {
          try {
            setActionLoading(true);
            const verifyRes = await verifySubscriptionPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              planId: planId
            });

            if (verifyRes?.success) {
              alert(`Successfully upgraded to ${planName}!`);
              await fetchSubscriptionData();
            } else {
              alert('Payment verification failed.');
            }
          } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Verification failed.');
          } finally {
            setActionLoading(false);
          }
        },
        prefill: {
          name: subscription?.boutique?.ownerName || '',
          email: subscription?.boutique?.email || '',
          contact: subscription?.boutique?.mobileNumber || ''
        },
        notes: {
          planName: planName,
          planId: planId
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function () {
            setActionLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to initialize payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription renewal? You will retain access until the end of your billing period.')) return;
    try {
      setActionLoading(true);
      const res = await cancelSubscription();
      if (res?.success) {
        alert('Subscription cancellation scheduled.');
        await fetchSubscriptionData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    try {
      const res = await requestCustomPlan(requestForm);
      if (res.success) {
        alert('Custom limit request submitted successfully. Super Admin will review it shortly.');
        setCustomRequestModalOpen(false);
        setRequestForm({
          requestedDesigns: 100,
          requestedOrders: 500,
          requestedGallery: 200,
          requestedStaff: 5,
          reason: ''
        });
        await fetchSubscriptionData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit request.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const downloadInvoice = (invoiceId) => {
    alert(`Mock Invoice ${invoiceId} PDF Downloaded successfully.`);
  };

  if (loading) {
    return (
      <OwnerLayout title="Subscription">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </OwnerLayout>
    );
  }

  const isExpired = subscription?.status === 'EXPIRED';
  const plan = subscription?.plan;

  // Feature accessibility checklist
  const features = [
    { key: 'allowDirectSelling', name: 'Direct Selling (Ready-Made Storefront)' },
    { key: 'allowCustomTailoring', name: 'Custom Tailoring & Measurements' },
    { key: 'canViewAnalytics', name: 'Advanced Dashboard Analytics' },
    { key: 'canCreateCampaigns', name: 'Marketing & Promotional Campaigns' },
    { key: 'canUseWhatsAppMarketing', name: 'WhatsApp Marketing & Broadcasts' },
    { key: 'canUseAiAssistant', name: 'AI Measuring Assistant' },
    { key: 'canManageStaff', name: 'Staff Management & Multi-Role Permissions' },
    { key: 'canUseCustomBranding', name: 'Custom Branding & Store Domain' }
  ];

  return (
    <OwnerLayout title="Subscription Plan">
      <div className="space-y-8">
        
        {/* Expired Warning Banner */}
        {isExpired && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-[2rem] p-6 flex items-start space-x-4 text-red-800 shadow-sm"
          >
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider">View-Only Mode Active</h4>
              <p className="text-sm font-medium text-red-700 mt-1">
                Your subscription has expired. You can view your dashboard, designs, and orders, but all create/update features (adding new designs, inviting staff, updating gallery, or processing orders) are locked until you upgrade.
              </p>
            </div>
          </motion.div>
        )}

        {/* Past Due Grace Period Warning Banner */}
        {subscription?.status === 'PAST_DUE' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 flex items-start space-x-4 text-amber-800 shadow-sm"
          >
            <AlertTriangle className="text-amber-500 flex-shrink-0 mt-0.5" size={24} />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider">Subscription Overdue (Grace Period Active)</h4>
              <p className="text-sm font-medium text-amber-700 mt-1">
                Your subscription payment is overdue, but you are currently within a grace period. Please renew or upgrade your plan to avoid a system lockout and maintain active operations.
              </p>
            </div>
          </motion.div>
        )}

        {/* Current Plan Overview Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Info Box */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-6">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Plan</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{plan?.name} PLAN</h3>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                  subscription?.status === 'ACTIVE' ? 'bg-green-50 text-green-600' :
                  subscription?.status === 'TRIAL' ? 'bg-blue-50 text-blue-600 animate-pulse' :
                  subscription?.status === 'PAST_DUE' ? 'bg-amber-50 text-amber-600 animate-pulse' :
                  subscription?.status === 'CANCELLED' ? 'bg-amber-50 text-amber-600' :
                  'bg-red-50 text-red-600'
                }`}>
                  {subscription?.status}
                </span>
                
                {subscription?.trialDaysRemaining !== null && subscription?.trialDaysRemaining !== undefined && (
                  <span className="flex items-center space-x-1 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest">
                    <Clock size={14} /> 
                    <span>{subscription.trialDaysRemaining} Days Left</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-400 font-bold">Billing Cycle</p>
                <p className="font-extrabold text-gray-900 mt-1">₹{plan?.price} / {plan?.billingInterval || 'month'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold">Renewal Date</p>
                <p className="font-extrabold text-gray-900 mt-1">
                  {subscription?.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4">
              {subscription?.status !== 'CANCELLED' && plan?.name !== 'FREE' && plan?.name !== 'ENTERPRISE' && (
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="px-6 py-3.5 bg-gray-50 border border-gray-100 hover:bg-gray-100 rounded-2xl text-xs font-black text-gray-500 uppercase tracking-wider transition-all"
                >
                  Cancel Renewal
                </button>
              )}
              {subscription?.upgradeRecommendation && (
                <button
                  onClick={() => handleUpgrade(subscription.upgradeRecommendation)}
                  disabled={actionLoading}
                  className="px-6 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg shadow-primary/20"
                >
                  <span>Upgrade to {subscription.upgradeRecommendation}</span>
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Limits warnings summary */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="text-lg font-black text-gray-900 mb-2">Platform Features</h4>
              <p className="text-xs text-gray-400 font-bold mb-6">Matrix permissions for your current tier.</p>
              
              <div className="space-y-4">
                {features.map(feat => {
                  const hasAccess = plan?.features?.[feat.key];
                  return (
                    <div key={feat.key} className="flex items-center space-x-3">
                      {hasAccess ? (
                        <ShieldCheck className="text-green-500" size={18} />
                      ) : (
                        <ShieldAlert className="text-gray-300" size={18} />
                      )}
                      <span className={`text-xs font-bold ${hasAccess ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                        {feat.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 mt-6">
              <button
                onClick={() => setCustomRequestModalOpen(true)}
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 text-primary border border-gray-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Settings size={14} />
                <span>Request Custom Limits</span>
              </button>
              
              {plan?.name === 'FREE' && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 flex items-start space-x-2">
                  <Info size={16} className="mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] font-bold">
                    On the FREE Plan you have restricted features and lower usage limits. Upgrade to unlock analytics and marketing!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Usage Progress Widgets */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-6">Plan Limits & Usage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.keys(subscription?.usageProgress || {})
              .filter(key => {
                const keyMappings = {
                  readyMadeProducts: 'Ready-Made Products',
                  customDesigns: 'Custom Designs',
                  orders: 'Monthly Orders',
                  bookings: 'Monthly Bookings',
                  customers: 'CRM Customers',
                  measurements: 'Measurements Saved',
                  gallery: 'Gallery Uploads',
                  staff: 'Staff Accounts',
                  branches: 'Active Branches'
                };
                return keyMappings[key] !== undefined;
              })
              .map(key => {
                const progress = subscription.usageProgress[key];
                const maxLabel = progress.max === 'Unlimited' ? '∞' : progress.max;
                const keyMappings = {
                  readyMadeProducts: 'Ready-Made Products',
                  customDesigns: 'Custom Designs',
                  orders: 'Monthly Orders',
                  bookings: 'Monthly Bookings',
                  customers: 'CRM Customers',
                  measurements: 'Measurements Saved',
                  gallery: 'Gallery Uploads',
                  staff: 'Staff Accounts',
                  branches: 'Active Branches'
                };
                const displayName = keyMappings[key];
                return (
                  <div key={key} className="p-6 rounded-3xl border border-gray-50 bg-gray-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-wider">{displayName}</span>
                        {progress.warning && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-lg text-[9px] font-extrabold uppercase animate-pulse">
                            Near Limit
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-black text-gray-900">{progress.current}</span>
                        <span className="text-xs text-gray-400 font-bold">/ {maxLabel}</span>
                      </div>
                    </div>
                    
                    {progress.max !== 'Unlimited' && (
                      <div className="mt-6">
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${progress.warning ? 'bg-amber-500' : 'bg-primary'}`}
                            style={{ width: `${Math.min(100, progress.percentage)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2 text-[10px] text-gray-400 font-bold">
                          <span>{progress.percentage}% Used</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Plan Upgrade Comparison Grid */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-2">Upgrade Boutique Tier</h3>
          <p className="text-xs text-gray-400 font-bold mb-8">Choose the subscription tier that matches your boutique size.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((p) => {
              const isCurrent = p.name === plan?.name;
              return (
                <div 
                  key={p.id}
                  className={`p-6 rounded-3xl border ${
                    isCurrent 
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5' 
                      : 'border-gray-100 bg-white hover:border-gray-300'
                  } transition-all flex flex-col justify-between`}
                >
                  <div>
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{p.displayName || p.name}</span>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-3xl font-black text-gray-900">₹{Number(p.price)}</span>
                      <span className="text-xs text-gray-400 font-bold ml-1">/ month</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.allowDirectSelling && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase">
                          Selling
                        </span>
                      )}
                      {p.allowCustomTailoring && (
                        <span className="bg-purple-50 text-purple-700 border border-purple-100 text-[9px] px-2 py-0.5 rounded-lg font-black uppercase">
                          Tailoring
                        </span>
                      )}
                    </div>

                    <div className="mt-6 space-y-2 border-t border-gray-50 pt-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 font-bold">
                        <span>Ready-Made Products</span>
                        <span className="text-gray-900 font-black">{p.maxReadyMadeProducts === -1 || p.maxReadyMadeProducts >= 999999 ? 'Unlimited' : p.maxReadyMadeProducts}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 font-bold">
                        <span>Custom Designs</span>
                        <span className="text-gray-900 font-black">{p.maxCustomDesigns === -1 || p.maxCustomDesigns >= 999999 ? 'Unlimited' : p.maxCustomDesigns}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 font-bold">
                        <span>Monthly Orders</span>
                        <span className="text-gray-900 font-black">{p.maxOrdersPerMonth === -1 || p.maxOrdersPerMonth >= 999999 ? 'Unlimited' : p.maxOrdersPerMonth}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 font-bold">
                        <span>Monthly Bookings</span>
                        <span className="text-gray-900 font-black">{p.maxBookingsPerMonth === -1 || p.maxBookingsPerMonth >= 999999 ? 'Unlimited' : p.maxBookingsPerMonth}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600 font-bold">
                        <span>Staff limit</span>
                        <span className="text-gray-900 font-black">{p.maxStaffAccounts === -1 || p.maxStaffAccounts >= 999999 ? 'Unlimited' : p.maxStaffAccounts}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    {isCurrent ? (
                      <button 
                        disabled
                        className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl text-xs font-black uppercase tracking-wider cursor-default flex items-center justify-center space-x-1"
                      >
                        <Check size={14} />
                        <span>Current Plan</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpgrade(p.name)}
                        disabled={actionLoading}
                        className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                          p.name === 'PRO' || p.name === 'ENTERPRISE'
                            ? 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-950/10'
                            : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'
                        }`}
                      >
                        Select {p.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoice Ledger Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-6">Billing History</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {subscription?.billingHistory && subscription.billingHistory.length > 0 ? (
                  subscription.billingHistory.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-gray-600">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900">
                        INV-{invoice.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900">
                        ₹{invoice.amount}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">
                        {invoice.paymentMethod}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-wider border border-green-100">
                          {invoice.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => downloadInvoice(invoice.id)}
                          className="text-primary hover:text-primary-dark p-2 hover:bg-primary/5 rounded-xl transition-all inline-flex items-center space-x-1"
                        >
                          <Download size={14} />
                          <span className="text-[10px] font-black uppercase tracking-wider">PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-bold italic">
                      No invoices found for this subscription.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Custom Limit Request History Table */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-xl font-black text-gray-900 mb-2">Custom Quota Requests</h3>
          <p className="text-xs text-gray-400 font-bold mb-6">Track your requested limits and approval states.</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Requested Date</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Designs</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Orders/Mo</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Gallery</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Staff</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Reason</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customRequests && customRequests.length > 0 ? (
                  customRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs font-bold text-gray-600">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900">
                        {req.requestedDesigns}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900">
                        {req.requestedOrders}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900">
                        {req.requestedGallery}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900">
                        {req.requestedStaff}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-gray-500 max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                          req.status === 'APPROVED' ? 'bg-green-50 text-green-600 border-green-100' :
                          req.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                          'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400 font-bold italic">
                      No custom requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ================= MODAL: REQUEST CUSTOM LIMITS ================= */}
      {customRequestModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-gray-950/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-black text-gray-900 uppercase">Request Custom Limits</h3>
                <p className="text-xs text-gray-500 mt-0.5">Submit request to Super Admin for customized platform quotas.</p>
              </div>
              <button 
                onClick={() => setCustomRequestModalOpen(false)}
                className="p-2 hover:bg-gray-200 rounded-xl text-gray-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase">Requested Designs</label>
                  <input 
                    type="number" 
                    value={requestForm.requestedDesigns}
                    onChange={e => setRequestForm({...requestForm, requestedDesigns: parseInt(e.target.value) || 0})}
                    className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase">Requested Orders/Mo</label>
                  <input 
                    type="number" 
                    value={requestForm.requestedOrders}
                    onChange={e => setRequestForm({...requestForm, requestedOrders: parseInt(e.target.value) || 0})}
                    className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase">Gallery Images</label>
                  <input 
                    type="number" 
                    value={requestForm.requestedGallery}
                    onChange={e => setRequestForm({...requestForm, requestedGallery: parseInt(e.target.value) || 0})}
                    className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase">Staff Accounts</label>
                  <input 
                    type="number" 
                    value={requestForm.requestedStaff}
                    onChange={e => setRequestForm({...requestForm, requestedStaff: parseInt(e.target.value) || 0})}
                    className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-500 uppercase">Justification / Reason</label>
                <textarea 
                  value={requestForm.reason}
                  onChange={e => setRequestForm({...requestForm, reason: e.target.value})}
                  rows={4}
                  placeholder="Explain why your boutique requires this custom configuration..."
                  className="w-full mt-1.5 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-950 focus:outline-none resize-none"
                  required
                />
              </div>

              <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setCustomRequestModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-500 rounded-xl text-xs font-black uppercase hover:bg-gray-50 transition-colors"
                >
                  CANCEL
                </button>
                <button 
                  type="submit" 
                  disabled={submittingRequest}
                  className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-black uppercase hover:opacity-95 transition-opacity disabled:opacity-40"
                >
                  {submittingRequest ? 'SUBMITTING...' : 'SUBMIT REQUEST'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OwnerLayout>
  );
};

export default OwnerSubscription;
