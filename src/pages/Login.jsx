import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus, Lock, Mail, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

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
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                        }
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



    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex flex-col py-12 sm:px-6 lg:px-8 font-sans overflow-y-auto">
            <div className="m-auto w-full">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="mb-10 items-center text-center">
                    <Link to="/" className="inline-block">
                        <h1 className="text-4xl font-extrabold text-brand-dark mb-2 hover:opacity-80 transition-opacity">RealConnect</h1>
                    </Link>
                    <p className="text-gray-500 text-base">
                        {isLogin ? 'Welcome back! Log in to continue.' : 'Create an account to get started.'}
                    </p>
                </div>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100 mb-6">

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

                            {/* Email / Password form */}
                            <form className="space-y-5" onSubmit={handleAuth}>
                                {!isLogin && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">First Name</label>
                                            <input
                                                required type="text" value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                                                placeholder="John"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Last Name</label>
                                            <input
                                                required type="text" value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                                className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                                                placeholder="Doe"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1 ml-1">Email</label>
                                    <input
                                        required type="email" value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                                        placeholder="you@example.com"
                                    />
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-bold text-gray-700 ml-1">Password</label>
                                        {isLogin && (
                                            <Link to="/forgot-password" className="text-sm font-bold text-brand-green hover:underline mr-1">
                                                Forgot?
                                            </Link>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input
                                            required type={showPassword ? "text" : "password"} value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full px-4 pr-10 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                                            placeholder="••••••••"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                            ) : (
                                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                                            )}
                                        </button>
                                    </div>
                                    {!isLogin && (
                                        <p className="text-xs text-gray-400 mt-1 ml-1">Minimum 6 characters</p>
                                    )}
                                </div>

                                <button
                                    disabled={loading}
                                    type="submit"
                                    className="w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-sm text-lg font-bold text-white bg-brand-green hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green transition-colors disabled:opacity-70"
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Processing...</span>
                                    ) : (
                                        <>
                                            {isLogin ? 'Log In' : 'Sign Up'}
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

                {/* Toggle mode below the card */}
                {!successMessage && (
                    <div className="mt-2 text-center">
                        <button onClick={() => { setIsLogin(!isLogin); setError(null); setSuccessMessage(null); }} className="text-gray-600 font-medium hover:opacity-80 transition-opacity">
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                            <span className="text-brand-green font-bold">
                                {isLogin ? 'Sign Up' : 'Log In'}
                            </span>
                        </button>
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default Login;
