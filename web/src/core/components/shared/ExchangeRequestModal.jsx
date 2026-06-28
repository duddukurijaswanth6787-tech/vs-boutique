import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

const REASONS = [
  'Wrong Size',
  'Defective Product',
  'Damaged Item',
  'Changed Mind',
  'Other',
];

export default function ExchangeRequestModal({ visible, onClose, onSubmit, saving }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const [prevVisible, setPrevVisible] = useState(false);
  
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) {
      setReason('');
      setNotes('');
      setError('');
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!reason) {
      setError('Please select a reason');
      return;
    }
    try {
      await onSubmit({ reason, notes: notes || undefined });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit exchange request');
    }
  };

  return (
    <Modal isOpen={visible} onClose={onClose} title="Request Exchange">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ArrowLeftRight size={24} className="text-accent" />
        </div>
        <p className="text-xs text-gray-400 mt-1">Tell us why you want to exchange this item</p>
      </div>

      {/* Reason Selection */}
      <div className="space-y-2 mb-6">
        {REASONS.map((r) => {
          const isSelected = reason === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`w-full block p-3.5 rounded-2xl border cursor-pointer transition-all text-left focus:outline-none focus:ring-2 focus:ring-accent/15 ${
                isSelected
                  ? 'border-accent bg-accent/5'
                  : 'border-[#d2c5b1]/15 bg-gray-50/50 hover:bg-gray-100/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                  isSelected ? 'border-accent' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-2 h-2 bg-accent rounded-full" />}
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{r}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Notes */}
      <Textarea
        label="Additional details (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Provide details about the exchange..."
        className="mb-4"
        rows={3}
      />

      {error && (
        <p className="text-xs text-red-500 text-center mb-4 font-semibold">{error}</p>
      )}

      <div className="flex space-x-3 mt-4">
        <Button
          variant="ghost"
          onClick={onClose}
          className="flex-1 py-4"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          isLoading={saving}
          className="flex-1 py-4"
        >
          Submit Request
        </Button>
      </div>
    </Modal>
  );
}
