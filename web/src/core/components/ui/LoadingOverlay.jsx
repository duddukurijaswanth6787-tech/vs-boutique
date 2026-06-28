import { Loader2 } from 'lucide-react';

export default function LoadingOverlay({
  message = 'Processing payment...',
  className = '',
  ...props
}) {
  return (
    <div
      className={`fixed inset-0 z-[100] bg-white/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 ${className}`}
      {...props}
    >
      <div className="bg-white rounded-3xl p-6 shadow-2xl border border-[#d2c5b1]/10 flex flex-col items-center max-w-xs text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{message}</p>
          <p className="text-xs text-gray-400 mt-0.5">Please do not close this window</p>
        </div>
      </div>
    </div>
  );
}
