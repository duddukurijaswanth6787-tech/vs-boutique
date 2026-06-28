import { AlertTriangle } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function DeleteConfirm({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  password = '',
  onPasswordChange,
  errorMessage = '',
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Entity?">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <AlertTriangle size={36} />
        </div>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          This action is permanent and cannot be reversed. All store data will be purged.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          placeholder="Enter admin password to continue"
          error={errorMessage}
          required
        />

        <div className="flex flex-col space-y-2 mt-6">
          <Button
            variant="primary"
            onClick={onConfirm}
            disabled={loading || !password}
            isLoading={loading}
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/10"
          >
            Yes, Purge Entity
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full py-4"
          >
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
