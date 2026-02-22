import React, { useState, useCallback } from 'react';
import {
    LayoutDashboard, Users, FileText, Settings,
    Search, Bell, ChevronDown, CheckCircle2,
    XCircle, MoreVertical, ShieldCheck, MapPin, Menu, X, UploadCloud
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

const AdminDashboard = () => {
    const { agencies, toggleAgencyTrust, addAgency, editAgency } = useAppContext();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adminImages, setAdminImages] = useState([]); // For admin post form drag-and-drop
    const [adminIsDragging, setAdminIsDragging] = useState(false);
    const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'agencies'
    const [showPostForm, setShowPostForm] = useState(false);
    const [showAgencyForm, setShowAgencyForm] = useState(false);
    const [editingAgencyId, setEditingAgencyId] = useState(null);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const [agencyFormData, setAgencyFormData] = useState({
        name: '',
        contact: ''
    });

    // Fetch listings from Supabase
    const fetchListings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setListings(data || []);
        } catch (error) {
            console.error('Error fetching listings:', error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchListings();
    }, []);

    const handleApproveListing = async (id) => {
        try {
            const { error } = await supabase
                .from('properties')
                .update({ status: 'approved' })
                .eq('id', id);

            if (error) throw error;
            fetchListings(); // Refresh list
        } catch (error) {
            alert('Failed to approve property: ' + error.message);
        }
    };

    const handleRejectListing = async (id) => {
        try {
            const { error } = await supabase
                .from('properties')
                .update({ status: 'rejected' })
                .eq('id', id);

            if (error) throw error;
            fetchListings(); // Refresh list
        } catch (error) {
            alert('Failed to reject property: ' + error.message);
        }
    };

    const handleAgencySubmit = (e) => {
        e.preventDefault();
        if (editingAgencyId) {
            editAgency({ ...agencyFormData, id: editingAgencyId });
        } else {
            addAgency(agencyFormData);
        }
        setShowAgencyForm(false);
        setEditingAgencyId(null);
        setAgencyFormData({ name: '', contact: '' });
    };

    const handleEditAgencyClick = (agency) => {
        setAgencyFormData(agency);
        setEditingAgencyId(agency.id);
        setShowAgencyForm(true);
    };

    // Quick form state for admin posting
    const [newListing, setNewListing] = useState({
        title: '',
        location: '',
        size: '',
        price: '',
        propertyType: 'Residential',
        titleDocument: 'C of O',
        description: '',
        image: 'https://images.unsplash.com/photo-1518557984649-0d36c5339c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        images: [],
        documents: [],
        features: ['Verified by Admin'],
        status: 'Approved',
        agencyId: 'Admin',
        submitter: 'Admin Post',
    });

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        let imageUrl = newListing.image; // Default fallback image
        try {
            // Upload image if one was dropped
            if (adminImages.length > 0) {
                const img = adminImages[0];
                const fileExt = img.name.split('.').pop();
                const fileName = `admin/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(fileName, img.file, { upsert: true });

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('property-images')
                        .getPublicUrl(fileName);
                    imageUrl = publicUrl;
                }
            }
            const { error } = await supabase
                .from('properties')
                .insert([{
                    first_name: 'Admin',
                    last_name: 'User',
                    email: 'admin@realconnect.com',
                    phone: '0000000',
                    property_type: newListing.propertyType,
                    location: newListing.location,
                    size: newListing.size,
                    price: newListing.price,
                    title_document: newListing.titleDocument,
                    description: newListing.description,
                    status: 'approved',
                    image_url: imageUrl
                }]);

            if (error) throw error;

            setShowPostForm(false);
            fetchListings();
            setNewListing({
                title: '', location: '', size: '', price: '', propertyType: 'Residential',
                titleDocument: 'C of O', description: '',
                image: 'https://images.unsplash.com/photo-1518557984649-0d36c5339c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                images: [], documents: [], features: ['Verified by Admin'],
                status: 'Approved', agencyId: 'Admin', submitter: 'Admin Post',
            });
        } catch (error) {
            alert('Error posting property: ' + error.message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-brand-dark">

            {/* Sidebar Overlay */}
            {isMobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-gray-200 flex-col z-50 transform transition-transform duration-300 ease-in-out ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex`}>
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
                    <Link to="/" className="flex items-center">
                        <img src="/logo.png" alt="RealConnect" className="h-8 w-auto" />
                        <span className="ml-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Admin</span>
                    </Link>
                    <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto">
                    <button
                        onClick={() => { setActiveTab('listings'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'listings' ? 'bg-brand-green/10 text-brand-green font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <FileText className="w-5 h-5 mr-3" />
                        Pending Listings
                        {listings.filter(l => l.status === 'pending').length > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {listings.filter(l => l.status === 'pending').length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => { setActiveTab('agencies'); setIsMobileSidebarOpen(false); }}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-colors ${activeTab === 'agencies' ? 'bg-brand-green/10 text-brand-green font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        <Users className="w-5 h-5 mr-3" />
                        Agencies & Users
                    </button>
                    <button className="w-full flex items-center px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors">
                        <Settings className="w-5 h-5 mr-3" />
                        Platform Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-brand-dark-blue flex items-center justify-center text-white font-bold">
                            AD
                        </div>
                        <div>
                            <p className="text-sm font-bold">Admin User</p>
                            <p className="text-xs text-gray-500">Superadmin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">

                {/* Topbar */}
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-8 shrink-0">
                    <div className="flex items-center flex-1">
                        <button
                            onClick={() => setIsMobileSidebarOpen(true)}
                            className="mr-4 p-2 -ml-2 text-gray-500 hover:text-brand-dark md:hidden transition-colors rounded-lg hover:bg-gray-100"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-full max-w-md hidden sm:flex">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input type="text" placeholder="Search properties, users, IDs..." className="bg-transparent border-none outline-none ml-2 w-full text-sm" />
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <button className="sm:hidden relative p-2 text-gray-400 hover:text-brand-dark transition-colors">
                            <Search className="w-6 h-6" />
                        </button>
                        <button className="relative p-2 text-gray-400 hover:text-brand-dark transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Dashboard Area */}
                <div className="flex-1 overflow-auto p-8">

                    <div className="mb-8 flex justify-between items-end">
                        <div>
                            <h1 className="text-3xl font-bold text-brand-dark mb-2">
                                {activeTab === 'listings' ? 'Property Listings Approval' : 'Agency Verification Management'}
                            </h1>
                            <p className="text-gray-500">
                                {activeTab === 'listings' ? 'Review and approve newly submitted land properties.' : 'Manage platform users and grant Trusted Agency status.'}
                            </p>
                        </div>
                        {activeTab === 'listings' && (
                            <button
                                onClick={() => setShowPostForm(!showPostForm)}
                                className="bg-brand-green text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm"
                            >
                                {showPostForm ? 'Cancel' : '+ Post New Listing'}
                            </button>
                        )}
                        {activeTab === 'agencies' && (
                            <button
                                onClick={() => {
                                    setShowAgencyForm(!showAgencyForm);
                                    if (showAgencyForm) {
                                        setEditingAgencyId(null);
                                        setAgencyFormData({ name: '', contact: '' });
                                    }
                                }}
                                className="bg-brand-green text-white px-5 py-2.5 rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm"
                            >
                                {showAgencyForm ? 'Cancel' : '+ Add New Agency'}
                            </button>
                        )}
                    </div>

                    {/* Admin Post Form */}
                    {showPostForm && activeTab === 'listings' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
                            <h2 className="text-xl font-bold mb-6">Post a pre-approved listing</h2>
                            <form onSubmit={handlePostSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Property Title *</label>
                                    <input required type="text" placeholder="Title" value={newListing.title} onChange={e => setNewListing({ ...newListing, title: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Location *</label>
                                    <input required type="text" placeholder="Location" value={newListing.location} onChange={e => setNewListing({ ...newListing, location: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Size (sqm) *</label>
                                    <input required type="text" placeholder="Size (e.g. 500 sqm)" value={newListing.size} onChange={e => setNewListing({ ...newListing, size: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Price (₦) *</label>
                                    <input required type="text" placeholder="Price (e.g. ₦50,000,000)" value={newListing.price} onChange={e => setNewListing({ ...newListing, price: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-green outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Property Type *</label>
                                    <select name="propertyType" value={newListing.propertyType} onChange={e => setNewListing({ ...newListing, propertyType: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-brand-green outline-none">
                                        <option>Residential</option>
                                        <option>Commercial</option>
                                        <option>Mixed Use</option>
                                        <option>Agricultural</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Title Document *</label>
                                    <select name="titleDocument" value={newListing.titleDocument} onChange={e => setNewListing({ ...newListing, titleDocument: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-brand-green outline-none">
                                        <option>C of O</option>
                                        <option>Governor's Consent</option>
                                        <option>Excision / Gazette</option>
                                        <option>Registered Deed</option>
                                        <option>Other</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2 lg:col-span-3 space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Property Description *</label>
                                    <textarea required rows="3" placeholder="Describe the land, features, neighborhood..." value={newListing.description} onChange={e => setNewListing({ ...newListing, description: e.target.value })} className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-brand-green outline-none"></textarea>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-bold text-gray-700">Agency / Submitter *</label>
                                    <select
                                        required
                                        className="w-full border border-gray-200 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-brand-green outline-none"
                                        value={newListing.agencyId}
                                        onChange={e => {
                                            if (e.target.value === 'Admin') {
                                                setNewListing({
                                                    ...newListing,
                                                    agencyId: 'Admin',
                                                    submitter: 'Admin Post'
                                                });
                                            } else {
                                                const selectedAgency = agencies.find(a => a.id === e.target.value);
                                                setNewListing({
                                                    ...newListing,
                                                    agencyId: selectedAgency.id,
                                                    submitter: selectedAgency.name
                                                });
                                            }
                                        }}
                                    >
                                        <option value="" disabled>Select Agency/Submitter</option>
                                        <option value="Admin">Post as Admin</option>
                                        {agencies.map(agency => (
                                            <option key={agency.id} value={agency.id}>{agency.name}</option>
                                        ))}
                                    </select>
                                </div>


                                {/* Drag & Drop Image Zone for Admin */}
                                <div className="md:col-span-2 lg:col-span-3 space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Upload Property Photo (Drag & Drop)</label>
                                    <div
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            setAdminIsDragging(false);
                                            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                                            setAdminImages(files.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name })));
                                        }}
                                        onDragOver={(e) => { e.preventDefault(); setAdminIsDragging(true); }}
                                        onDragLeave={() => setAdminIsDragging(false)}
                                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${adminIsDragging ? 'border-brand-green bg-green-50' : 'border-gray-200 hover:border-brand-green hover:bg-gray-50'}`}
                                    >
                                        <input
                                            type="file" accept="image/*" multiple
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
                                                setAdminImages(files.map(f => ({ file: f, preview: URL.createObjectURL(f), name: f.name })));
                                            }}
                                        />
                                        <UploadCloud className={`w-8 h-8 mx-auto mb-2 ${adminIsDragging ? 'text-brand-green' : 'text-gray-400'}`} />
                                        <p className="text-sm font-semibold text-gray-500">
                                            {adminImages.length > 0 ? `${adminImages.length} photo(s) selected` : (adminIsDragging ? 'Drop image here!' : 'Drag & drop or click to browse')}
                                        </p>
                                    </div>
                                    {/* Admin Image Previews */}
                                    {adminImages.length > 0 && (
                                        <div className="flex gap-3 mt-2 flex-wrap">
                                            {adminImages.map((img, i) => (
                                                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 group">
                                                    <img src={img.preview} className="w-full h-full object-cover" alt="preview" />
                                                    <button type="button" onClick={() => setAdminImages(prev => prev.filter((_, j) => j !== i))}
                                                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <X className="w-4 h-4 text-white" />
                                                    </button>
                                                    {i === 0 && <span className="absolute bottom-0.5 left-0.5 bg-brand-green text-white text-[9px] px-1 rounded font-bold">Cover</span>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2 lg:col-span-3 pt-4 border-t border-gray-100">
                                    <button type="submit" className="w-full bg-brand-dark-blue text-white py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors shadow-md">
                                        Publish Live Listing
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* --- LISTINGS VIEW --- */}
                    {activeTab === 'listings' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                                        <th className="px-6 py-4 font-semibold">Property</th>
                                        <th className="px-6 py-4 font-semibold">Submitter</th>
                                        <th className="px-6 py-4 font-semibold">Expected Price</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 justify-end flex font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan="5" className="text-center py-8 text-gray-500">Loading listings...</td></tr>
                                    ) : listings.map((listing) => (
                                        <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-brand-dark">{listing.property_type} in {listing.location}</p>
                                                <p className="text-sm text-gray-500 font-mono mt-1">{listing.id.substring(0, 8)} • {new Date(listing.created_at).toLocaleDateString()}</p>
                                            </td>
                                            <td className="px-6 py-4 text-gray-700">{listing.first_name} {listing.last_name}</td>
                                            <td className="px-6 py-4 font-semibold text-brand-dark">₦ {listing.price}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${listing.status === 'approved' ? 'bg-green-50 text-brand-green border-green-200' :
                                                    listing.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-200' :
                                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                    }`}>
                                                    {listing.status === 'approved' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                                    {listing.status === 'rejected' && <XCircle className="w-3 h-3 mr-1" />}
                                                    <span className="capitalize">{listing.status}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => alert(`Details:\n\nLocation: ${listing.location}\nType: ${listing.property_type}\nDesc: ${listing.description}\nContact: ${listing.phone} / ${listing.email}`)} className="px-3 py-1.5 text-sm font-semibold text-brand-light-blue hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                                                        Review
                                                    </button>
                                                    {listing.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleApproveListing(listing.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100" title="Approve">
                                                                <CheckCircle2 className="w-5 h-5" />
                                                            </button>
                                                            <button onClick={() => handleRejectListing(listing.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Reject">
                                                                <XCircle className="w-5 h-5" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* --- AGENCIES VIEW --- */}
                    {activeTab === 'agencies' && (
                        <>
                            {showAgencyForm && (
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
                                    <h2 className="text-lg font-bold mb-4">{editingAgencyId ? 'Edit Agency' : 'Add New Agency'}</h2>
                                    <form onSubmit={handleAgencySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <input required type="text" placeholder="Agency Name" value={agencyFormData.name} onChange={e => setAgencyFormData({ ...agencyFormData, name: e.target.value })} className="border border-gray-200 p-2 rounded-lg" />
                                        <input required type="email" placeholder="Contact Email" value={agencyFormData.contact} onChange={e => setAgencyFormData({ ...agencyFormData, contact: e.target.value })} className="border border-gray-200 p-2 rounded-lg" />
                                        <button type="submit" className="md:col-span-2 bg-brand-dark-blue text-white py-2 rounded-lg font-bold hover:bg-blue-900 transition-colors">
                                            {editingAgencyId ? 'Save Changes' : 'Create Agency'}
                                        </button>
                                    </form>
                                </div>
                            )}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider border-b border-gray-200">
                                            <th className="px-6 py-4 font-semibold">Agency Name</th>
                                            <th className="px-6 py-4 font-semibold">Contact Email</th>
                                            <th className="px-6 py-4 font-semibold">Joined</th>
                                            <th className="px-6 py-4 font-semibold text-center">Trusted Verification Route</th>
                                            <th className="px-6 py-4 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {agencies.map((agency) => (
                                            <tr key={agency.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <p className="font-bold text-brand-dark flex items-center">
                                                            {agency.name}
                                                            {agency.isTrusted && (
                                                                <ShieldCheck className="w-4 h-4 text-brand-light-blue ml-1.5" title="Trusted Agency" />
                                                            )}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-gray-500 font-mono mt-1">{agency.id}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{agency.contact}</td>
                                                <td className="px-6 py-4 text-gray-500">{agency.joined}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center">
                                                        {/* Toggle Switch */}
                                                        <button
                                                            onClick={() => toggleAgencyTrust(agency.id)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-green focus:ring-offset-2 ${agency.isTrusted ? 'bg-brand-green' : 'bg-gray-200'}`}
                                                        >
                                                            <span className="sr-only">Toggle trusted status</span>
                                                            <span
                                                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${agency.isTrusted ? 'translate-x-6' : 'translate-x-1'}`}
                                                            />
                                                        </button>
                                                        <span className={`ml-3 text-sm font-semibold w-20 ${agency.isTrusted ? 'text-brand-green' : 'text-gray-400'}`}>
                                                            {agency.isTrusted ? 'Verified' : 'Unverified'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleEditAgencyClick(agency)} className="text-sm font-semibold text-brand-light-blue hover:underline">
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
