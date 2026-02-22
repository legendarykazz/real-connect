import React, { useState, useEffect } from 'react';
import {
    FileText, Users, Settings, Search, Bell, CheckCircle2,
    XCircle, ShieldCheck, MapPin, Menu, X, UploadCloud,
    UserCheck, UserX, Shield, Trash2, Plus, Save, AlertCircle, Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
    const [adminIsDragging, setAdminIsDragging] = useState(false);
    const [postSuccess, setPostSuccess] = useState(false);

    // Users state
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);

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

    // New listing form
    const [newListing, setNewListing] = useState({
        location: '', size: '', price: '',
        propertyType: 'Residential', titleDocument: 'C of O', description: '',
    });

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

    // ---- FETCH USERS (from properties submitters) ----
    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            // Get unique submitters from properties table
            const { data, error } = await supabase
                .from('properties')
                .select('email, first_name, last_name, phone, user_id, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Deduplicate by email
            const uniqueUsers = [];
            const seen = new Set();
            (data || []).forEach(p => {
                if (!seen.has(p.email)) {
                    seen.add(p.email);
                    uniqueUsers.push({
                        id: p.user_id,
                        email: p.email,
                        name: `${p.first_name} ${p.last_name}`,
                        phone: p.phone,
                        joinedAt: p.created_at,
                        isAdmin: ADMIN_EMAILS.includes(p.email),
                        totalListings: (data || []).filter(x => x.email === p.email).length,
                    });
                }
            });
            setUsers(uniqueUsers);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setUsersLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
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
        let imageUrl = null;
        try {
            if (adminImages.length > 0) {
                const img = adminImages[0];
                const fileExt = img.name.split('.').pop();
                const fileName = `admin/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(fileName, img.file, { upsert: true });
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('property-images').getPublicUrl(fileName);
                    imageUrl = publicUrl;
                }
            }
            const { error } = await supabase.from('properties').insert([{
                first_name: 'RealConnect',
                last_name: 'Admin',
                email: currentAdmin?.email || 'admin@realconnect.com',
                phone: '0000000',
                property_type: newListing.propertyType,
                location: newListing.location,
                size: newListing.size,
                price: newListing.price,
                title_document: newListing.titleDocument,
                description: newListing.description,
                status: 'approved',
                image_url: imageUrl,
            }]);
            if (error) throw error;
            setShowPostForm(false);
            setAdminImages([]);
            setPostSuccess(true);
            setTimeout(() => setPostSuccess(false), 3000);
            setNewListing({ location: '', size: '', price: '', propertyType: 'Residential', titleDocument: 'C of O', description: '' });
            fetchListings();
        } catch (err) {
            alert('Error posting property: ' + err.message);
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
                    {tabBtn('users', <Users className="w-5 h-5 mr-3" />, 'Users & Sellers', 0)}
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
                        <button className="relative p-2 text-gray-400 hover:text-brand-dark">
                            <Bell className="w-6 h-6" />
                            {pendingCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
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
                                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Plus className="w-5 h-5 text-brand-green" /> Post a New Listing (Published immediately)
                                    </h2>
                                    <form onSubmit={handlePostSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div className="md:col-span-2 lg:col-span-3 space-y-1">
                                            <label className="text-xs font-bold text-gray-600">Location *</label>
                                            <input required value={newListing.location} onChange={e => setNewListing({ ...newListing, location: e.target.value })}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-green outline-none"
                                                placeholder="e.g. Plot 5, Lekki Phase 2, Lagos" />
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
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-600">Description</label>
                                            <input value={newListing.description} onChange={e => setNewListing({ ...newListing, description: e.target.value })}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-brand-green outline-none" placeholder="Brief description..." />
                                        </div>

                                        {/* Drag & Drop */}
                                        <div className="md:col-span-2 lg:col-span-3 space-y-2">
                                            <label className="text-xs font-bold text-gray-600">Property Photo</label>
                                            <div onDrop={(e) => { e.preventDefault(); setAdminIsDragging(false); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')); setAdminImages(files.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }))); }}
                                                onDragOver={(e) => { e.preventDefault(); setAdminIsDragging(true); }}
                                                onDragLeave={() => setAdminIsDragging(false)}
                                                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${adminIsDragging ? 'border-brand-green bg-green-50' : 'border-gray-200 hover:border-brand-green'}`}>
                                                <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    onChange={(e) => { const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/')); setAdminImages(files.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name }))); }} />
                                                <UploadCloud className={`w-7 h-7 mx-auto mb-1.5 ${adminIsDragging ? 'text-brand-green' : 'text-gray-400'}`} />
                                                <p className="text-sm text-gray-500">{adminImages.length > 0 ? `${adminImages.length} photo selected` : 'Drag & drop or click to upload'}</p>
                                            </div>
                                            {adminImages.length > 0 && (
                                                <div className="flex gap-3 flex-wrap mt-2">
                                                    {adminImages.map((img, i) => (
                                                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border group">
                                                            <img src={img.preview} className="w-full h-full object-cover" alt="preview" />
                                                            <button type="button" onClick={() => setAdminImages(p => p.filter((_, j) => j !== i))}
                                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                                                <X className="w-4 h-4 text-white" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="md:col-span-2 lg:col-span-3 pt-2 border-t border-gray-100">
                                            <button type="submit" className="bg-brand-green text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-sm">
                                                🚀 Publish Live Listing
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
                                                        <div className="flex items-center gap-2">
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

                    {/* ===== USERS TAB ===== */}
                    {activeTab === 'users' && (
                        <div>
                            <div className="mb-6">
                                <h1 className="text-2xl font-bold">Users & Sellers</h1>
                                <p className="text-gray-500 text-sm mt-1">Everyone who has submitted a property listing</p>
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
                                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Joined</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {usersLoading && (
                                                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading users...</td></tr>
                                            )}
                                            {!usersLoading && users.length === 0 && (
                                                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No users have submitted listings yet.</td></tr>
                                            )}
                                            {!usersLoading && users.map((u, i) => (
                                                <tr key={i} className="hover:bg-gray-50/50">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center font-bold text-sm shrink-0">
                                                                {u.name?.[0]?.toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">{u.name}</p>
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
                                                    <td className="px-5 py-4 text-gray-400 text-xs">
                                                        {new Date(u.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ===== PLATFORM SETTINGS TAB ===== */}
                    {activeTab === 'settings' && (
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
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
