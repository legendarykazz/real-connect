import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus, Lock, Mail, AlertCircle, CheckCircle2, Chrome } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const navigate = useNavigate();

    // Email + password auth
    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                navigate('/');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        // Supabase will send a confirmation email automatically
                        // as long as "Confirm email" is enabled in your Supabase project settings
                    }
                });
                if (error) throw error;
                setSuccessMessage(`✅ We've sent a verification link to ${email}. Please check your inbox (and spam folder) to confirm your account before signing in.`);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Google OAuth login
    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/` // Redirect back to home after Google login
                }
            });
            if (error) throw error;
            // Google will open in same tab and redirect back
        } catch (err) {
            setError(err.message);
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <Link to="/" className="flex justify-center mb-6">
                    <img src="/logo.png" alt="RealConnect Logo" className="h-12 w-auto object-contain" />
                </Link>
                <h2 className="text-center text-3xl font-extrabold text-brand-dark">
                    {isLogin ? 'Sign in to your account' : 'Create a new account'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }} className="text-brand-light-blue font-semibold hover:underline">
                        {isLogin ? 'Sign up free' : 'Sign in'}
                    </button>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-light-blue to-brand-green" />

                    {/* Error message */}
                    {error && (
                        <div className="mb-4 bg-red-50 p-4 rounded-xl flex items-start text-red-600 border border-red-100">
                            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Success / Email verification sent message */}
                    {successMessage && (
                        <div className="mb-4 bg-green-50 p-5 rounded-xl border border-green-100 text-center">
                            <CheckCircle2 className="w-10 h-10 text-brand-green mx-auto mb-3" />
                            <p className="text-sm text-green-800 font-medium">{successMessage}</p>
                            <button onClick={() => { setIsLogin(true); setSuccessMessage(null); }} className="mt-4 text-sm text-brand-green font-bold underline">
                                Back to Sign In
                            </button>
                        </div>
                    )}

                    {!successMessage && (
                        <>
                            {/* Google Sign In */}
                            <button
                                onClick={handleGoogleLogin}
                                disabled={googleLoading}
                                className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-xl py-3 px-4 font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60 disabled:cursor-not-allowed mb-6"
                            >
                                {/* Google SVG icon */}
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
                            </button>

                            <div className="relative mb-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-3 bg-white text-gray-500">Or use email</span>
                                </div>
                            </div>

                            {/* Email / Password form */}
                            <form className="space-y-5" onSubmit={handleAuth}>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            required type="email" value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                                    {!isLogin && (
                                        <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                                    )}
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-brand-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors disabled:opacity-70"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2"><svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Processing...</span>
                                    ) : (
                                        <>
                                            {isLogin ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                            {isLogin ? 'Sign In' : 'Create Account & Verify Email'}
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Security note */}
                            <p className="mt-5 text-center text-xs text-gray-400">
                                🔒 Protected by Supabase Auth. Your data is secure.
                                {!isLogin && ' A verification email will be sent after sign up.'}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;
