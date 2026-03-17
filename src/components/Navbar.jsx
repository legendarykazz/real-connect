import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Bell, CheckCircle2, XCircle, Info } from 'lucide-react';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const notifRef = useRef(null);

    // Close notifications click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch and subscribe to notifications
    useEffect(() => {
        if (!user) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        const fetchNotifications = async () => {
            // 1. Fetch the latest 10 notifications for the dropdown
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (!error && data) {
                setNotifications(data);
            }

            // 2. Fetch the TRUE total count of unread notifications (not just the last 10)
            const { count, error: countErr } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .or('is_read.eq.false,is_read.is.null'); // Handle both false and null for safety

            if (!countErr) {
                setUnreadCount(count || 0);
            }
        };

        fetchNotifications();

        // Subscribe to ALL changes (INSERT, UPDATE, DELETE) for this user's notifications
        // This ensures that marking as read in one tab updates all other open tabs instantly.
        const channel = supabase
            .channel(`notif_sync_${user.id}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${user.id}`
            }, () => {
                // On any change, just refresh the data to stay in sync
                fetchNotifications();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, [user]);

    const handleMarkAsRead = async (id) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', user?.id);
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user?.id)
            .or('is_read.eq.false,is_read.is.null');

        if (error) {
            console.error('[Notification Debug] Update Error:', error);
            alert('Failed to mark all as read. Check console or RLS.');
            // Revert optimistic update
            fetchNotifications();
        }
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleContactClick = () => {
        navigate('/contact');
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'approved': return <CheckCircle2 className="w-5 h-5 text-brand-green mt-0.5 shrink-0" />;
            case 'rejected': return <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />;
            default: return <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />;
        }
    };

    return (
        <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2 cursor-pointer">
                            <img src="/logo.png" alt="RealConnect Logo" className="h-10 w-auto object-contain" />
                        </Link>
                    </div>

                    <div className="hidden md:flex space-x-8 items-center">
                        <Link to="/browse" className="text-brand-dark hover:text-brand-green font-medium transition-colors">Browse Lands</Link>

                        {user ? (
                            <div className="flex items-center space-x-6">
                                <Link to="/list-property" className="text-brand-dark hover:text-brand-green font-medium transition-colors">List Property</Link>

                                {/* Notification Bell */}
                                <div className="relative" ref={notifRef}>
                                    <button
                                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        className="relative p-2 text-gray-500 hover:text-brand-green transition-colors rounded-full hover:bg-gray-100"
                                    >
                                        <Bell className="w-6 h-6" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Notification Dropdown */}
                                    {isNotificationsOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                                                <h3 className="font-bold text-gray-800">Notifications</h3>
                                                {unreadCount > 0 && (
                                                    <button onClick={handleMarkAllAsRead} className="text-xs text-brand-green font-medium hover:underline">
                                                        Mark all as read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                                                        No notifications yet.
                                                    </div>
                                                ) : (
                                                    <div className="divide-y divide-gray-50">
                                                        {notifications.map((notif) => (
                                                            <div
                                                                key={notif.id}
                                                                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                                                className={`p-4 flex gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                                            >
                                                                {getNotificationIcon(notif.type)}
                                                                <div>
                                                                    <p className={`text-sm mb-1 ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                                        {notif.title}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 leading-relaxed mb-1">
                                                                        {notif.message}
                                                                    </p>
                                                                    <p className="text-[10px] text-gray-400 font-medium">
                                                                        {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </p>
                                                                </div>
                                                                {!notif.is_read && (
                                                                    <span className="w-2 h-2 rounded-full bg-brand-green shrink-0 mt-1.5 ml-auto"></span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 font-medium transition-colors">Logout</button>
                            </div>
                        ) : (
                            <Link to="/login" className="text-brand-dark hover:text-brand-green font-medium transition-colors">Login</Link>
                        )}

                        <button onClick={handleContactClick} className="bg-brand-green text-white px-6 py-2.5 rounded-full font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200">
                            Contact Us
                        </button>
                    </div>

                    <div className="md:hidden flex items-center gap-4">
                        {/* Mobile Bell Icon */}
                        {user && (
                            <button
                                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                className="relative p-2 text-gray-500 hover:text-brand-green transition-colors"
                            >
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>
                        )}

                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-brand-dark hover:text-brand-green p-2 transition-colors">
                            {isMobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Notification Dropdown */}
                {user && isNotificationsOpen && (
                    <div className="md:hidden border-t border-gray-100 bg-white">
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <h3 className="font-bold text-gray-800">Notifications</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllAsRead} className="text-xs text-brand-green font-medium">Mark all as read</button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-8 text-center text-gray-400 text-sm">No notifications yet.</div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                            className={`p-4 flex gap-3 ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                                        >
                                            {getNotificationIcon(notif.type)}
                                            <div>
                                                <p className={`text-sm mb-1 ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                    {notif.title}
                                                </p>
                                                <p className="text-xs text-gray-500 leading-relaxed mb-1">{notif.message}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">
                                                    {new Date(notif.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden pb-6 border-t border-gray-100 pt-4 space-y-4 px-2">
                        <Link to="/browse" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-brand-dark hover:text-brand-green hover:bg-gray-50 rounded-md">Browse Lands</Link>

                        {user ? (
                            <>
                                <Link to="/list-property" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-brand-dark hover:text-brand-green hover:bg-gray-50 rounded-md">List Property</Link>
                                <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md">Logout</button>
                            </>
                        ) : (
                            <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-brand-dark hover:text-brand-green hover:bg-gray-50 rounded-md">Login</Link>
                        )}

                        <button onClick={() => { handleContactClick(); setIsMobileMenuOpen(false); }} className="w-full mt-2 bg-brand-green text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm">
                            Contact Us
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
