import React, { useState, useCallback, useEffect } from 'react';
import { Camera, MapPin, CheckCircle2, ChevronRight, UploadCloud, Info, ShieldCheck, X, Image as ImageIcon, Camera as CameraIcon, RefreshCw, Check, ZoomIn, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import MapCoordinatePicker from '../components/MapCoordinatePicker';

// --- Image Compression Utility ---
// Resizes images to max 1200px width and compresses to JPEG 80% quality
// A 5MB phone photo becomes ~200-400KB → much faster uploads
const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
    return new Promise((resolve) => {
        // Skip non-image files
        if (!file.type.startsWith('image/')) {
            resolve(file);
            return;
        }
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            let { width, height } = img;

            // Only resize if wider than maxWidth
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    // Instead of creating a new File object (which can fail on some mobile browsers),
                    // we return the Blob directly and attach a name property to it.
                    blob.name = file.name || `image_${Date.now()}.jpg`;
                    resolve(blob);
                },
                'image/jpeg',
                quality
            );
        };

        img.onerror = () => resolve(file); // Fallback to original on error
        img.src = URL.createObjectURL(file);
    });
};

// --- Drag & Drop Image Upload Component ---
const ImageDropZone = ({ images, setImages }) => {
    const [isDragging, setIsDragging] = useState(false);

    const processFiles = async (files) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        // Compress images client-side before storing
        const compressed = await Promise.all(imageFiles.map(f => compressImage(f)));
        const newImages = compressed.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name
        }));
        setImages([...images, ...newImages]);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        processFiles(e.dataTransfer.files);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleFileInput = (e) => {
        processFiles(e.target.files);
    };

    const removeImage = (index) => {
        URL.revokeObjectURL(images[index].preview);
        setImages(images.filter((_, i) => i !== index));
    };

    return (
        <div>
            {/* Drop Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer group ${isDragging ? 'border-brand-green bg-green-50 scale-[1.01]' : 'border-gray-300 hover:bg-gray-50 hover:border-brand-green'}`}
            >
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm transition-transform ${isDragging ? 'bg-green-100 scale-110' : 'bg-white group-hover:scale-110'}`}>
                    <UploadCloud className={`w-8 h-8 transition-colors ${isDragging ? 'text-brand-green' : 'text-brand-light-blue'}`} />
                </div>
                <p className="font-bold text-lg mb-1">{isDragging ? 'Drop to Upload!' : 'Drag & Drop Photos Here'}</p>
                <p className="text-gray-500 text-sm">or <span className="text-brand-light-blue font-semibold">click to browse files</span></p>
                <p className="text-gray-400 text-xs mt-3">PNG, JPG, WEBP up to 10MB each</p>
            </div>

            {/* Image Previews */}
            {images.length > 0 && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {images.map((img, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 aspect-square cursor-pointer">
                            <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                                    className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                                    title="Remove image"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            {index === 0 && (
                                <div className="absolute bottom-1 left-1 bg-brand-green text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">Cover</div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Main List Property Page ---
const ListProperty = () => {
    const { user } = useAuth();
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [images, setImages] = useState([]); // [{file, preview, name}] — max 4
    const [docs, setDocs] = useState([]);     // [{file, name, size}] — max 2
    const [videos, setVideos] = useState([]); // [{file, preview, name}] — max 2
    const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
    const [isVerified, setIsVerified] = useState(null); // null = loading state
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        propertyType: 'Residential', location: '', size: '', price: '',
        titleDocument: 'C of O', description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState('');
    const [submittedKyc, setSubmittedKyc] = useState(null); // Full KYC record from DB

    // --- KYC Verification State ---
    const [showKYCForm, setShowKYCForm] = useState(false);
    const [kycData, setKycData] = useState({
        fullName: '',
        phone: '',
        address: '',
        idType: 'National ID / NIN',
        idNumber: ''
    });
    const [kycDoc, setKycDoc] = useState(null); // ID Image
    const [kycAddressDoc, setKycAddressDoc] = useState(null); // Proof of Address (Image/PDF)
    const [kycSelfie, setKycSelfie] = useState(null); // Captured Selfie (Blob)
    const [kycSelfiePreview, setKycSelfiePreview] = useState(null); // Captured Selfie Preview (Base64)
    const [kycLoading, setKycLoading] = useState(false);
    const [kycSuccess, setKycSuccess] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [cameraLoading, setCameraLoading] = useState(false);
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);

    // Lightbox for all previews
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxMedia, setLightboxMedia] = useState([]); // [{url, type}]
    const [pdfUrl, setPdfUrl] = useState(null); // URL for inline PDF viewer

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleKycChange = (e) => {
        setKycData({ ...kycData, [e.target.name]: e.target.value });
    };

    // --- Camera Logic for Liveness ---
    const startCamera = async () => {
        setIsCameraOpen(true);
        setCameraLoading(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 640 } }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            setError("Could not access camera. Please ensure you have given permission.");
            setIsCameraOpen(false);
        } finally {
            setCameraLoading(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');

            // Set canvas size to match video aspect ratio (square crop)
            const size = Math.min(video.videoWidth, video.videoHeight);
            canvas.width = size;
            canvas.height = size;

            // Draw current video frame to canvas
            context.drawImage(
                video,
                (video.videoWidth - size) / 2,
                (video.videoHeight - size) / 2,
                size, size,
                0, 0, size, size
            );

            // Convert canvas to blob
            canvas.toBlob((blob) => {
                setKycSelfie(blob);
                setKycSelfiePreview(canvas.toDataURL('image/jpeg'));
                stopCamera();
            }, 'image/jpeg', 0.8);
        }
    };

    useEffect(() => {
        const checkVerification = async () => {
            if (!user) return;

            try {
                // Check both tables to ensure we don't block users due to sync delays
                const [profileRes, verifyRes] = await Promise.all([
                    supabase.from('user_profiles').select('is_verified').eq('user_id', user.id).single(),
                    supabase.from('user_verifications').select('*').eq('user_id', user.id).single()
                ]);

                const profileVerified = profileRes.data?.is_verified === true;
                const verificationApproved = verifyRes.data?.status === 'approved';

                // If approved in either table, they are good to go
                if (profileVerified || verificationApproved) {
                    setIsVerified(true);
                } else {
                    setIsVerified(false);
                    if (verifyRes.data?.status === 'pending' || verifyRes.data?.status === 'rejected') {
                        setKycSuccess(true);
                        setSubmittedKyc(verifyRes.data);
                    }
                }
            } catch (err) {
                console.error('Verification check error:', err);
                setIsVerified(false);
            }
        };

        checkVerification();
    }, [user]);

    const handleKYCSubmit = async (e) => {
        e.preventDefault();
        if (!kycDoc || !kycAddressDoc || !kycSelfie || !user) {
            setError("Please fill all fields and upload all 3 required documents.");
            return;
        }

        setKycLoading(true);
        setError(null);

        const uploadKycFile = async (file, prefix) => {
            try {
                // Compress if it's an image
                const processedFile = file.type?.startsWith('image/') ? await compressImage(file) : file;
                
                const ext = processedFile.type?.split('/')[1]?.split('+')[0] || (processedFile.name ? processedFile.name.split('.').pop() : 'jpg');
                const path = `${user.id}/${prefix}_${Date.now()}.${ext}`;
                
                console.log(`Uploading ${prefix}:`, { name: processedFile.name, type: processedFile.type, size: processedFile.size });
                
                const { error: uploadError } = await supabase.storage.from('kyc_documents').upload(path, processedFile, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: processedFile.type || 'application/octet-stream' // Required to prevent 'Failed to fetch' on some mobile browsers
                });
                if (uploadError) {
                    console.error(`${prefix} upload error details:`, uploadError);
                    throw new Error(`${prefix} upload failed: ` + uploadError.message);
                }
                
                const { data: { publicUrl } } = supabase.storage.from('kyc_documents').getPublicUrl(path);
                return publicUrl;
            } catch (err) {
                console.error(`Error in uploadKycFile for ${prefix}:`, err);
                throw err;
            }
        };

        try {
            // Upload documents one by one (Sequential) for better reliability on mobile
            // instead of Promise.all which can overwhelm spotty connections
            const idDocUrl = await uploadKycFile(kycDoc, 'id');
            const addressDocUrl = await uploadKycFile(kycAddressDoc, 'address');
            const selfieDocUrl = await uploadKycFile(kycSelfie, 'selfie');

            // Save Request to Database
            const { error: dbError } = await supabase
                .from('user_verifications')
                .upsert({
                    user_id: user.id,
                    full_name: kycData.fullName,
                    address: kycData.address,
                    email: user.email,
                    phone: kycData.phone || user.user_metadata?.phone || '',
                    id_type: kycData.idType,
                    id_number: kycData.idNumber,
                    id_document_url: idDocUrl,
                    address_document_url: addressDocUrl,
                    selfie_url: selfieDocUrl,
                    status: 'pending',
                    rejection_reason: null
                }, { onConflict: 'user_id' });

            if (dbError) throw dbError;

            setKycSuccess(true);
            setShowKYCForm(false);
        } catch (err) {
            console.error('KYC Error:', err);
            setError(err.message || "Failed to submit verification request. Please try again.");
        } finally {
            setKycLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            setError("You must be logged in to list a property.");
            return;
        }

        setLoading(true);
        setError(null);

        const uploadFile = async (file, folder) => {
            const ext = file.name.split('.').pop();
            const path = `${user.id}/${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            const { error } = await supabase.storage.from('property-images').upload(path, file, { 
                upsert: false,
                contentType: file.type || 'application/octet-stream'
            });
            if (error) throw new Error('Upload failed: ' + error.message);
            return supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl;
        };

        try {
            setUploadProgress('Compressing & uploading photos...');
            // Compress images before upload (safety net in case processFiles was skipped)
            const compressedImages = await Promise.all(images.slice(0, 4).map(img => compressImage(img.file)));
            const imageUrls = await Promise.all(compressedImages.map(file => uploadFile(file, 'images')));

            setUploadProgress('Uploading documents...');
            const docUrls = await Promise.all(docs.slice(0, 2).map(doc => uploadFile(doc.file, 'docs')));

            setUploadProgress('Uploading videos...');
            const videoUrls = await Promise.all(videos.slice(0, 2).map(vid => uploadFile(vid.file, 'videos')));

            setUploadProgress('Saving listing...');
            const { error: insertError } = await supabase
                .from('properties')
                .insert([{
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    property_type: formData.propertyType,
                    location: formData.location,
                    latitude: coordinates.lat,
                    longitude: coordinates.lng,
                    size: formData.size,
                    price: formData.price,
                    title_document: formData.titleDocument,
                    description: formData.description,
                    status: 'pending',
                    user_id: user.id,
                    image_url: imageUrls[0] || null,
                    image_urls: imageUrls,
                    document_urls: docUrls,
                    video_urls: videoUrls,
                    poster_type: 'user',
                    is_verified: false,
                }]);

            if (insertError) throw insertError;

            setIsSubmitted(true);
            window.scrollTo(0, 0);
        } catch (err) {
            console.error("Error submitting property:", err);
            setError(err.message || "An error occurred while submitting your property.");
        } finally {
            setLoading(false);
            setUploadProgress('');
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 font-sans text-brand-dark py-24">
                <div className="bg-white p-10 rounded-3xl shadow-lg max-w-lg text-center border top-brand-green border-t-8 border-r-0 border-b-0 border-l-0 border-gray-100">
                    <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <CheckCircle2 className="w-12 h-12 text-brand-green" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-brand-dark mb-4">Request Submitted!</h1>
                    <p className="text-gray-600 mb-8 text-lg">
                        Thank you for choosing to list your property with RealConnect. Our verification team will review your details and an admin will contact you shortly before we approve and publish your listing.
                    </p>
                    <div className="space-y-4">
                        <Link to="/browse" className="w-full bg-brand-green text-white font-bold py-4 px-8 rounded-xl shadow-md hover:bg-green-700 transition-colors inline-block">
                            Browse Listings
                        </Link>
                        <Link to="/" className="w-full bg-white text-brand-dark border-2 border-gray-200 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 transition-colors inline-block">
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (user && isVerified === false) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 font-sans text-brand-dark py-24">
                <div className="bg-white p-10 rounded-3xl shadow-lg max-w-lg w-full text-center border top-brand-green border-t-8 border-r-0 border-b-0 border-l-0 border-gray-100">

                    {error && (
                        <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-left">{error}</div>
                    )}

                    {!showKYCForm && !kycSuccess ? (
                        <>
                            <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <ShieldCheck className="w-12 h-12 text-red-500" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-brand-dark mb-4">Verification Required</h1>
                            <p className="text-gray-600 mb-8 text-lg">
                                You must complete your KYC verification before you can list a property. This ensures a safe marketplace for everyone.
                            </p>
                            <div className="space-y-4">
                                <button onClick={() => setShowKYCForm(true)} className="w-full bg-brand-green text-white font-bold py-4 px-8 rounded-xl shadow-md hover:bg-green-700 transition-colors inline-block">
                                    Start Verification Now
                                </button>
                                <Link to="/browse" className="w-full bg-white text-brand-dark border-2 border-gray-200 font-bold py-4 px-8 rounded-xl hover:bg-gray-50 transition-colors inline-block">
                                    Return to Browse
                                </Link>
                            </div>
                        </>
                    ) : kycSuccess ? (
                        <>
                            <div className="bg-orange-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <ShieldCheck className="w-12 h-12 text-orange-500" />
                            </div>
                            <h1 className="text-3xl font-extrabold text-brand-dark mb-4">Under Review</h1>
                            <p className="text-gray-600 mb-8 text-lg">
                                Your KYC documents have been successfully submitted and are currently being reviewed by our admin team. We will notify you once approved.
                            </p>
                            
                            {submittedKyc && (
                                <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 text-left">
                                    <h3 className="font-bold text-brand-dark mb-4 border-b border-gray-200 pb-2">Submitted Documents</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg"><ImageIcon className="w-4 h-4 text-blue-500" /></div>
                                                <span className="text-sm font-medium">Identity Document</span>
                                            </div>
                                            <button onClick={() => { setLightboxMedia([{url: submittedKyc.id_document_url, type: 'image'}]); setLightboxIndex(0); setShowLightbox(true); }} className="text-brand-green text-xs font-bold hover:underline">View</button>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-purple-50 rounded-lg"><FileText className="w-4 h-4 text-purple-500" /></div>
                                                <span className="text-sm font-medium">Proof of Address</span>
                                            </div>
                                            <button onClick={() => { 
                                                const url = submittedKyc.address_document_url;
                                                if (url.toLowerCase().endsWith('.pdf')) setPdfUrl(url);
                                                else { setLightboxMedia([{url, type: 'image'}]); setLightboxIndex(0); setShowLightbox(true); }
                                            }} className="text-brand-green text-xs font-bold hover:underline">View</button>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-50 rounded-lg"><CameraIcon className="w-4 h-4 text-orange-500" /></div>
                                                <span className="text-sm font-medium">Selfie Check</span>
                                            </div>
                                            <button onClick={() => { setLightboxMedia([{url: submittedKyc.selfie_url, type: 'image'}]); setLightboxIndex(0); setShowLightbox(true); }} className="text-brand-green text-xs font-bold hover:underline">View</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Link to="/browse" className="w-full bg-brand-green text-white font-bold py-4 px-8 rounded-xl shadow-md hover:bg-green-700 transition-colors inline-block">
                                Browse Listings
                            </Link>
                        </>
                    ) : (
                        <form onSubmit={handleKYCSubmit} className="text-left w-full max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-2">Submit KYC Documents</h2>
                            <p className="text-gray-500 text-sm mb-6">Please provide your details and upload the required documents to verify your identity.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Full Legal Name *</label>
                                    <input required type="text" name="fullName" value={kycData.fullName} onChange={handleKycChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number *</label>
                                    <input required type="tel" name="phone" value={kycData.phone} onChange={handleKycChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green" placeholder="+234 800 000 0000" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Residential Address *</label>
                                    <input required type="text" name="address" value={kycData.address} onChange={handleKycChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green" placeholder="123 Main St..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ID Type *</label>
                                    <select name="idType" value={kycData.idType} onChange={handleKycChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green bg-white">
                                        <option>National ID / NIN</option>
                                        <option>Driver's License</option>
                                        <option>International Passport</option>
                                        <option>Voter's Card</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">ID Number *</label>
                                    <input required type="text" name="idNumber" value={kycData.idNumber} onChange={handleKycChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-green" placeholder="e.g. 1234567890" />
                                </div>
                            </div>

                            <div className="space-y-4 mb-8 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">1. Upload ID Document (Image) *</label>
                                    <input required type="file" accept="image/*" onChange={(e) => setKycDoc(e.target.files[0])} className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">2. Proof of Address (Image or PDF) *</label>
                                    <p className="text-xs text-gray-500 mb-1">Utility bill, bank statement, etc. (max 3 months old)</p>
                                    <div className="flex gap-2">
                                        <input required type="file" accept="image/*,.pdf" onChange={(e) => setKycAddressDoc(e.target.files[0])} className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white" />
                                        {kycAddressDoc && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const url = URL.createObjectURL(kycAddressDoc);
                                                    if (kycAddressDoc.type === 'application/pdf') {
                                                        setPdfUrl(url);
                                                    } else {
                                                        setLightboxMedia([{ url, type: 'image' }]);
                                                        setLightboxIndex(0);
                                                        setShowLightbox(true);
                                                    }
                                                }}
                                                className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-bold shrink-0"
                                            >
                                                Preview
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">3. Liveness Check (Selfie) *</label>
                                    <p className="text-xs text-gray-500 mb-2">Take a clear photo of your face using your webcam/camera.</p>

                                    {!kycSelfiePreview ? (
                                        <button
                                            type="button"
                                            onClick={startCamera}
                                            className="w-full py-4 border-2 border-dashed border-brand-green rounded-xl bg-green-50 text-brand-green font-bold flex items-center justify-center hover:bg-green-100 transition-colors"
                                        >
                                            <CameraIcon className="w-5 h-5 mr-2" />
                                            Open Camera for Liveness Check
                                        </button>
                                    ) : (
                                        <div className="relative w-32 h-32 mx-auto sm:mx-0 rounded-2xl overflow-hidden shadow-md border-2 border-brand-green group cursor-pointer" onClick={() => { setLightboxMedia([{url: kycSelfiePreview, type: 'image'}]); setLightboxIndex(0); setShowLightbox(true); }}>
                                            <img src={kycSelfiePreview} alt="Selfie" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); startCamera(); }}
                                                className="absolute bottom-1 right-1 bg-brand-green text-white p-1.5 rounded-lg shadow-lg hover:bg-green-700 transition-colors z-10"
                                                title="Retake Photo"
                                            >
                                                <RefreshCw className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Camera Modal Overlay */}
                            {isCameraOpen && (
                                <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
                                    <div className="relative w-full max-w-md bg-brand-dark rounded-3xl overflow-hidden shadow-2xl border border-gray-800">
                                        <div className="absolute top-4 right-4 z-10">
                                            <button onClick={stopCamera} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors">
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>

                                        <div className="aspect-square bg-black flex items-center justify-center relative">
                                            {cameraLoading && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                                    <RefreshCw className="w-10 h-10 animate-spin mb-4" />
                                                    <p>Initializing camera...</p>
                                                </div>
                                            )}
                                            <video
                                                ref={videoRef}
                                                autoPlay
                                                playsInline
                                                muted
                                                className="w-full h-full object-cover mirror"
                                                onLoadedMetadata={() => setCameraLoading(false)}
                                            />
                                            {/* Mask Overlay */}
                                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                                <div className="w-72 h-72 border-2 border-dashed border-white/50 rounded-full"></div>
                                            </div>
                                        </div>

                                        <div className="p-8 text-center bg-brand-dark">
                                            <h3 className="text-white text-xl font-bold mb-2">Liveness Selfie</h3>
                                            <p className="text-gray-400 text-sm mb-6">Position your face inside the circle and look directly at the camera.</p>

                                            <button
                                                type="button"
                                                onClick={capturePhoto}
                                                className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                                            >
                                                <div className="w-16 h-16 border-4 border-brand-dark rounded-full flex items-center justify-center">
                                                    <div className="w-12 h-12 bg-red-500 rounded-full"></div>
                                                </div>
                                            </button>
                                        </div>

                                        <canvas ref={canvasRef} className="hidden" />
                                    </div>
                                </div>
                            )}

                            <div className="flex space-x-4">
                                <button type="button" onClick={() => setShowKYCForm(false)} className="w-1/3 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors">Cancel</button>
                                <button disabled={kycLoading} type="submit" className="w-2/3 bg-brand-green text-white font-bold py-3 rounded-xl shadow-md hover:bg-green-700 disabled:opacity-50 transition-colors">
                                    {kycLoading ? "Uploading Documents..." : "Submit All Documents"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            

            {/* Lightbox for previews */}
            {showLightbox && lightboxMedia.length > 0 && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in">
                    <button 
                        onClick={() => setShowLightbox(false)} 
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[210]"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    <div className="w-full max-w-5xl max-h-[85vh] flex items-center justify-center">
                        {lightboxMedia[lightboxIndex].type === 'image' ? (
                            <img src={lightboxMedia[lightboxIndex].url} alt="Lightbox Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                        ) : (
                            <video src={lightboxMedia[lightboxIndex].url} controls autoPlay className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                        )}
                    </div>
                </div>
            )}
        </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-brand-dark">
            {/* Header Banner */}
            <div className="bg-brand-dark text-white pt-24 pb-16 px-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-10">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="list-pattern" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="currentColor" fillOpacity="0.5" /></pattern></defs><rect width="100%" height="100%" fill="url(#list-pattern)" /></svg>
                </div>
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">List Your Property</h1>
                    <p className="text-lg text-gray-300">Submit your land details. Our admins will verify and contact you before your property goes live to our network of buyers.</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
                {error && (
                    <div className="mb-6 bg-red-50 p-4 rounded-xl flex items-start text-red-600 border border-red-100">
                        <Info className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">{error}</span>
                    </div>
                )}
                {!user && (
                    <div className="mb-6 bg-blue-50 p-4 rounded-xl flex items-start text-blue-800 border border-blue-100">
                        <Info className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                        <span className="text-sm font-medium">Please <Link to="/login" className="underline font-bold">login or register</Link> to submit a property listing. It only takes a minute!</span>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 mb-12">

                    {/* Section 1: Personal Info */}
                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-blue-50 p-2 rounded-lg"><Info className="w-5 h-5 text-brand-light-blue" /></div>
                            <h2 className="text-2xl font-bold">1. Personal Information</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">First Name *</label>
                                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all" placeholder="John" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Last Name *</label>
                                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all" placeholder="Doe" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all" placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number *</label>
                                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all" placeholder="+234 800 000 0000" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Property Info */}
                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-green-50 p-2 rounded-lg"><MapPin className="w-5 h-5 text-brand-green" /></div>
                            <h2 className="text-2xl font-bold">2. Property Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Exact Location / Address *</label>
                                <input required type="text" name="location" value={formData.location} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all" placeholder="e.g. Plot 12, Block 4, Lekki Phase 1" />
                            </div>
                            <div className="md:col-span-2">
                                <MapCoordinatePicker coordinates={coordinates} setCoordinates={setCoordinates} />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Property Type *</label>
                                <select name="propertyType" value={formData.propertyType} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all bg-white">
                                    <option>Residential</option>
                                    <option>Commercial</option>
                                    <option>Mixed Use</option>
                                    <option>Agricultural</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Title Document *</label>
                                <select name="titleDocument" value={formData.titleDocument} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all bg-white">
                                    <option>C of O</option>
                                    <option>Governor's Consent</option>
                                    <option>Excision / Gazette</option>
                                    <option>Registered Deed</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Land Size (sqm) *</label>
                                <input required type="text" name="size" value={formData.size} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all" placeholder="e.g. 500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Expected Price (₦) *</label>
                                <input required type="text" name="price" value={formData.price} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all" placeholder="e.g. 75,000,000" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Property Description *</label>
                                <textarea required name="description" value={formData.description} onChange={handleChange} rows="4" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green transition-all" placeholder="Describe the land, features, neighborhood, topography, etc..."></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Media Upload */}
                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-gray-100 p-2 rounded-lg"><Camera className="w-5 h-5 text-gray-600" /></div>
                            <h2 className="text-2xl font-bold">3. Photos, Documents & Videos</h2>
                        </div>

                        {/* Photos - max 4 */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-gray-700">Photos <span className="text-gray-400 font-normal">(up to 4)</span></label>
                                <span className="text-sm font-semibold text-brand-green">{images.length}/4</span>
                            </div>
                            <ImageDropZone images={images} setImages={(newImages) => setImages(newImages.slice(0, 4))} />
                            {images.length > 0 && (
                                <p className="text-sm text-brand-green font-semibold mt-3 flex items-center">
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                    {images.length} photo{images.length > 1 ? 's' : ''} selected. The first photo will be the cover image.
                                </p>
                            )}
                        </div>

                        {/* Documents - max 2 */}
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-gray-700">Title Documents & Survey Plans <span className="text-gray-400 font-normal">(up to 2 PDF / DOC files)</span></label>
                                <span className="text-sm font-semibold text-brand-green">{docs.length}/2</span>
                            </div>
                            {docs.length < 2 && (
                                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-7 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer group">
                                    <input type="file" accept=".pdf,.doc,.docx" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => { const files = Array.from(e.target.files); const remaining = 2 - docs.length; setDocs(prev => [...prev, ...files.slice(0, remaining).map(f => ({ file: f, name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' }))]); }} />
                                    <div className="text-3xl mb-2">📄</div>
                                    <p className="font-bold text-gray-600">Click to upload documents</p>
                                    <p className="text-gray-400 text-xs mt-1">PDF, DOC, DOCX up to 10MB each</p>
                                </div>
                            )}
                            {docs.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {docs.map((doc, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                            <span className="text-2xl">📄</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">{doc.name}</p>
                                                <p className="text-xs text-gray-400">{doc.size}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    type="button" 
                                                    onClick={() => {
                                                        const url = URL.createObjectURL(doc.file);
                                                        setPdfUrl(url);
                                                    }}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Preview document"
                                                >
                                                    <ZoomIn className="w-4 h-4" />
                                                </button>
                                                <button type="button" onClick={() => setDocs(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 p-1">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Videos - max 2 */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-bold text-gray-700">Property Videos <span className="text-gray-400 font-normal">(up to 2 — tour, walkthrough, etc.)</span></label>
                                <span className="text-sm font-semibold text-brand-green">{videos.length}/2</span>
                            </div>
                            {videos.length < 2 && (
                                <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-7 text-center hover:border-purple-400 hover:bg-purple-50/30 transition-colors cursor-pointer group">
                                    <input type="file" accept="video/*" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => { const files = Array.from(e.target.files); const remaining = 2 - videos.length; setVideos(prev => [...prev, ...files.slice(0, remaining).map(f => ({ file: f, name: f.name, size: (f.size / (1024 * 1024)).toFixed(1) + ' MB', preview: URL.createObjectURL(f) }))]); }} />
                                    <div className="text-3xl mb-2">🎬</div>
                                    <p className="font-bold text-gray-600">Click to upload videos</p>
                                    <p className="text-gray-400 text-xs mt-1">MP4, MOV, AVI up to 100MB each</p>
                                </div>
                            )}
                            {videos.length > 0 && (
                                <div className="mt-3 grid grid-cols-2 gap-4">
                                    {videos.map((vid, i) => (
                                        <div key={i} className="relative rounded-xl overflow-hidden border group bg-black aspect-video cursor-pointer" onClick={() => { setLightboxMedia(videos.map(v => ({url: v.preview, type: 'video'}))); setLightboxIndex(i); setShowLightbox(true); }}>
                                            <video src={vid.preview} className="w-full h-full object-cover opacity-70" />
                                            <div className="absolute inset-0 flex items-center justify-center"><span className="text-white text-2xl">▶</span></div>
                                            <p className="absolute bottom-1 left-2 text-white text-[10px] truncate max-w-[80%]">{vid.name}</p>
                                            <button type="button" onClick={(e) => { e.stopPropagation(); setVideos(p => p.filter((_, j) => j !== i)); }}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div> {/* End Section 3 */}

                    <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-sm text-gray-400 font-medium">
                            {images.length > 0 && <span>✅ {images.length} photos ready</span>}
                            {uploadProgress && <span className="block text-brand-green font-bold animate-pulse mt-1">{uploadProgress}</span>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !user}
                            className="w-full md:w-auto bg-brand-green text-white text-lg font-bold py-4 px-12 rounded-2xl shadow-xl hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center group"
                        >
                            {loading ? (
                                <RefreshCw className="w-5 h-5 animate-spin mr-3" />
                            ) : (
                                <CheckCircle2 className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                            )}
                            {loading ? 'Submitting...' : 'Submit Listing for Approval'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Lightbox for previews */}
            {showLightbox && lightboxMedia.length > 0 && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 animate-fade-in">
                    <button 
                        onClick={() => setShowLightbox(false)} 
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[210]"
                    >
                        <X className="w-8 h-8" />
                    </button>

                    {lightboxMedia.length > 1 && (
                        <>
                            <button 
                                onClick={() => setLightboxIndex(prev => (prev - 1 + lightboxMedia.length) % lightboxMedia.length)}
                                className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[210] hidden sm:block"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button 
                                onClick={() => setLightboxIndex(prev => (prev + 1) % lightboxMedia.length)}
                                className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-[210] hidden sm:block"
                            >
                                <ChevronRight className="w-8 h-8" />
                            </button>
                        </>
                    )}

                    <div className="w-full max-w-5xl max-h-[85vh] flex items-center justify-center">
                        {lightboxMedia[lightboxIndex].type === 'image' ? (
                            <img src={lightboxMedia[lightboxIndex].url} alt="Lightbox Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                        ) : (
                            <video src={lightboxMedia[lightboxIndex].url} controls autoPlay className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
                        )}
                    </div>
                    
                    {lightboxMedia.length > 1 && (
                        <div className="absolute bottom-6 text-white/70 font-bold bg-black/50 px-4 py-2 rounded-full">
                            {lightboxIndex + 1} / {lightboxMedia.length}
                        </div>
                    )}
                </div>
            )}

            {/* PDF Viewer Modal */}
            {pdfUrl && (
                <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-xl">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-brand-dark text-sm sm:text-base">Document Preview</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.open(pdfUrl, '_blank')}
                                    className="p-2.5 text-gray-400 hover:text-brand-green hover:bg-green-50 rounded-full transition-all"
                                    title="Open / Download"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setPdfUrl(null)}
                                    className="p-2.5 bg-gray-100 text-gray-500 hover:bg-gray-200 rounded-full transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 bg-gray-50 relative">
                            <iframe
                                src={`${pdfUrl}#toolbar=0`}
                                className="w-full h-full border-none"
                                title="Document Viewer"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListProperty;
