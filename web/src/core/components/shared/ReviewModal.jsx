import { useState } from 'react';
import { Star } from 'lucide-react';
import Modal from '../ui/Modal';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

export default function ReviewModal({ visible, onClose, onSubmit, saving, initial }) {
  const [rating, setRating] = useState(initial?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initial?.comment || '');
  const [error, setError] = useState('');

  const [prevVisible, setPrevVisible] = useState(false);
  const [prevInitial, setPrevInitial] = useState(null);
  
  if (visible !== prevVisible || initial !== prevInitial) {
    setPrevVisible(visible);
    setPrevInitial(initial);
    if (visible) {
      setRating(initial?.rating || 0);
      setComment(initial?.comment || '');
      setError('');
    }
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError('');
    if (!rating) {
      setError('Please select a rating');
      return;
    }
    try {
      await onSubmit({ rating, comment, title: '' });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit review');
    }
  };

  return (
    <Modal isOpen={visible} onClose={onClose} title={initial ? 'Edit Review' : 'Write a Review'}>
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Star size={24} className="text-amber-500" />
        </div>
        <p className="text-xs text-gray-400 mt-1">Share your experience with this product</p>
      </div>

      {/* Star Rating */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(s)}
            className="p-1 transition-transform hover:scale-110 cursor-pointer focus:outline-none"
            aria-label={`Rate ${s} out of 5 stars`}
          >
            <Star
              size={32}
              className={`transition-all ${
                s <= (hoverRating || rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-200 dark:text-gray-700'
              }`}
            />
          </button>
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center mb-4 font-semibold">{error}</p>
      )}

      {/* Review Text */}
      <Textarea
        label="Review Message"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review here..."
        className="mb-6"
        rows={4}
      />

      {/* Actions */}
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
          {initial ? 'Update' : 'Submit'}
        </Button>
      </div>
    </Modal>
  );
}
