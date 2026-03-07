import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, Search, Eye, Filter, ShieldCheck, FileText, Image as ImageIcon } from 'lucide-react';

const AdminVerifications = () => {
    const [verifications, setVerifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending'); // 'pending', 'approved', 'rejected'
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [secureUrls, setSecureUrls] = useState({ idDoc: null, addressDoc: null, selfie: null });
    const [loadingUrls, setLoadingUrls] = useState(false);


    const fetchVerifications = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_verifications')
                .select(`
                    id,
                    user_id,
                    status,
                    full_name,
                    address,
                    email,
                    phone,
                    id_type,
                    id_number,
                    id_document_url,
                    address_document_url,
                    selfie_url,
                    rejection_reason,
                    created_at,
                    updated_at
                `)
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setVerifications(data || []);
        } catch (err) {
            console.error('Error fetching verifications:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVerifications();
    }, []);

    const filteredRequests = verifications.filter(v => v.status === filter);

    const getSecureUrl = async (urlOrPath) => {
        if (!urlOrPath) return null;
        let path = urlOrPath;
        if (urlOrPath.includes('/kyc_documents/')) {
            path = urlOrPath.split('/kyc_documents/')[1];
        }
        try {
            const { data, error } = await supabase.storage.from('kyc_documents').createSignedUrl(path, 60 * 60); // 1 hour
            if (error) {
                console.error('Error generating signed URL:', error);
                return null;
            }
            return data.signedUrl;
        } catch (err) {
            console.error('Catch error generating signed URL:', err);
            return null;
        }
    };

    const handleSelectRequest = async (req) => {
        setSelectedRequest(req);
        setLoadingUrls(true);
        setSecureUrls({ idDoc: null, addressDoc: null, selfie: null });

        const [idDoc, addressDoc, selfie] = await Promise.all([
            getSecureUrl(req.id_document_url),
            getSecureUrl(req.address_document_url),
            getSecureUrl(req.selfie_url)
        ]);

        setSecureUrls({ idDoc, addressDoc, selfie });
        setLoadingUrls(false);
    };

    const handleApprove = async (id, userId) => {
        if (!window.confirm('Are you sure you want to approve this verification?')) return;
        setActionLoading(true);

        try {
            // Update verification status
            const { error: verifyErr } = await supabase
                .from('user_verifications')
                .update({ status: 'approved', rejection_reason: null })
                .eq('id', id);

            if (verifyErr) throw verifyErr;

            // Update user_profiles is_verified
            const { error: profileErr } = await supabase
                .from('user_profiles')
                .update({ is_verified: true })
                .eq('user_id', userId);

            if (profileErr) throw profileErr;

            // Send Notification
            await supabase.from('notifications').insert([{
                user_id: userId,
                title: 'Verification Approved',
                message: 'Your identity has been successfully verified! You can now list properties on RealConnect.',
                type: 'approved'
            }]);

            setSelectedRequest(null);
            fetchVerifications();
        } catch (err) {
            alert('Error approving: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (id, userId) => {
        if (!rejectReason.trim()) {
            alert('Please provide a reason for rejection.');
            return;
        }
        setActionLoading(true);

        try {
            const { error: verifyErr } = await supabase
                .from('user_verifications')
                .update({ status: 'rejected', rejection_reason: rejectReason })
                .eq('id', id);

            if (verifyErr) throw verifyErr;

            // Update user_profiles is_verified to false (just in case they were verified before)
            await supabase
                .from('user_profiles')
                .update({ is_verified: false })
                .eq('user_id', userId);

            // Send Notification
            await supabase.from('notifications').insert([{
                user_id: userId,
                title: 'Verification Rejected',
                message: `Your identity verification was rejected. Reason: ${rejectReason}. Please submit again.`,
                type: 'rejected'
            }]);

            setRejectReason('');
            setSelectedRequest(null);
            fetchVerifications();
        } catch (err) {
            alert('Error rejecting: ' + err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            approved: 'bg-green-100 text-brand-green border-green-200',
            rejected: 'bg-red-100 text-red-600 border-red-200',
        };
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${styles[status]}`}>
                {status}
            </span>
        );
    };

    return (
        <div>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">KYC Verifications</h1>
                    <p className="text-gray-500 text-sm mt-1">Review user identity documents to approve seller accounts.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    {['pending', 'approved', 'rejected'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filter === f ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">User</th>
                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">ID Document</th>
                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Status</th>
                                <th className="text-left px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Submitted</th>
                                <th className="text-right px-5 py-4 font-semibold text-gray-500 uppercase text-xs">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading && (
                                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Loading verifications...</td></tr>
                            )}
                            {!loading && filteredRequests.length === 0 && (
                                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No {filter} verifications found.</td></tr>
                            )}
                            {!loading && filteredRequests.map(req => {
                                const userProfile = req.user_profiles || {};
                                return (
                                    <tr key={req.id} className="hover:bg-gray-50/50">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                                                    {(req.full_name || '?')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{req.full_name || 'Unknown User'}</p>
                                                    <p className="text-xs text-gray-400">{req.email || 'No Email'} • {req.phone || 'No Phone'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="font-medium text-gray-800">{req.id_type}</p>
                                            <p className="text-xs text-gray-500">{req.id_number}</p>
                                        </td>
                                        <td className="px-5 py-4"><StatusBadge status={req.status} /></td>
                                        <td className="px-5 py-4 text-gray-500">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => handleSelectRequest(req)}
                                                className="bg-brand-dark text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Review Modal */}
            {selectedRequest && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-5xl w-full my-8 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <ShieldCheck className="text-brand-green" /> Verification Review
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Reviewing submission for {selectedRequest.full_name}</p>
                            </div>
                            <button onClick={() => { setSelectedRequest(null); setRejectReason(''); }} className="p-2 text-gray-400 hover:text-brand-dark bg-gray-100 rounded-full">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                            {/* Images Panel */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4" /> ID Document ({selectedRequest.id_type})</p>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 h-64 flex items-center justify-center p-2 relative">
                                        {loadingUrls ? <p className="text-gray-400 text-sm">Loading secure image...</p> : secureUrls.idDoc ? (
                                            <img src={secureUrls.idDoc} alt="ID Document" className="w-full h-full object-contain" />
                                        ) : <p className="text-gray-400 text-sm">No image</p>}
                                    </div>
                                    <p className="text-xs text-center text-gray-500 font-mono bg-gray-100 p-1 rounded">No: {selectedRequest.id_number}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-gray-700 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Selfie (Liveness)</p>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 h-64 flex items-center justify-center p-2 relative">
                                        {loadingUrls ? <p className="text-gray-400 text-sm">Loading secure image...</p> : secureUrls.selfie ? (
                                            <img src={secureUrls.selfie} alt="Selfie" className="w-full h-full object-cover rounded-xl" />
                                        ) : <p className="text-gray-400 text-sm">No image</p>}
                                    </div>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <p className="text-sm font-bold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4" /> Proof of Address</p>
                                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 h-64 flex items-center justify-center p-2 relative">
                                        {loadingUrls ? <p className="text-gray-400 text-sm">Loading secure image...</p> : secureUrls.addressDoc ? (
                                            <img src={secureUrls.addressDoc} alt="Address Document" className="w-full h-full object-contain" />
                                        ) : <p className="text-gray-400 text-sm">No image</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Panel */}
                            <div className="w-full md:w-80 flex flex-col gap-4">
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <h4 className="font-bold mb-3 text-sm uppercase text-gray-500">Applicant Details</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="text-gray-500">Name:</span> <strong>{selectedRequest.full_name}</strong></p>
                                        <p><span className="text-gray-500">Address:</span> <br />{selectedRequest.address}</p>
                                        <p><span className="text-gray-500">Email:</span> <br />{selectedRequest.email}</p>
                                        <p><span className="text-gray-500">Phone:</span> {selectedRequest.phone}</p>
                                        <p className="pt-2 mt-2 border-t border-gray-200"><span className="text-gray-500">Status:</span> <StatusBadge status={selectedRequest.status} /></p>
                                    </div>
                                </div>

                                {selectedRequest.status === 'pending' || selectedRequest.status === 'rejected' ? (
                                    <div className="bg-white border-2 border-green-100 rounded-xl p-4">
                                        <h4 className="font-bold text-brand-green mb-2">Approve Verification</h4>
                                        <p className="text-xs text-gray-500 mb-4">This will mark the user as a verified seller.</p>
                                        <button
                                            onClick={() => handleApprove(selectedRequest.id, selectedRequest.user_id)}
                                            disabled={actionLoading}
                                            className="w-full bg-brand-green text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition"
                                        >
                                            <CheckCircle2 className="w-5 h-5" /> {actionLoading ? 'Saving...' : 'Approve Application'}
                                        </button>
                                    </div>
                                ) : null}

                                {selectedRequest.status === 'pending' || selectedRequest.status === 'approved' ? (
                                    <div className="bg-white border-2 border-red-100 rounded-xl p-4 mt-auto">
                                        <h4 className="font-bold text-red-600 mb-2">Reject Verification</h4>
                                        <textarea
                                            placeholder="Reason for rejection (sent to user)..."
                                            value={rejectReason}
                                            onChange={e => setRejectReason(e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg p-3 text-sm mb-3 focus:outline-none focus:border-red-400"
                                            rows={3}
                                        />
                                        <button
                                            onClick={() => handleReject(selectedRequest.id, selectedRequest.user_id)}
                                            disabled={actionLoading}
                                            className="w-full bg-red-100 text-red-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-200 transition"
                                        >
                                            <XCircle className="w-5 h-5" /> {actionLoading ? 'Saving...' : 'Reject Application'}
                                        </button>
                                    </div>
                                ) : null}

                                {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                        <h4 className="font-bold text-red-800 text-sm mb-1">Previous Rejection Reason:</h4>
                                        <p className="text-sm text-red-600">{selectedRequest.rejection_reason}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminVerifications;
