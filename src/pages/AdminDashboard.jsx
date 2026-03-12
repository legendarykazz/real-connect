import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, Users, Settings, Search, Bell, CheckCircle2,
    XCircle, ShieldCheck, MapPin, Menu, X, UploadCloud,
    UserCheck, UserX, Shield, Trash2, Plus, Save, AlertCircle, Home, Eye, Phone, Mail, FileDown, PlayCircle,
    MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import MapCoordinatePicker from '../components/MapCoordinatePicker';
import AdminVerifications from '../components/AdminVerifications';

// ---- ADMIN EMAILS (must match App.jsx) ----
const ADMIN_EMAILS = [
    'amjustsam28@gmail.com',
    'zephaniahmusa99@gmail.com',
];

const AdminDashboard = () => {
    const { user: currentAdmin } = useAuth();
    const [activeTab, setActiveTab] = useState('listings');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Listings state
    const [listings, setListings] = useState([]);
    const [listingsLoading, setListingsLoading] = useState(true);
    const [showPostForm, setShowPostForm] = useState(false);
    const [adminImages, setAdminImages] = useState([]);
    const [adminDocs, setAdminDocs] = useState([]);
    const [adminVideos, setAdminVideos] = useState([]);
    const [adminIsDragging, setAdminIsDragging] = useState(false);
    const [postSuccess, setPostSuccess] = useState(false);
    const [postLoading, setPostLoading] = useState(false);

    // Detail modal
    const [selectedListing, setSelectedListing] = useState(null);
    const [modalImageIdx, setModalImageIdx] = useState(0);

    const [toastMsg, setToastMsg] = useState(null);
    const [bellAlerts, setBellAlerts] = useState(0);
    const toastTimerRef = useRef(null);
    const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

    // Users state
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [togglingVerified, setTogglingVerified] = useState(null);
    const [togglingBlocked, setTogglingBlocked] = useState(null);

    // Users filters
    const [userSearch, setUserSearch] = useState('');
    const [sellersOnly, setSellersOnly] = useState(false);

    // Settings state
    const [adminList, setAdminList] = useState([...ADMIN_EMAILS]);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [settingsSaved, setSettingsSaved] = useState(false);
    const [siteSettings, setSiteSettings] = useState({
        siteName: 'RealConnect',
        requireEmailVerification: true,
        allowPublicListings: true,
        maintenanceMode: false,
    });

    // Inquiries/Messages state
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

    // New listing form
    const [newListing, setNewListing] = useState({
        location: '', size: '', price: '',
        propertyType: 'Residential', titleDocument: 'C of O', description: '',
        posterType: 'admin',  // 'admin' | 'agency'
        agencyName: '',
        isVerified: true,
        latitude: null,
        longitude: null,
    });

    // Helper to upload a file to Supabase Storage and return its public URL
    const uploadFile = async (file, folder) => {
        const ext = file.name.split('.').pop();
        const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('property-images').upload(path, file, { upsert: false });
        if (error) throw new Error('Upload failed: ' + error.message);
        return supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl;
    };

    // ---- FETCH LISTINGS ----
    const fetchListings = async () => {
        setListingsLoading(true);
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setListings(data || []);
        } catch (err) {
            console.error('Error fetching listings:', err);
        } finally {
            setListingsLoading(false);
        }
    };

    // ---- FETCH USERS (All registered users) ----
    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            // 1. Fetch ALL users from custom view
            const { data: allUsers, error: usersErr } = await supabase
                .from('admin_users_view')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersErr) throw usersErr;

            // 2. Count listings per user (for the "Listings" column)
            const { data: props, error: propsErr } = await supabase
                .from('properties')
                .select('user_id');

            if (propsErr) throw propsErr;

            // Group listings by user_id
            const listingCounts = {};
            (props || []).forEach(p => {
                listingCounts[p.user_id] = (listingCounts[p.user_id] || 0) + 1;
            });

            // 3. Format into our state array
            const formattedUsers = (allUsers || []).map(u => ({
                id: u.id,
                email: u.email,
                name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User',
                phone: u.phone || '—',
                joinedAt: u.created_at,
                isAdmin: ADMIN_EMAILS.includes(u.email),
                isVerified: u.is_verified,
                isBlocked: u.is_blocked || false,
                totalListings: listingCounts[u.id] || 0,
            }));

            setUsers(formattedUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setUsersLoading(false);
        }
    };

    // ---- FETCH CONTACT MESSAGES ----
    const fetchMessages = async () => {
        setMessagesLoading(true);
        try {
            const { data, error } = await supabase
                .from('contact_messages')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setMessages(data || []);
            setUnreadMessagesCount((data || []).filter(m => m.status === 'new').length);
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleUpdateMessageStatus = async (id, newStatus) => {
        // Optimistic update
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
        try {
            const { error } = await supabase
                .from('contact_messages')
                .update({ status: newStatus })
                .eq('id', id);
            if (error) throw error;
            setUnreadMessagesCount(prev => (newStatus === 'new' ? prev + 1 : Math.max(0, prev - 1)));
        } catch (err) {
            alert('Error updating message status: ' + err.message);
            fetchMessages();
        }
    };

    const handleDeleteMessage = async (id) => {
        if (!window.confirm('Delete this message permanently?')) return;
        try {
            const { error } = await supabase.from('contact_messages').delete().eq('id', id);
            if (error) throw error;
            setMessages(prev => prev.filter(m => m.id !== id));
            setUnreadMessagesCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            alert('Error deleting message: ' + err.message);
        }
    };

    // ---- TOGGLE USER VERIFIED ----
    const handleToggleVerified = async (u) => {
        setTogglingVerified(u.id);
        const newVal = !u.isVerified;
        // Optimistic UI update
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isVerified: newVal } : x));
        try {
            const { error } = await supabase
                .from('user_profiles')
                .upsert({ user_id: u.id, email: u.email, is_verified: newVal }, { onConflict: 'user_id' });
            if (error) throw error;
        } catch (err) {
            alert('Error updating verified status: ' + err.message);
            // Revert on error
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isVerified: u.isVerified } : x));
        } finally {
            setTogglingVerified(null);
        }
    };

    // ---- TOGGLE USER BLOCKED ----
    const handleToggleBlocked = async (u) => {
        // Prevent admins from blocking themselves or other admins
        if (u.isAdmin) return;

        setTogglingBlocked(u.id);
        const newVal = !u.isBlocked;
        // Optimistic UI update
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isBlocked: newVal } : x));
        try {
            const { error } = await supabase
                .from('user_profiles')
                .upsert({ user_id: u.id, email: u.email, is_blocked: newVal }, { onConflict: 'user_id' });
            if (error) throw error;
        } catch (err) {
            alert('Error toggling block status: ' + err.message);
            // Revert on error
            setUsers(prev => prev.map(x => x.id === u.id ? { ...x, isBlocked: u.isBlocked } : x));
        } finally {
            setTogglingBlocked(null);
        }
    };

    // ---- SET AVAILABILITY (Sold / Not Available) ----
    const handleSetAvailability = async (listingId, newValue) => {
        // Optimistic UI update
        setListings(prev =>
            prev.map(l => l.id === listingId ? { ...l, availability: newValue } : l)
        );
        try {
            const { error } = await supabase
                .from('properties')
                .update({ availability: newValue })
                .eq('id', listingId);
            if (error) throw error;
        } catch (err) {
            alert('Error updating availability: ' + err.message);
            // Revert on failure
            fetchListings();
        }
    };

    // ---- REALTIME SUBSCRIPTION ----
    useEffect(() => {
        fetchListings();

        // Fetch Verifications count
        const fetchPendingVerificationsCount = async () => {
            const { count } = await supabase
                .from('user_verifications')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');
            setPendingVerificationsCount(count || 0);
        };
        fetchPendingVerificationsCount();

        const channel = supabase
            .channel('admin-pending-alerts')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'properties' }, (payload) => {
                if (payload.new?.status === 'pending') {
                    fetchListings();
                    setToastMsg(`🏠 New property listing by ${payload.new.first_name || 'a user'}! Review now.`);
                    setBellAlerts(n => n + 1);
                    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                    toastTimerRef.current = setTimeout(() => setToastMsg(null), 7000);
                }
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_verifications' }, (payload) => {
                // Refresh count
                fetchPendingVerificationsCount();
                // Show toast
                setToastMsg(`🛡️ New KYC verification request submitted! Review now.`);
                setBellAlerts(n => n + 1);
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                toastTimerRef.current = setTimeout(() => setToastMsg(null), 7000);
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, (payload) => {
                setUnreadMessagesCount(n => n + 1);
                setToastMsg(`📩 New Inquiry from ${payload.new.name}! Check the Inquiries tab.`);
                setBellAlerts(n => n + 1);
                if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
                toastTimerRef.current = setTimeout(() => setToastMsg(null), 7000);
                if (activeTab === 'inquiries') fetchMessages();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'listings') setBellAlerts(0);
        if (activeTab === 'inquiries') {
            fetchMessages();
            setBellAlerts(0);
        }
    }, [activeTab]);

    // ---- APPROVE / REJECT ----
    const handleApproveListing = async (id) => {
        const { error } = await supabase.from('properties').update({ status: 'approved' }).eq('id', id);
        if (error) { alert('Error: ' + error.message); return; }
        fetchListings();
    };

    const handleRejectListing = async (id) => {
        const { error } = await supabase.from('properties').update({ status: 'rejected' }).eq('id', id);
        if (error) { alert('Error: ' + error.message); return; }
        fetchListings();
    };

    const handleDeleteListing = async (id) => {
        if (!window.confirm('Are you sure you want to delete this listing permanently?')) return;
        const { error } = await supabase.from('properties').delete().eq('id', id);
        if (error) { alert('Error: ' + error.message); return; }
        fetchListings();
    };


    // ---- ADMIN POST ----
    const handlePostSubmit = async (e) => {
        e.preventDefault();
        setPostLoading(true);
        try {
            // Upload all images (up to 4)
            const imageUrls = await Promise.all(
                adminImages.slice(0, 4).map(img => uploadFile(img.file, 'admin/images'))
            );
            // Upload all documents (up to 2)
            const docUrls = await Promise.all(
                adminDocs.slice(0, 2).map(doc => uploadFile(doc.file, 'admin/docs'))
            );
            // Upload all videos (up to 2)
            const videoUrls = await Promise.all(
                adminVideos.slice(0, 2).map(vid => uploadFile(vid.file, 'admin/videos'))
            );

            const posterName = newListing.posterType === 'agency'
                ? newListing.agencyName || 'Agency'
                : 'RealConnect Admin';

            const { error } = await supabase.from('properties').insert([{
                first_name: posterName,
                last_name: '',
                email: currentAdmin?.email || 'admin@realconnect.com',
                phone: '0000000',
                property_type: newListing.propertyType,
                location: newListing.location,
                size: newListing.size,
                price: newListing.price,
                title_document: newListing.titleDocument,
                description: newListing.description,
                status: 'approved',
                latitude: newListing.latitude,
                longitude: newListing.longitude,
                image_url: imageUrls[0] || null,
                image_urls: imageUrls,
                document_urls: docUrls,
                video_urls: videoUrls,
                poster_type: newListing.posterType,
                agency_name: newListing.posterType === 'agency' ? newListing.agencyName : null,
                is_verified: newListing.isVerified,
            }]);
            if (error) throw error;
            setShowPostForm(false);
            setAdminImages([]); setAdminDocs([]); setAdminVideos([]);
            setPostSuccess(true);
            setTimeout(() => setPostSuccess(false), 3000);
            setNewListing({ location: '', size: '', price: '', propertyType: 'Residential', titleDocument: 'C of O', description: '', posterType: 'admin', agencyName: '', isVerified: true, latitude: null, longitude: null });
            fetchListings();
        } catch (err) {
            alert('Error posting property: ' + err.message);
        } finally {
            setPostLoading(false);
        }
    };

    // ---- STATUS BADGE ----
    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            approved: 'bg-green-100 text-brand-green border-green-200',
            rejected: 'bg-red-100 text-red-600 border-red-200',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${styles[status] || styles.pending}`}>
                {status}
            </span>
        );
    };

    const pendingCount = listings.filter(l => l.status === 'pending').length;
    const tabBtn = (tab, icon, label, badge) => (
        <button
            onClick={() => { setActiveTab(tab); setIsMobileSidebarOpen(false); }}
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors text-sm font-medium ${activeTab === tab ? 'bg-brand-green/10 text-brand-green font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
        >
            {icon}
            {label}
            {badge > 0 && <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{badge}</span>}
        </button>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-brand-dark">

            {/* Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col`}>
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
                    <Link to="/" className="flex items-center">
                        <img src="/logo.png" alt="RealConnect" className="h-8 w-auto" />
                        <span className="ml-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Admin</span>
                    </Link>
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-gray-400"><X className="w-6 h-6" /></button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
                    {tabBtn('listings', <FileText className="w-5 h-5 mr-3" />, 'All Listings', pendingCount)}
                    {tabBtn('verifications', <ShieldCheck className="w-5 h-5 mr-3" />, 'Verifications', pendingVerificationsCount)}
                    {tabBtn('users', <Users className="w-5 h-5 mr-3" />, 'Users & Sellers', 0)}
                    {tabBtn('inquiries', <MessageSquare className="w-5 h-5 mr-3" />, 'Inquiries', unreadMessagesCount)}
                    {tabBtn('settings', <Settings className="w-5 h-5 mr-3" />, 'Platform Settings', 0)}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-brand-green flex items-center justify-center text-white font-bold text-sm">
                            {currentAdmin?.email?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{currentAdmin?.email?.split('@')[0] || 'Admin'}</p>
                            <p className="text-xs text-gray-500">Superadmin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Topbar */}
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
                    <div className="flex items-center flex-1 gap-4">
                        <button onClick={() => setIsMobileSidebarOpen(true)} className="md:hidden p-2 text-gray-500 hover:text-brand-dark rounded-lg hover:bg-gray-100">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-4 py-2 w-full max-w-md">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="Search listings, users..." className="bg-transparent border-none outline-none ml-2 w-full text-sm" />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {postSuccess && <span className="text-sm font-semibold text-brand-green bg-green-50 px-3 py-1.5 rounded-full">✅ Listing published!</span>}
                        <button
                            className="relative p-2 text-gray-400 hover:text-brand-dark"
                            onClick={() => { setBellAlerts(0); setActiveTab('listings'); }}
                            title="View pending listings"
                        >
                            <Bell className="w-6 h-6" />
                            {bellAlerts > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white">
                                    {bellAlerts}
                                </span>
                            )}
                            {bellAlerts === 0 && pendingCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">

                    {/* ===== LISTINGS TAB ===== */}
                    {activeTab === 'listings' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h1 className="text-2xl font-bold">Property Listings</h1>
                                    <p className="text-gray-500 text-sm mt-1">
                                        {pendingCount > 0 ? `⚠️ ${pendingCount} listing${pendingCount > 1 ? 's' : ''} awaiting approval` : 'All listings are reviewed'}
                                    </p>
                                </div>
                                <button onClick={() => setShowPostForm(!showPostForm)}
                                    className="bg-brand-green text-white px-4 py-2.5 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm text-sm">
                                    {showPostForm ? '✕ Cancel' : '+ Post New Listing'}
                                </button>
                            </div>

                            {/* Admin Post Form */}
                            {showPostForm && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                                    <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                                        <Plus className="w-5 h-5 text-brand-green" /> Post a New Listing
                                        <span className="ml-auto text-xs font-normal bg-green-100 text-brand-green px-3 py-1 rounded-full">Published immediately</span>
                                    </h2>
                                    <form onSubmit={handlePostSubmit} className="space-y-5">

                                        {/* ---- Poster Type ---- */}
                                        <div>
                                            <label className="text-xs font-bold text-gray-600 mb-2 block">Post As *</label>
                                            <div className="flex gap-3">
                                                {['admin', 'agency'].map(type => (
                                                    <button key={type} type="button"
                                                        onClick={() => setNewListing({ ...newListing, posterType: type })}
                                                        className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm capitalize transition-all ${newListing.posterType === type ? 'border-brand-green bg-green-50 text-brand-green' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                                        {type === 'admin' ? '🛡️ Admin' : '🏢 Agency'}
                                                    </button>
                                                ))}
                                            </div>
                                            {newListing.posterType === 'agency' && (
                                                <input
                                                    required value={newListing.agencyName}
                                                    onChange={e => setNewListing({ ...newListing, agencyName: e.target.value })}
                                                    placeholder="Agency name (e.g. Prime Lands Ltd)"
                                                    className="mt-3 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-green outline-none"
                                                />
                                            )}
                                        </div>

                                        {/* ---- Verification Badge ---- */}
                                        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                            <div>
                                                <p className="text-sm font-bold text-brand-dark">✅ Verified Badge</p>
                                                <p className="text-xs text-gray-500">Show "Verified" badge on this listing</p>
                                            </div>
                                            <button type="button"
                                                onClick={() => setNewListing({ ...newListing, isVerified: !newListing.isVerified })}
                                                className={`w-12 h-6 rounded-full relative transition-all duration-200 ${newListing.isVerified ? 'bg-brand-green' : 'bg-gray-300'}`}>
                                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${newListing.isVerified ? 'left-7' : 'left-1'}`} />
                                            </button>
                                        </div>

                                        {/* ---- Property Info Grid ---- */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div className="md:col-span-2 lg:col-span-3 space-y-1">
                                                <label className="text-xs font-bold text-gray-600">Location *</label>
                                                <input required value={newListing.location} onChange={e => setNewListing({ ...newListing, location: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-green outline-none"
                                                    placeholder="e.g. Plot 5, Lekki Phase 2, Lagos" />
                                            </div>
                                            <div className="md:col-span-2 lg:col-span-3">
                                                <MapCoordinatePicker
                                                    coordinates={{ lat: newListing.latitude, lng: newListing.longitude }}
                                                    setCoordinates={(pos) => setNewListing({ ...newListing, latitude: pos.lat, longitude: pos.lng })}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-600">Property Type *</label>
                                                <select required value={newListing.propertyType} onChange={e => setNewListing({ ...newListing, propertyType: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-brand-green outline-none">
                                                    <option>Residential</option><option>Commercial</option><option>Agricultural</option><option>Mixed Use</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-600">Title Document *</label>
                                                <select required value={newListing.titleDocument} onChange={e => setNewListing({ ...newListing, titleDocument: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-brand-green outline-none">
                                                    <option>C of O</option><option>Governor's Consent</option><option>Excision / Gazette</option><option>Registered Deed</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-600">Size (sqm) *</label>
                                                <input required value={newListing.size} onChange={e => setNewListing({ ...newListing, size: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-green outline-none" placeholder="e.g. 500" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-bold text-gray-600">Price (₦) *</label>
                                                <input required value={newListing.price} onChange={e => setNewListing({ ...newListing, price: e.target.value })}
                                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-green outline-none" placeholder="e.g. 25,000,000" />
                                            </div>
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-xs font-bold text-gray-600">Description</label>
                                                <textarea value={newListing.description} onChange={e => setNewListing({ ...newListing, description: e.target.value })}
                                                    rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-green outline-none resize-none" placeholder="Brief description about the land..." />
                                            </div>
                                        </div>

                                        {/* ---- Photos (up to 4) ---- */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">
                                                Photos <span className="text-gray-400 font-normal">— up to 4 images</span>
                                                <span className="ml-2 text-brand-green font-semibold">{adminImages.length}/4</span>
                                            </label>
                                            {adminImages.length < 4 && (
                                                <div onDrop={(e) => { e.preventDefault(); setAdminIsDragging(false); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')); const remaining = 4 - adminImages.length; setAdminImages(prev => [...prev, ...files.slice(0, remaining).map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }))]); }}
                                                    onDragOver={(e) => { e.preventDefault(); setAdminIsDragging(true); }} onDragLeave={() => setAdminIsDragging(false)}
                                                    className={`relative border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${adminIsDragging ? 'border-brand-green bg-green-50' : 'border-gray-200 hover:border-brand-green hover:bg-gray-50'}`}>
                                                    <input type="file" accept="image/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => { const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/')); const remaining = 4 - adminImages.length; setAdminImages(prev => [...prev, ...files.slice(0, remaining).map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }))]); }} />
                                                    <UploadCloud className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                                                    <p className="text-sm text-gray-500">Drag & drop or click to upload photos</p>
                                                </div>
                                            )}
                                            {adminImages.length > 0 && (
                                                <div className="grid grid-cols-4 gap-3">
                                                    {adminImages.map((img, i) => (
                                                        <div key={i} className={`relative rounded-xl overflow-hidden border group aspect-square ${i === 0 ? 'ring-2 ring-brand-green' : ''}`}>
                                                            <img src={img.preview} className="w-full h-full object-cover" alt={`photo ${i + 1}`} />
                                                            {i === 0 && <span className="absolute bottom-1 left-1 bg-brand-green text-white text-[9px] px-1.5 py-0.5 rounded font-bold">COVER</span>}
                                                            <button type="button" onClick={() => setAdminImages(p => p.filter((_, j) => j !== i))}
                                                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* ---- Documents (up to 2 PDFs) ---- */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">
                                                Documents <span className="text-gray-400 font-normal">— up to 2 PDF files (title docs, survey plans, etc.)</span>
                                                <span className="ml-2 text-brand-green font-semibold">{adminDocs.length}/2</span>
                                            </label>
                                            {adminDocs.length < 2 && (
                                                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer">
                                                    <input type="file" accept=".pdf,.doc,.docx" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => { const files = Array.from(e.target.files); const remaining = 2 - adminDocs.length; setAdminDocs(prev => [...prev, ...files.slice(0, remaining).map(f => ({ file: f, name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' }))]); }} />
                                                    <p className="text-sm text-gray-500">📄 Click to upload PDF / DOC files</p>
                                                </div>
                                            )}
                                            {adminDocs.length > 0 && (
                                                <div className="space-y-2">
                                                    {adminDocs.map((doc, i) => (
                                                        <div key={i} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5">
                                                            <span className="text-2xl">📄</span>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold truncate">{doc.name}</p>
                                                                <p className="text-xs text-gray-400">{doc.size}</p>
                                                            </div>
                                                            <button type="button" onClick={() => setAdminDocs(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* ---- Videos (up to 2) ---- */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-600">
                                                Videos <span className="text-gray-400 font-normal">— up to 2 (property tour, walkthrough, etc.)</span>
                                                <span className="ml-2 text-brand-green font-semibold">{adminVideos.length}/2</span>
                                            </label>
                                            {adminVideos.length < 2 && (
                                                <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-purple-400 hover:bg-purple-50 transition-colors cursor-pointer">
                                                    <input type="file" accept="video/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => { const files = Array.from(e.target.files); const remaining = 2 - adminVideos.length; setAdminVideos(prev => [...prev, ...files.slice(0, remaining).map(f => ({ file: f, name: f.name, size: (f.size / (1024 * 1024)).toFixed(1) + ' MB', preview: URL.createObjectURL(f) }))]); }} />
                                                    <p className="text-sm text-gray-500">🎬 Click to upload video files (MP4, MOV, etc.)</p>
                                                </div>
                                            )}
                                            {adminVideos.length > 0 && (
                                                <div className="grid grid-cols-2 gap-3">
                                                    {adminVideos.map((vid, i) => (
                                                        <div key={i} className="relative rounded-xl overflow-hidden border group bg-black aspect-video">
                                                            <video src={vid.preview} className="w-full h-full object-cover opacity-80" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="text-white text-2xl">▶</span>
                                                            </div>
                                                            <p className="absolute bottom-1 left-2 text-white text-[10px] font-semibold truncate max-w-[80%]">{vid.name}</p>
                                                            <button type="button" onClick={() => setAdminVideos(p => p.filter((_, j) => j !== i))}
                                                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-gray-100">
                                            <button type="submit" disabled={postLoading}
                                                className="bg-brand-green text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60 flex items-center gap-2">
                                                {postLoading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" /><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Publishing...</> : '🚀 Publish Live Listing'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Listings Table */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Property</th>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Submitter</th>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Price</th>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Status</th>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Availability</th>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {listingsLoading && (
                                                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading listings...</td></tr>
                                            )}
                                            {!listingsLoading && listings.length === 0 && (
                                                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No listings submitted yet.</td></tr>
                                            )}
                                            {!listingsLoading && listings.map(listing => (
                                                <tr key={listing.id} className={`hover:bg-gray-50/50 ${listing.status === 'pending' ? 'bg-yellow-50/30' : ''}`}>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {listing.image_url
                                                                ? <img src={listing.image_url} className="w-12 h-12 rounded-xl object-cover shrink-0" alt="property" />
                                                                : <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"><Home className="w-5 h-5 text-gray-300" /></div>
                                                            }
                                                            <div>
                                                                <p className="font-semibold text-sm text-brand-dark">{listing.location}</p>
                                                                <p className="text-xs text-gray-400">{listing.property_type} · {listing.size} sqm</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-sm">{listing.first_name} {listing.last_name}</p>
                                                        <p className="text-xs text-gray-400">{listing.email}</p>
                                                    </td>
                                                    <td className="px-5 py-4 font-bold text-brand-dark">₦{listing.price}</td>
                                                    <td className="px-5 py-4"><StatusBadge status={listing.status} /></td>
                                                    <td className="px-5 py-4">
                                                        {listing.status === 'approved' ? (
                                                            <select
                                                                value={listing.availability || 'available'}
                                                                onChange={(e) => handleSetAvailability(listing.id, e.target.value)}
                                                                className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${(listing.availability || 'available') === 'available'
                                                                    ? 'bg-green-50 text-brand-green border-green-200'
                                                                    : listing.availability === 'sold'
                                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                                        : 'bg-gray-100 text-gray-500 border-gray-200'
                                                                    }`}
                                                            >
                                                                <option value="available">✅ Available</option>
                                                                <option value="sold">🏷️ Sold</option>
                                                                <option value="not_available">❌ Not Available</option>
                                                            </select>
                                                        ) : (
                                                            <span className="text-xs text-gray-300 italic">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            {/* View details button */}
                                                            <button
                                                                onClick={() => { setSelectedListing(listing); setModalImageIdx(0); }}
                                                                className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-1.5 rounded-lg transition-colors"
                                                                title="View full details"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {listing.status === 'pending' && (
                                                                <>
                                                                    <button onClick={() => handleApproveListing(listing.id)}
                                                                        className="bg-green-100 text-brand-green hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                                                                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                                                    </button>
                                                                    <button onClick={() => handleRejectListing(listing.id)}
                                                                        className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
                                                                        <XCircle className="w-3.5 h-3.5" /> Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                            {listing.status === 'rejected' && (
                                                                <button onClick={() => handleApproveListing(listing.id)}
                                                                    className="bg-green-100 text-brand-green hover:bg-green-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                                    Re-approve
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleDeleteListing(listing.id)}
                                                                className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== VERIFICATIONS TAB ===== */}
                    {activeTab === 'verifications' && (
                        <AdminVerifications />
                    )}

                    {/* ===== USERS TAB ===== */}
                    {
                        activeTab === 'users' && (
                            <div>
                                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold">Users & Sellers</h1>
                                        <p className="text-gray-500 text-sm mt-1">Manage registered accounts and agency verifications</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                placeholder="Search name or email..."
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-green w-full sm:w-64"
                                            />
                                        </div>
                                        <button
                                            onClick={() => setSellersOnly(!sellersOnly)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors border ${sellersOnly ? 'bg-brand-green text-white border-brand-green' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <UserCheck className="w-4 h-4" />
                                            Sellers Only
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 border-b border-gray-100">
                                                <tr>
                                                    <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">User</th>
                                                    <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Phone</th>
                                                    <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Listings</th>
                                                    <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Role</th>
                                                    <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Verified</th>
                                                    <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Joined</th>
                                                    <th className="text-right px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {usersLoading && (
                                                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading users...</td></tr>
                                                )}
                                                {!usersLoading && users.length === 0 && (
                                                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">No users found.</td></tr>
                                                )}
                                                {!usersLoading && users
                                                    .filter(u => {
                                                        const matchSearch = (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
                                                            (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
                                                        const matchSeller = sellersOnly ? u.totalListings > 0 : true;
                                                        return matchSearch && matchSeller;
                                                    })
                                                    .map((u, i) => (
                                                        <tr key={i} className="hover:bg-gray-50/50">
                                                            <td className="px-5 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm shrink-0">
                                                                        {u.name?.[0]?.toUpperCase() || '?'}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold flex items-center gap-1.5">
                                                                            {u.name}
                                                                            {u.isVerified && <span title="Verified" className="text-brand-green">✅</span>}
                                                                        </p>
                                                                        <p className="text-xs text-gray-400">{u.email}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4 text-gray-600">{u.phone}</td>
                                                            <td className="px-5 py-4">
                                                                <span className="bg-gray-100 text-gray-700 font-bold px-2.5 py-1 rounded-full text-xs">{u.totalListings}</span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                {u.isAdmin
                                                                    ? <span className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100"><Shield className="w-3.5 h-3.5" />Admin</span>
                                                                    : <span className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full"><UserCheck className="w-3.5 h-3.5" />Seller</span>
                                                                }
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <button
                                                                    onClick={() => handleToggleVerified(u)}
                                                                    disabled={togglingVerified === u.id}
                                                                    title={u.isVerified ? 'Click to unverify' : 'Click to verify'}
                                                                    className={`w-12 h-6 rounded-full relative transition-all duration-200 disabled:opacity-50 ${u.isVerified ? 'bg-brand-green' : 'bg-gray-200'
                                                                        }`}
                                                                >
                                                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${u.isVerified ? 'left-7' : 'left-1'
                                                                        }`} />
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-4 text-gray-400 text-xs">
                                                                {new Date(u.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                            </td>
                                                            <td className="px-5 py-4 text-right">
                                                                {!u.isAdmin && (
                                                                    <button
                                                                        onClick={() => handleToggleBlocked(u)}
                                                                        disabled={togglingBlocked === u.id}
                                                                        className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors ${u.isBlocked
                                                                            ? 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                                                            : 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100'
                                                                            }`}
                                                                    >
                                                                        {togglingBlocked === u.id ? '...' : u.isBlocked ? 'Unblock' : 'Block User'}
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* ===== INQUIRIES TAB ===== */}
                    {activeTab === 'inquiries' && (
                        <div className="text-left">
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold">Inquiries & Messages</h1>
                                <p className="text-gray-500 text-sm mt-1">Manage contact form submissions from potential leads</p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Sender</th>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Subject / Message</th>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Date</th>
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Status</th>
                                                <th className="text-right px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {messagesLoading && (
                                                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading messages...</td></tr>
                                            )}
                                            {!messagesLoading && messages.length === 0 && (
                                                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No inquiries found.</td></tr>
                                            )}
                                            {!messagesLoading && messages.map((msg) => (
                                                <tr key={msg.id} className={`hover:bg-gray-50/50 ${msg.status === 'new' ? 'bg-blue-50/20' : ''}`}>
                                                    <td className="px-5 py-4 text-left">
                                                        <p className="font-bold text-brand-dark">{msg.name}</p>
                                                        <p className="text-xs text-gray-400">{msg.email}</p>
                                                        {msg.phone && <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" />{msg.phone}</p>}
                                                    </td>
                                                    <td className="px-5 py-4 max-w-xs md:max-w-md text-left">
                                                        <p className="font-semibold text-brand-dark truncate mb-1">{msg.subject || 'No Subject'}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{msg.message}</p>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs text-gray-400 text-left">
                                                        {new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}<br />
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-5 py-4 text-left">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${msg.status === 'new' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                            {msg.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 text-right">
                                                            {msg.status === 'new' ? (
                                                                <button
                                                                    onClick={() => handleUpdateMessageStatus(msg.id, 'replied')}
                                                                    className="bg-brand-green text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                                                                >
                                                                    Mark Replied
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleUpdateMessageStatus(msg.id, 'new')}
                                                                    className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                                                                >
                                                                    Mark New
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDeleteMessage(msg.id)}
                                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )
                    }

                    {/* ===== PLATFORM SETTINGS TAB ===== */}
                    {
                        activeTab === 'settings' && (
                            <div className="max-w-2xl">
                                <div className="mb-6">
                                    <h1 className="text-2xl font-bold">Platform Settings</h1>
                                    <p className="text-gray-500 text-sm mt-1">Manage admin access and platform preferences</p>
                                </div>

                                {settingsSaved && (
                                    <div className="mb-6 bg-green-50 border border-green-100 text-green-700 p-4 rounded-xl flex items-center gap-3">
                                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                                        <span className="text-sm font-semibold">Settings saved! You need to update App.jsx for admin email changes to take effect — see instructions below.</span>
                                    </div>
                                )}

                                {/* Admin Access */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                                    <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-purple-600" /> Admin Access
                                    </h2>
                                    <p className="text-sm text-gray-500 mb-5">These emails have full access to this admin dashboard.</p>

                                    <div className="space-y-3 mb-5">
                                        {adminList.map((email, i) => (
                                            <div key={i} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                        {email[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{email}</p>
                                                        {email === currentAdmin?.email && <p className="text-xs text-brand-green font-medium">You</p>}
                                                    </div>
                                                </div>
                                                {email !== currentAdmin?.email && (
                                                    <button onClick={() => setAdminList(adminList.filter((_, j) => j !== i))}
                                                        className="text-gray-300 hover:text-red-500 transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <input
                                            type="email"
                                            value={newAdminEmail}
                                            onChange={e => setNewAdminEmail(e.target.value)}
                                            placeholder="Enter email to add as admin"
                                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                                        />
                                        <button
                                            onClick={() => {
                                                if (newAdminEmail && !adminList.includes(newAdminEmail)) {
                                                    setAdminList([...adminList, newAdminEmail]);
                                                    setNewAdminEmail('');
                                                }
                                            }}
                                            className="bg-purple-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Add
                                        </button>
                                    </div>

                                    <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700">
                                        <strong>📌 Note:</strong> After adding/removing admins here, you also need to update the <code className="bg-blue-100 px-1 rounded">ADMIN_EMAILS</code> array in <code className="bg-blue-100 px-1 rounded">src/App.jsx</code> with the same emails, then push to GitHub for the change to take effect on the live site.
                                    </div>
                                </div>

                                {/* General settings */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                                    <h2 className="text-lg font-bold mb-5 flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-gray-500" /> General Settings
                                    </h2>
                                    <div className="space-y-5">
                                        {[
                                            { key: 'requireEmailVerification', label: 'Require Email Verification', desc: 'New users must verify their email before they can submit listings' },
                                            { key: 'allowPublicListings', label: 'Show Listings Publicly', desc: 'Approved listings are visible to all visitors without login' },
                                            { key: 'maintenanceMode', label: 'Maintenance Mode', desc: 'Temporarily disable public access to the site' },
                                        ].map(({ key, label, desc }) => (
                                            <div key={key} className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-brand-dark">{label}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => setSiteSettings(s => ({ ...s, [key]: !s[key] }))}
                                                    className={`shrink-0 w-12 h-6 rounded-full transition-all duration-200 relative ${siteSettings[key] ? 'bg-brand-green' : 'bg-gray-200'}`}
                                                >
                                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${siteSettings[key] ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => { setSettingsSaved(true); setTimeout(() => setSettingsSaved(false), 4000); }}
                                    className="flex items-center gap-2 bg-brand-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-900 transition-colors shadow-sm"
                                >
                                    <Save className="w-4 h-4" /> Save Settings
                                </button>
                            </div>
                        )
                    }
                </div>
            </main >

            {/* ===== TOAST NOTIFICATION ===== */}
            {
                toastMsg && (
                    <div className="fixed top-5 right-5 z-[200] max-w-sm">
                        <div className="bg-brand-dark text-white px-5 py-4 rounded-2xl shadow-2xl flex items-start gap-3 animate-slide-in">
                            <Bell className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold">{toastMsg}</p>
                                <button
                                    onClick={() => { setToastMsg(null); setBellAlerts(0); setActiveTab('listings'); }}
                                    className="text-xs text-green-400 font-bold mt-1 hover:underline"
                                >Go to Listings →</button>
                            </div>
                            <button onClick={() => setToastMsg(null)} className="text-gray-400 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )
            }

            {/* ===== DETAIL MODAL / DRAWER ===== */}
            {
                selectedListing && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                            onClick={() => setSelectedListing(null)}
                        />
                        {/* Panel */}
                        <aside className="fixed top-0 right-0 h-full w-full max-w-lg bg-white z-[110] shadow-2xl flex flex-col overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                                <div>
                                    <h2 className="text-lg font-bold text-brand-dark">Listing Details</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">ID: {selectedListing.id?.slice(0, 18)}…</p>
                                </div>
                                <button onClick={() => setSelectedListing(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-400">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Scrollable body */}
                            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                                {/* Image Gallery */}
                                {(() => {
                                    const imgs = selectedListing.image_urls?.length
                                        ? selectedListing.image_urls
                                        : selectedListing.image_url
                                            ? [selectedListing.image_url]
                                            : [];
                                    return imgs.length > 0 ? (
                                        <div>
                                            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video">
                                                <img src={imgs[modalImageIdx]} alt="property" className="w-full h-full object-cover" />
                                                {imgs.length > 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => setModalImageIdx(i => Math.max(0, i - 1))}
                                                            disabled={modalImageIdx === 0}
                                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-30"
                                                        >‹</button>
                                                        <button
                                                            onClick={() => setModalImageIdx(i => Math.min(imgs.length - 1, i + 1))}
                                                            disabled={modalImageIdx === imgs.length - 1}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-30"
                                                        >›</button>
                                                        <span className="absolute bottom-2 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">{modalImageIdx + 1}/{imgs.length}</span>
                                                    </>
                                                )}
                                            </div>
                                            {imgs.length > 1 && (
                                                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                                                    {imgs.map((url, i) => (
                                                        <button key={i} onClick={() => setModalImageIdx(i)}
                                                            className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${modalImageIdx === i ? 'border-brand-green' : 'border-transparent'}`}>
                                                            <img src={url} className="w-full h-full object-cover" alt={`thumb ${i}`} />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl bg-gray-100 aspect-video flex items-center justify-center">
                                            <Home className="w-12 h-12 text-gray-300" />
                                        </div>
                                    );
                                })()}

                                {/* Property Info */}
                                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="font-bold text-brand-dark text-base leading-snug">{selectedListing.location}</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">{selectedListing.property_type} · {selectedListing.size} sqm</p>
                                        </div>
                                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${selectedListing.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                            : selectedListing.status === 'approved' ? 'bg-green-100 text-brand-green border-green-200'
                                                : 'bg-red-100 text-red-600 border-red-200'
                                            }`}>{selectedListing.status}</span>
                                    </div>
                                    <p className="text-xl font-extrabold text-brand-dark">₦{selectedListing.price}</p>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="bg-white rounded-xl px-3 py-2">
                                            <p className="text-gray-400 mb-0.5">Title Document</p>
                                            <p className="font-semibold">{selectedListing.title_document || '—'}</p>
                                        </div>
                                        <div className="bg-white rounded-xl px-3 py-2">
                                            <p className="text-gray-400 mb-0.5">Availability</p>
                                            <p className="font-semibold capitalize">{selectedListing.availability || 'Available'}</p>
                                        </div>
                                    </div>
                                    {selectedListing.description && (
                                        <div>
                                            <p className="text-xs font-bold text-gray-500 mb-1">Description</p>
                                            <p className="text-sm text-gray-600 leading-relaxed">{selectedListing.description}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Submitter Contact */}
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Submitter Contact</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                                            <div className="w-9 h-9 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold shrink-0">
                                                {selectedListing.first_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <p className="font-semibold text-sm">{selectedListing.first_name} {selectedListing.last_name}</p>
                                        </div>
                                        <a href={`mailto:${selectedListing.email}`}
                                            className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 hover:bg-blue-50 transition-colors group">
                                            <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                            <span className="text-sm text-gray-700 group-hover:text-blue-600">{selectedListing.email}</span>
                                        </a>
                                        {selectedListing.phone && (
                                            <a href={`tel:${selectedListing.phone}`}
                                                className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 hover:bg-green-50 transition-colors group">
                                                <Phone className="w-4 h-4 text-gray-400 group-hover:text-brand-green" />
                                                <span className="text-sm text-gray-700 group-hover:text-brand-green">{selectedListing.phone}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>

                                {/* Documents */}
                                {selectedListing.document_urls?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Documents</p>
                                        <div className="space-y-2">
                                            {selectedListing.document_urls.map((url, i) => (
                                                <a key={i} href={url} target="_blank" rel="noreferrer"
                                                    className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 hover:bg-blue-100 transition-colors">
                                                    <FileDown className="w-4 h-4 text-blue-500" />
                                                    <span className="text-sm font-medium text-blue-700 truncate">Document {i + 1}</span>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Videos */}
                                {selectedListing.video_urls?.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Videos</p>
                                        <div className="space-y-3">
                                            {selectedListing.video_urls.map((url, i) => (
                                                <div key={i} className="rounded-2xl overflow-hidden bg-black aspect-video">
                                                    <video src={url} controls className="w-full h-full" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Submission date */}
                                <p className="text-xs text-gray-400 text-center">
                                    Submitted {new Date(selectedListing.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {/* Footer actions */}
                            {selectedListing.status === 'pending' && (
                                <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-3">
                                    <button
                                        onClick={async () => { await handleApproveListing(selectedListing.id); setSelectedListing(null); }}
                                        className="flex-1 bg-brand-green text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Approve Listing
                                    </button>
                                    <button
                                        onClick={async () => { await handleRejectListing(selectedListing.id); setSelectedListing(null); }}
                                        className="flex-1 bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                            )}
                            {selectedListing.status === 'rejected' && (
                                <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white">
                                    <button
                                        onClick={async () => { await handleApproveListing(selectedListing.id); setSelectedListing(null); }}
                                        className="w-full bg-brand-green text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Re-approve Listing
                                    </button>
                                </div>
                            )}
                        </aside>
                    </>
                )
            }
        </div >
    );
};

export default AdminDashboard;
