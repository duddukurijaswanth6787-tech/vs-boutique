import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { setPassword } from '@core/services';
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

const PasswordReq = ({ met, label }) => (
    <div className={`flex items-center space-x-1.5 transition-colors ${met ? 'text-green-500' : 'text-gray-300'}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-gray-300'}`} />
        <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
);

const SetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const [success, setSuccess] = useState(false);

    const validatePassword = (pass) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(pass);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            return setError('Passwords do not match');
        }
        if (!validatePassword(formData.password)) {
            return setError('Password does not meet the security requirements');
        }

        setLoading(true);
        setError('');

        try {
            await setPassword({ token, password: formData.password });
            setSuccess(true);
            setTimeout(() => navigate('/admin'), 3000);
        } catch (err) {
            if (err.response?.status === 400) {
                setIsExpired(true);
                setError('This invitation link has expired or is invalid.');
            } else {
                setError(err.response?.data?.message || 'Something went wrong');
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-xl text-center space-y-6">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Activated!</h1>
                    <p className="text-gray-500 font-medium">Your password has been set successfully. You will be redirected to the login page shortly.</p>
                    <Link to="/admin" className="inline-flex items-center space-x-2 text-primary font-black uppercase tracking-widest text-sm hover:underline pt-4">
                        <span>Go to Login Now</span> <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    if (!token || isExpired) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-xl text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{isExpired ? 'Link Expired' : 'Invalid Link'}</h1>
                    <p className="text-gray-500 font-medium">
                        {isExpired 
                            ? 'Your invitation link has expired for security reasons. Please contact your administrator to resend the invitation.' 
                            : 'This invitation link is invalid or missing a token. Please check your email or contact the administrator.'}
                    </p>
                    <Link to="/admin" className="inline-flex items-center space-x-2 text-primary font-black uppercase tracking-widest text-sm hover:underline pt-4">
                        <ArrowRight size={16} className="rotate-180" /> <span>Back to Home</span>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-[3rem] p-10 md:p-12 shadow-2xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full -ml-12 -mb-12" />

                <div className="relative z-10">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Shield size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">Welcome Aboard!</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Set your secure password</p>
                        </div>
                    </div>

                    <p className="text-gray-500 font-medium text-sm mb-8 leading-relaxed">
                        Choose a strong password to activate your account.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center space-x-3 text-red-600">
                                <AlertCircle size={20} className="flex-shrink-0" />
                                <p className="text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="pt-2 pl-1 flex flex-wrap gap-x-4 gap-y-1">
                                <PasswordReq met={formData.password.length >= 8} label="8+ Chars" />
                                <PasswordReq met={/[A-Z]/.test(formData.password)} label="1 Uppercase" />
                                <PasswordReq met={/\d/.test(formData.password)} label="1 Number" />
                                <PasswordReq met={/[@$!%*?&]/.test(formData.password)} label="1 Special" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest rounded-2xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 flex items-center justify-center space-x-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Activate My Account</span>}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                            Secure System by VS Boutique
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SetPassword;
