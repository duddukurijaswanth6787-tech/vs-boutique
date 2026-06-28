import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthContext } from '@core/contexts';
import { api } from '@core/services';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { username, password });
            const { user, token } = response.data;

            login(user, token);

            if (user.role === 'super-admin') {
                navigate('/admin-dashboard');
            } else if (user.role === 'owner') {
                navigate('/owner/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-card p-10 w-full max-w-md border border-gray-50">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-black text-gray-900">VS App</h2>
                    <p className="text-gray-500 mt-2 font-medium">Welcome back! Please enter your details.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Username or Email</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold outline-none"
                            placeholder="Enter your username"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/10 transition-all font-bold outline-none"
                            placeholder="Enter your password"
                        />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input type="checkbox" className="rounded text-primary focus:ring-primary/20" />
                            <span className="text-sm font-medium text-gray-600">Remember for 30 days</span>
                        </label>
                        <a href="#" className="text-sm font-bold text-primary hover:underline">Forgot password?</a>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center disabled:opacity-50 mt-8"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
