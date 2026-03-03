import React, { useState, useCallback } from 'react';
import { Camera, MapPin, CheckCircle2, ChevronRight, UploadCloud, Info, ShieldCheck, X, Image } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import MapCoordinatePicker from '../components/MapCoordinatePicker';

// --- Drag & Drop Image Upload Component ---
const ImageDropZone = ({ images, setImages }) => {
    const [isDragging, setIsDragging] = useState(false);

    const processFiles = (files) => {
        const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        const newImages = imageFiles.map(file => ({
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
                        <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm border border-gray-200 aspect-square">
                            <img src={img.preview} alt={img.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
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
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        propertyType: 'Residential', location: '', size: '', price: '',
        titleDocument: 'C of O', description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            const { error } = await supabase.storage.from('property-images').upload(path, file, { upsert: false });
            if (error) throw new Error('Upload failed: ' + error.message);
            return supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl;
        };

        try {
            setUploadProgress('Uploading photos...');
            const imageUrls = await Promise.all(images.slice(0, 4).map(img => uploadFile(img.file, 'images')));

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
                                            <button type="button" onClick={() => setDocs(p => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 p-1">
                                                <X className="w-4 h-4" />
                                            </button>
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
                                        <div key={i} className="relative rounded-xl overflow-hidden border group bg-black aspect-video">
                                            <video src={vid.preview} className="w-full h-full object-cover opacity-70" />
                                            <div className="absolute inset-0 flex items-center justify-center"><span className="text-white text-2xl">▶</span></div>
                                            <p className="absolute bottom-1 left-2 text-white text-[10px] truncate max-w-[80%]">{vid.name}</p>
                                            <button type="button" onClick={() => setVideos(p => p.filter((_, j) => j !== i))}
                                                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit */}
                    <button disabled={loading || !user} type="submit" className="w-full bg-brand-green hover:bg-green-700 text-white font-extrabold py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 flex justify-center items-center text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? (uploadProgress || 'Submitting...') : 'Submit For Verification'}
                        {!loading && <ChevronRight className="ml-2 w-6 h-6" />}
                    </button>
                    <p className="text-center text-sm text-gray-500 mt-4 flex items-center justify-center">
                        <ShieldCheck className="w-4 h-4 mr-1 text-brand-green" /> Your data is secure. We never publish without your final consent.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default ListProperty;
