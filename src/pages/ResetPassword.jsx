import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Supabase appends #access_token=... or ?type=recovery
        const hash = window.location.hash;
        const search = window.location.search;

        // Listen for the hash change which supabase auth helper might trigger
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setError(null);
            }
        });

        if (!hash.includes('access_token') && !hash.includes('type=recovery') && !search.includes('type=recovery')) {
            // It might take a split second for the Supabase client to parse the URL and fire the event
            // We shouldn't immediately error out if we expect the session to be recovered
            // But we can check if there's no hash at all
            if (!hash && !search) {
                setError("Invalid or expired password reset link.");
            }
        }
    }, []);

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccessMessage("✅ Password successfully updated! Redirecting to login...");
            setTimeout(() => navigate('/login'), 3000);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center mb-6">
                    <img src="/logo.png" alt="RealConnect Logo" className="h-12 w-auto object-contain" />
                </Link>
                <h2 className="text-center text-3xl font-extrabold text-brand-dark">
                    Set new password
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Enter your new secure password below.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-light-blue to-brand-green" />

                    {error && (
                        <div className="mb-4 bg-red-50 p-4 rounded-xl flex items-start text-red-600 border border-red-100">
                            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-4 bg-green-50 p-5 rounded-xl border border-green-100 text-center">
                            <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto mb-3" />
                            <p className="text-sm text-green-800 font-medium">{successMessage}</p>
                        </div>
                    )}

                    {!successMessage && !error && (
                        <form className="space-y-5" onSubmit={handleUpdatePassword}>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        required type="password" value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors disabled:opacity-70"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
