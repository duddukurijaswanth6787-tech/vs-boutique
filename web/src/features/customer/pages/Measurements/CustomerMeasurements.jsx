import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronRight, Ruler, Trash2, Loader2, Clock, AlertTriangle } from 'lucide-react';
import CustomerLayout from '../../../../components/CustomerLayout';
import { getMyMeasurements, saveMyMeasurements, deleteMyMeasurements } from '@core/services';
import Input from '@core/components/ui/Input';
import Button from '@core/components/ui/Button';
import IconButton from '@core/components/ui/IconButton';
import Textarea from '@core/components/ui/Textarea';
import Modal from '@core/components/ui/Modal';
import { useCustomerAuth } from '@core/contexts';
import OtpModal from '@core/components/shared/OtpModal';
import EmptyState from '@core/components/ui/EmptyState';

const MEASUREMENT_FIELDS = [
  { key: 'chest', label: 'Chest', unit: 'inches' },
  { key: 'waist', label: 'Waist', unit: 'inches' },
  { key: 'length', label: 'Length', unit: 'inches' },
  { key: 'shoulder', label: 'Shoulder', unit: 'inches' },
  { key: 'sleeveLength', label: 'Sleeve Length', unit: 'inches' },
  { key: 'neck', label: 'Neck', unit: 'inches' },
];

const CustomerMeasurements = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useCustomerAuth();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const { data: measurement, isLoading, error } = useQuery({
    queryKey: ['my-measurements'],
    queryFn: getMyMeasurements,
    retry: false,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return (
    <CustomerLayout>
      <EmptyState
        title="My Measurements"
        description="Sign in to save and manage your custom tailoring measurements"
        actionLabel="Sign In"
        onAction={() => setShowOtp(true)}
        icon={Ruler}
      />
      {showOtp && <OtpModal onClose={() => setShowOtp(false)} />}
    </CustomerLayout>
  );

  const [form, setForm] = useState(null);

  const saveMutation = useMutation({
    mutationFn: saveMyMeasurements,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-measurements'] });
      queryClient.invalidateQueries({ queryKey: ['tailoring-measurements'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMyMeasurements,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-measurements'] });
      setShowDeleteConfirm(false);
    },
  });

  const current = measurement?.measurements || {};
  const notes = measurement?.notes || '';
  const updatedAt = measurement?.updatedAt;
  const hasData = measurement && !measurement.error;

  if (form === null && hasData) {
    const init = {};
    MEASUREMENT_FIELDS.forEach(f => { init[f.key] = current[f.key] || ''; });
    init.notes = notes || '';
    setForm(init);
  }

  if (!form && !hasData) {
    const init = {};
    MEASUREMENT_FIELDS.forEach(f => { init[f.key] = ''; });
    init.notes = '';
    if (!(error && error.response?.status !== 404) && !isLoading) {
      setForm(init);
    }
  }

  const handleSave = () => {
    const measurements = {};
    MEASUREMENT_FIELDS.forEach(f => {
      measurements[f.key] = form[f.key] === '' ? null : parseFloat(form[f.key]);
    });
    saveMutation.mutate({ measurements, notes: form.notes || '' });
  };

  const handleDelete = () => {
    deleteMutation.mutate();
    setForm(null);
  };

  return (
    <CustomerLayout>
      <div className="px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <IconButton
              icon={ArrowLeft}
              onClick={() => navigate('/customer/profile')}
              ariaLabel="Back to Profile"
            />
            <h1 className="text-xl font-bold text-gray-900">My Measurements</h1>
          </div>
          {hasData && !showDeleteConfirm && (
            <IconButton
              icon={Trash2}
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
              ariaLabel="Clear measurements"
            />
          )}
        </div>

        <div className="bg-gradient-to-r from-primary/5 to-primary/5 rounded-3xl p-4 mb-6 flex items-start space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Ruler size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Your Body Measurements</p>
            <p className="text-xs text-gray-500 mt-0.5">Saved measurements will auto-fill your tailoring orders.</p>
            {updatedAt && (
              <p className="text-[10px] text-gray-400 mt-1.5 flex items-center">
                <Clock size={10} className="mr-1" /> Last updated {new Date(updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-3xl p-5 border border-gray-50 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                {MEASUREMENT_FIELDS.map(f => (
                  <Input
                    key={f.key}
                    label={`${f.label} (${f.unit})`}
                    type="number"
                    step="0.1"
                    value={form?.[f.key] ?? ''}
                    onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder="0.0"
                  />
                ))}
              </div>
              <div className="mt-4">
                <Textarea
                  label="Notes"
                  value={form?.notes || ''}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="Fit preferences, design notes..."
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              isLoading={saveMutation.isPending}
              className="w-full mt-6"
            >
              {hasData ? 'Update Measurements' : 'Save Measurements'}
            </Button>

            {saveMutation.isSuccess && (
              <p className="text-xs text-green-600 font-medium text-center mt-3">Measurements saved successfully!</p>
            )}
            {saveMutation.isError && (
              <p className="text-xs text-red-500 font-medium text-center mt-3">{saveMutation.error?.response?.data?.message || 'Failed to save'}</p>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
      >
        <div className="text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">Clear Measurements?</h3>
          <p className="text-sm text-gray-500 mb-6">Your saved measurements will be permanently removed.</p>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              variant="ghost"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
              className="flex-1 bg-red-500 hover:bg-red-600 border-none text-white"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </CustomerLayout>
  );
};

export default CustomerMeasurements;
