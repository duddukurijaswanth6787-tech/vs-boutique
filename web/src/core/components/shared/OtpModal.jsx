import { useState, useEffect } from 'react';
import { Phone, Lock, ArrowRight, Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react';
import { sendOtp, verifyOtp, getDevOtpMetadata } from '../../../services/api';
import { useCustomerAuth } from '../../contexts';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { motion } from 'framer-motion';

export default function OtpModal({ isOpen = true, onClose }) {
  const { login } = useCustomerAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [devData, setDevData] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!otpSent || !devData || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setDevData((prevData) => prevData ? { ...prevData, status: 'EXPIRED', remainingAttempts: 0 } : null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSent, devData, timeLeft]);

  const handleRefreshMetadata = async () => {
    try {
      const data = await getDevOtpMetadata(phone);
      if (data) {
        setDevData(data);
        setTimeLeft(data.expiresIn || 0);
      }
    } catch (err) {
      console.error('Failed to refresh dev metadata:', err);
    }
  };

  useEffect(() => {
    if (!otpSent || !autoRefresh || !phone) return;

    const interval = setInterval(() => {
      handleRefreshMetadata();
    }, 2000);

    return () => clearInterval(interval);
  }, [otpSent, autoRefresh, phone]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (phone.length !== 10) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await sendOtp(phone);
      setOtpSent(true);
      if (res && res.dev) {
        setDevData(res.dev);
        setTimeLeft(res.dev.expiresIn || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError('Enter a valid OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await verifyOtp(phone, otp);
      login(res.user, res.token);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      if (err.response?.data?.dev) {
        setDevData(err.response.data.dev);
        if (err.response.data.dev.expiresIn !== undefined) {
          setTimeLeft(err.response.data.dev.expiresIn);
        }
      }
    } finally {
      setLoading(false);
    }
  };


  const handleCopy = () => {
    if (devData && devData.otp) {
      navigator.clipboard.writeText(devData.otp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setPhone('');
    setOtp('');
    setOtpSent(false);
    setError('');
    setDevData(null);
    setTimeLeft(0);
    setAutoRefresh(false);
    onClose();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatLocalTime = (isoString) => {
    if (!isoString) return '--:--:--';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '--:--:--';
    return date.toTimeString().split(' ')[0];
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="text-center mb-6 mt-2">
        <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Phone className="text-accent" size={28} />
        </div>
        <h2 className="text-xl font-serif font-black text-gray-900 dark:text-gray-100">
          {otpSent ? 'Enter OTP' : 'Sign In'}
        </h2>
        <p className="text-xs text-gray-400 font-medium mt-1">
          {otpSent ? `OTP sent to +91 ${phone}` : 'Enter your phone number to continue'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold px-4 py-3 rounded-xl mb-4 text-center">
          {error}
        </div>
      )}

      {!otpSent ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 border border-[#d2c5b1]/30 rounded-2xl px-4 py-1.5 focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10 transition-colors">
            <span className="text-sm font-bold text-gray-400 mr-2">+91</span>
            <input
              type="tel"
              maxLength={10}
              placeholder="9999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="flex-1 bg-transparent py-3 text-sm font-medium outline-none text-gray-900 dark:text-gray-100"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            isLoading={loading}
            className="w-full flex items-center justify-center space-x-2 py-4"
          >
            <span>Send OTP</span>
            <ArrowRight size={16} className="ml-1.5" />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 border border-[#d2c5b1]/30 rounded-2xl px-4 focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10 transition-colors">
            <Lock size={16} className="text-gray-400 mr-2 shrink-0" />
            <input
              type={showOtp ? 'text' : 'password'}
              maxLength={6}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="flex-1 bg-transparent py-4 text-sm font-medium outline-none text-gray-900 dark:text-gray-100"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowOtp(!showOtp)}
              className="p-1 text-gray-400 hover:text-accent transition-colors focus:outline-none cursor-pointer ml-2"
              aria-label={showOtp ? 'Hide OTP' : 'Show OTP'}
              id="toggle-otp-visibility"
            >
              {showOtp ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Button
            type="submit"
            isLoading={loading}
            className="w-full flex items-center justify-center space-x-2 py-4"
          >
            <span>Verify OTP</span>
            <ArrowRight size={16} className="ml-1.5" />
          </Button>

          {import.meta.env.DEV && devData && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-6 bg-amber-50/60 backdrop-blur-md border border-amber-200/50 dark:bg-amber-950/15 dark:border-amber-900/40 rounded-[2rem] shadow-premium text-left"
            >
              {/* Header with Dev Badge, Refresh, and Copy */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200/50 px-2.5 py-1 rounded-full">
                    🛠 Dev Tools
                  </span>
                  <label className="flex items-center space-x-1 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-3.5 h-3.5 text-amber-600 border-amber-300 rounded focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-[9px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                      Auto (2s)
                    </span>
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleRefreshMetadata}
                    className="p-1.5 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors cursor-pointer"
                    title="Refresh Metadata"
                  >
                    <RefreshCw size={14} className={autoRefresh ? "animate-spin" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-800/50 transition-colors cursor-pointer"
                    id="copy-otp-button"
                  >
                    {copied ? (
                      <span className="flex items-center space-x-1">
                        <Check size={12} className="text-green-600 dark:text-green-400" />
                        <span>Copied!</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1">
                        <Copy size={12} />
                        <span>Copy</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Body Fields */}
              <div className="space-y-3.5">
                {/* Phone */}
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-500 dark:text-gray-400">Phone Number</span>
                  <span className="font-bold text-gray-900 dark:text-gray-100">{devData.phone}</span>
                </div>

                {/* OTP & Eye Toggle */}
                <div className="flex justify-between items-center bg-white/50 dark:bg-gray-900/30 p-2.5 rounded-xl border border-amber-200/30 dark:border-amber-900/20">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Generated OTP</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-black text-sm text-amber-950 dark:text-amber-100 tracking-wider">
                      {showOtp ? devData.otp : '••••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOtp(!showOtp)}
                      className="text-amber-800/60 hover:text-amber-900 dark:text-amber-400 dark:hover:text-amber-200 transition-colors cursor-pointer"
                    >
                      {showOtp ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Grid for Times */}
                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="block font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Generated At</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100 font-bold">
                      {formatLocalTime(devData.generatedAt)}
                    </span>
                  </div>
                  <div>
                    <span className="block font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Expires At</span>
                    <span className="font-mono text-gray-900 dark:text-gray-100 font-bold">
                      {formatLocalTime(devData.expiresAt)}
                    </span>
                  </div>
                </div>

                {/* Countdown, Attempts & Status */}
                <div className="border-t border-amber-200/30 dark:border-amber-900/20 pt-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">Remaining Time</span>
                    <span className="font-mono font-black text-sm text-gray-900 dark:text-gray-100">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400">Remaining Attempts</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-gray-100">
                      {devData.remainingAttempts} / {devData.maxAttempts}
                    </span>
                  </div>
                </div>

                {/* Status & Regenerate Button */}
                <div className="border-t border-amber-200/30 dark:border-amber-900/20 pt-3 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Status:</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                      devData.status === 'ACTIVE'
                        ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30'
                        : devData.status === 'VERIFIED'
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
                        : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30'
                    }`}>
                      {devData.status === 'ACTIVE' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse mr-1" />
                      )}
                      {devData.status}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="flex items-center space-x-1 text-xs font-bold text-amber-800 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors cursor-pointer"
                  >
                    <span>🔄 Regenerate OTP</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp('');
              setError('');
              setDevData(null);
              setTimeLeft(0);
              setAutoRefresh(false);
            }}
            className="w-full text-xs font-bold text-gray-400 hover:text-accent transition-colors cursor-pointer mt-2"
          >
            Change phone number
          </button>
        </form>
      )}
    </Modal>
  );
}
