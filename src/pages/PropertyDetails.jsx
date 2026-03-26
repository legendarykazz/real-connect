import React, { useState } from 'react';
import {
    ArrowLeft, Share2, Heart, Map, ImageIcon,
    CheckCircle2, FileText, ShieldCheck, Download, ExternalLink,
    MessageCircle, Phone, Calendar as CalendarIcon, FileCheck, Mail,
    ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { REALCONNECT_CONTACT } from '../lib/contact';
import PropertyMapViewer from '../components/PropertyMapViewer';

const PropertyDetails = () => {
    const { id } = useParams();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('gallery');
    const [isSaved, setIsSaved] = useState(false);
    const [activeImg, setActiveImg] = useState(0);
    const [lightboxIndex, setLightboxIndex] = useState(-1); // -1 = closed; 0+ = open at index
    const [lightboxMedia, setLightboxMedia] = useState([]); // Array of {url, type} mappings
    const [pdfUrl, setPdfUrl] = useState(null);

    React.useEffect(() => {
        const fetchProperty = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;

                // Collect all real images
                const allImages = [];
                if (data.image_urls && data.image_urls.length > 0) {
                    // filter out empty strings
                    allImages.push(...data.image_urls.filter(Boolean));
                } else if (data.image_url) {
                    allImages.push(data.image_url);
                }

                // Build document list from document_urls
                const realDocs = (data.document_urls || []).filter(Boolean).map((url, i) => {
                    const filename = decodeURIComponent(url.split('/').pop().split('?')[0]);
                    const ext = filename.split('.').pop().toUpperCase();
                    // Strip timestamp prefix like "1234567890_abc123."
                    const cleanName = filename.replace(/^\d+_[a-z0-9]+\./, '').replace(/\.[^.]+$/, '') || `Document ${i + 1}`;
                    return { name: cleanName, type: ext || 'PDF', url };
                });

                // Price per sqm
                const rawPrice = parseFloat(String(data.price).replace(/[^0-9.]/g, ''));
                const rawSize = parseFloat(String(data.size).replace(/[^0-9.]/g, ''));
                const pricePerSqm = (rawPrice && rawSize)
                    ? `₦${Math.round(rawPrice / rawSize).toLocaleString()}`
                    : '—';

                const sellerName = data.poster_type === 'agency'
                    ? (data.agency_name || 'Agency')
                    : `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Seller';

                setProperty({
                    // ... same mapping ...
                    id: data.id,
                    title: `${data.property_type} in ${data.location}`,
                    price: `₦${data.price}`,
                    location: data.location,
                    size: data.size ? `${data.size} sqm` : '—',
                    pricePerSqm,
                    type: data.property_type || '—',
                    titleDocument: data.title_document || '—',
                    surveyPlan: realDocs.length > 0 ? 'Available (Yes)' : 'Not Provided',
                    status: (() => {
                        if (data.status !== 'approved') return data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : 'Pending';
                        if (data.availability === 'sold') return 'Sold';
                        if (data.availability === 'not_available') return 'Not Available';
                        return 'Available';
                    })(),
                    description: data.description || 'No description provided.',
                    images: allImages,
                    documents: realDocs,
                    videoUrls: (data.video_urls || []).filter(Boolean),
                    isVerified: data.is_verified || false,
                    lat: data.latitude,
                    lng: data.longitude,
                    seller: {
                        name: sellerName,
                        type: data.poster_type === 'agency' ? 'Agency' : 'Individual',
                        phone: data.phone || '',
                    },
                    verification: {
                        ownership: data.owner_verified || false,
                        documents: data.docs_verified || false,
                        survey: data.survey_verified || false,
                        location: data.location_verified || false,
                        freeFromAcquisition: data.acquisition_free || false,
                        reportUrl: data.verification_report_url || null,
                    },
                });

                // Prepare Lightbox Media List (Images first, then videos)
                const mediaItems = [];
                allImages.forEach(url => mediaItems.push({ url, type: 'image' }));
                (data.video_urls || []).filter(Boolean).forEach(url => mediaItems.push({ url, type: 'video' }));
                setLightboxMedia(mediaItems);
            } catch (err) {
                console.error('Error fetching property:', err);
                setError('Could not load property details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: property?.title, url: window.location.href });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (e) { console.error(e); }
    };

    const handleScheduleInspection = () => {
        const msg = encodeURIComponent(
            `Hello RealConnect, I am interested in scheduling a land inspection for: ${property.title} (${property.location}). Please let me know your available dates.`
        );
        window.open(`https://wa.me/${REALCONNECT_CONTACT.whatsapp}?text=${msg}`, '_blank');
    };

    const handleViewDocument = (doc) => {
        if (doc.url) setPdfUrl(doc.url);
    };

    const handleDownloadDocument = async (doc) => {
        if (!doc.url) return;
        try {
            const response = await fetch(doc.url);
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = doc.name || 'document';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error('Download failed, opening in new tab:', err);
            window.open(doc.url, '_blank');
        }
    };

    const openLightbox = (index) => {
        setLightboxIndex(index);
        document.body.style.overflow = 'hidden'; // Prevent background scroll
    };

    const closeLightbox = () => {
        setLightboxIndex(-1);
        document.body.style.overflow = '';
    };

    const nextMedia = () => {
        setLightboxIndex((prev) => (prev + 1) % lightboxMedia.length);
    };

    const prevMedia = () => {
        setLightboxIndex((prev) => (prev - 1 + lightboxMedia.length) % lightboxMedia.length);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-brand-dark">

            {/* Lightbox Overlay */}
            {lightboxIndex >= 0 && (
                <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center animate-fade-in shadow-2xl backdrop-blur-sm">
                    {/* Header: Close / Index Info */}
                    <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent">
                        <span className="text-white/80 font-bold ml-4">{lightboxIndex + 1} / {lightboxMedia.length}</span>
                        <button onClick={closeLightbox} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                            <X className="w-8 h-8" />
                        </button>
                    </div>

                    {/* Navigation Buttons */}
                    <button onClick={prevMedia} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 hidden sm:block">
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button onClick={nextMedia} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 hidden sm:block">
                        <ChevronRight className="w-8 h-8" />
                    </button>

                    {/* Content Display */}
                    <div className="w-full max-w-6xl max-h-[85vh] p-4 flex items-center justify-center">
                        {lightboxMedia[lightboxIndex].type === 'image' ? (
                            <img
                                src={lightboxMedia[lightboxIndex].url}
                                alt="Gallery item"
                                className="max-w-full max-h-[85vh] object-contain select-none"
                            />
                        ) : (
                            <video
                                src={lightboxMedia[lightboxIndex].url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[85vh] object-contain"
                            />
                        )}
                    </div>

                    {/* Caption / Helper */}
                    <div className="absolute bottom-10 text-white/50 text-sm">
                        Use Arrow Keys to Navigate • Click X to Close
                    </div>
                </div>
            )}
            {/* PDF Modal Viewer */}
            {pdfUrl && (
                <div className="fixed inset-0 z-[250] bg-black/80 flex flex-col items-center justify-center p-2 sm:p-6 animate-fade-in backdrop-blur-sm">
                    <div className="bg-white w-full max-w-5xl h-full sm:h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-gray-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <div className="flex items-center">
                                <FileText className="w-5 h-5 mr-3 text-brand-light-blue" />
                                <h3 className="font-bold text-brand-dark">Resource Viewer</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.open(pdfUrl, '_blank')}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                                    title="Open in new tab"
                                >
                                    <ExternalLink className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setPdfUrl(null)}
                                    className="p-2 hover:bg-gray-200 rounded-full transition-colors text-brand-dark"
                                    title="Close"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 w-full bg-gray-100">
                            <iframe
                                src={`${pdfUrl}#toolbar=0`}
                                className="w-full h-full border-0"
                                title="Document Viewer"
                            />
                        </div>
                    </div>
                    {/* Click outside to close */}
                    <div className="absolute inset-0 -z-10" onClick={() => setPdfUrl(null)} />
                </div>
            )}

            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/browse" className="flex items-center text-gray-600 hover:text-brand-green transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="font-semibold">Back to Listings</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <button onClick={handleShare} className="p-2 text-gray-600 hover:text-brand-light-blue hover:bg-blue-50 rounded-full transition-colors">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsSaved(!isSaved)} className={`p-2 rounded-full transition-colors ${isSaved ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'}`}>
                            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {loading && <div className="text-center py-20 text-gray-500 text-lg font-semibold animate-pulse">Loading property details...</div>}
                {error && <div className="bg-red-50 p-6 rounded-xl text-red-600 text-center font-bold border border-red-100">{error}</div>}

                {!loading && !error && property && (
                    <>
                        {/* Gallery + Summary */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                            {/* Gallery (left) */}
                            <div className="lg:col-span-2 space-y-3">
                                {/* View Toggle */}
                                <div className="flex space-x-2">
                                    <button onClick={() => setViewMode('gallery')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-full shadow-sm flex items-center transition-colors ${viewMode === 'gallery' ? 'bg-brand-dark text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                                        <ImageIcon className="w-4 h-4 mr-2" /> Photos
                                    </button>
                                    <button onClick={() => setViewMode('map')}
                                        className={`px-4 py-2 text-sm font-semibold rounded-full shadow-sm flex items-center transition-colors ${viewMode === 'map' ? 'bg-brand-dark text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                                        <Map className="w-4 h-4 mr-2" /> Map
                                    </button>
                                </div>

                                {viewMode === 'gallery' ? (
                                    <>
                                        {property.images.length > 0 ? (
                                            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[480px] rounded-2xl overflow-hidden shadow-sm">
                                                {/* Main image */}
                                                <div className="col-span-4 md:col-span-3 row-span-2 relative group cursor-pointer h-full" onClick={() => openLightbox(activeImg)}>
                                                    <img src={property.images[activeImg]} alt="Main" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                                        <span className="bg-white/90 text-brand-dark px-4 py-2 rounded-full font-bold opacity-0 group-hover:opacity-100 transition-opacity">Click to Expand</span>
                                                    </div>
                                                </div>
                                                {/* Thumb 2 */}
                                                {property.images.length > 1 && (
                                                    <div className="hidden md:block col-span-1 row-span-1 relative cursor-pointer h-full overflow-hidden group" onClick={() => setActiveImg(1)}>
                                                        <img src={property.images[1]} alt="View 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                    </div>
                                                )}
                                                {/* Thumb 3 + count */}
                                                {property.images.length > 2 ? (
                                                    <div className="hidden md:block col-span-1 row-span-1 relative cursor-pointer h-full overflow-hidden group" onClick={() => openLightbox(2)}>
                                                        <img src={property.images[2]} alt="View 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                        {property.images.length > 3 && (
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                                <span className="text-white font-bold text-lg">+{property.images.length - 2} Photos</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    property.images.length === 1 && (
                                                        <div className="hidden md:flex col-span-1 row-span-2 bg-gray-100 items-center justify-center rounded-r-2xl">
                                                            <ImageIcon className="w-8 h-8 text-gray-300" />
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <div className="h-[400px] md:h-[480px] rounded-2xl bg-gray-100 flex flex-col items-center justify-center text-gray-400 shadow-sm">
                                                <ImageIcon className="w-16 h-16 mb-3 opacity-30" />
                                                <p className="font-semibold">No photos uploaded</p>
                                            </div>
                                        )}

                                        {/* Thumbnail strip */}
                                        {property.images.length > 1 && (
                                            <div className="flex gap-2 overflow-x-auto pb-1">
                                                {property.images.map((img, i) => (
                                                    <button key={i} onClick={() => setActiveImg(i)}
                                                        className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-brand-green scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                                                        <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="h-[480px] rounded-2xl overflow-hidden shadow-sm relative z-0">
                                        {property.lat && property.lng ? (
                                            <PropertyMapViewer lat={property.lat} lng={property.lng} locationName={property.location} />
                                        ) : (
                                            <iframe
                                                className="w-full h-full border-0 absolute inset-0 z-0"
                                                loading="lazy"
                                                allowFullScreen
                                                src={`https://maps.google.com/maps?q=${encodeURIComponent(property.location)}&z=15&output=embed`}
                                                title="Property Location"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Summary Card (right) */}
                            <div className="flex flex-col">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
                                    <div className="flex items-center space-x-2 text-sm text-gray-400 mb-3">
                                        <span className="truncate text-[11px]">ID: {property.id}</span>
                                        <span>•</span>
                                        <span className={`font-semibold shrink-0 ${property.status === 'Available' ? 'text-brand-green' : 'text-orange-500'}`}>{property.status}</span>
                                    </div>

                                    <h1 className="text-2xl font-bold text-brand-dark mb-3 leading-tight">{property.title}</h1>

                                    <div className="text-3xl font-bold text-brand-light-blue mb-5">{property.price}</div>

                                    {property.isVerified && (
                                        <div className="bg-green-50 rounded-xl p-4 mb-5 flex items-start border border-green-100">
                                            <CheckCircle2 className="w-5 h-5 text-brand-green mr-3 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-bold text-green-900 mb-0.5 text-sm">Verified by RealConnect</h4>
                                                <p className="text-xs text-green-700">This property has passed our 5-point verification check.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-auto space-y-3">
                                        <a href={`tel:${REALCONNECT_CONTACT.phone}`}
                                            className="w-full bg-brand-light-blue hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex justify-center items-center">
                                            <Phone className="w-5 h-5 mr-2" /> Contact RealConnect
                                        </a>
                                        <a href={`https://wa.me/${REALCONNECT_CONTACT.whatsapp}?text=${encodeURIComponent(`Hello RealConnect, I am interested in this property: ${property?.title} (${property?.location}). Please send me more details.`)}`} target="_blank" rel="noopener noreferrer"
                                            className="w-full bg-brand-green hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex justify-center items-center">
                                            <MessageCircle className="w-5 h-5 mr-2" /> WhatsApp Us
                                        </a>
                                        <button onClick={handleScheduleInspection}
                                            className="w-full bg-white hover:bg-gray-50 text-brand-dark border border-gray-200 font-bold py-4 rounded-xl transition-colors flex justify-center items-center">
                                            <CalendarIcon className="w-5 h-5 mr-2" /> Schedule Inspection
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            {/* Left column */}
                            <div className="lg:col-span-2 space-y-6">

                                {/* Key Facts */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Key Facts</h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                        <FactItem label="Location" value={property.location} />
                                        <FactItem label="Land Size" value={property.size} />
                                        <FactItem label="Price per sqm" value={property.pricePerSqm} />
                                        <FactItem label="Type" value={property.type} />
                                        <FactItem label="Title Document" value={property.titleDocument} />
                                        <FactItem label="Survey Plan" value={property.surveyPlan} />
                                        <FactItem label="Seller" value={property.seller.name} />
                                        <FactItem label="Seller Type" value={property.seller.type} />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h2 className="text-xl font-bold mb-4">Property Description</h2>
                                    <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
                                </div>

                                {/* Videos */}
                                {property.videoUrls.length > 0 && (
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="text-xl font-bold mb-4">Property Videos</h2>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {property.videoUrls.map((url, i) => (
                                                <div key={i} className="rounded-xl overflow-hidden border border-gray-100 bg-black aspect-video relative group cursor-pointer">
                                                    <video src={url} className="w-full h-full object-cover opacity-80" />
                                                    <div onClick={() => openLightbox(property.images.length + i)} className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all">
                                                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                                                            <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-brand-dark border-b-[8px] border-b-transparent ml-1"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>

                            {/* Right sidebar */}
                            <div className="space-y-6">
                                {/* Verification Report */}
                                <div className="bg-gradient-to-b from-green-50 to-white p-6 rounded-2xl shadow-sm border border-green-100">
                                    <div className="flex items-center space-x-3 mb-5 border-b border-green-100 pb-4">
                                        <div className="bg-brand-green p-2 rounded-full">
                                            <ShieldCheck className="w-5 h-5 text-white" />
                                        </div>
                                        <h2 className="text-lg font-bold text-brand-dark">Verification Report</h2>
                                    </div>
                                    <div className="space-y-4 mb-5">
                                        <VerificationItem label="Ownership Verified" status={property.verification.ownership} />
                                        <VerificationItem label="Documents Checked" status={property.verification.documents} />
                                        <VerificationItem label="Survey Verified" status={property.verification.survey} />
                                        <VerificationItem label="Location Verified" status={property.verification.location} />
                                        <VerificationItem label="Free from Govt Acquisition" status={property.verification.freeFromAcquisition} />
                                    </div>
                                     <button
                                         onClick={() => {
                                             if (property.verification.reportUrl) {
                                                 setPdfUrl(property.verification.reportUrl);
                                             } else {
                                                 alert('The final verification report is currently being processed by our legal team.');
                                             }
                                         }}
                                         title={property.verification.reportUrl ? 'Read full report' : 'Report coming soon'}
                                         className={`w-full border-2 font-bold py-3 rounded-xl transition-colors flex justify-center items-center ${property.verification.reportUrl ? 'border-brand-green text-brand-green hover:bg-brand-green hover:text-white' : 'border-gray-200 text-gray-400'}`}>
                                         <FileCheck className="w-5 h-5 mr-2" /> View PDF Report
                                     </button>
                                </div>

                                {/* RealConnect Contact Card */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h2 className="text-lg font-bold mb-4">Listed via RealConnect</h2>
                                    <p className="text-sm text-gray-500 mb-4">All enquiries go through RealConnect to protect buyers and sellers alike. Contact us to get full details and arrange a viewing.</p>
                                    <div className="space-y-3">
                                        <a href={`tel:${REALCONNECT_CONTACT.phone}`}
                                            className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-brand-dark font-semibold py-3 rounded-xl transition-colors flex justify-center items-center text-sm">
                                            <Phone className="w-4 h-4 mr-2" /> {REALCONNECT_CONTACT.phone}
                                        </a>
                                        <a href={`mailto:${REALCONNECT_CONTACT.email}`}
                                            className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-brand-dark font-semibold py-3 rounded-xl transition-colors flex justify-center items-center text-sm">
                                            <Mail className="w-4 h-4 mr-2" /> {REALCONNECT_CONTACT.email}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const FactItem = ({ label, value }) => (
    <div>
        <p className="text-gray-500 text-sm mb-1">{label}</p>
        <p className="font-semibold">{value || '—'}</p>
    </div>
);

const VerificationItem = ({ label, status }) => (
    <div className="flex items-center justify-between">
        <span className="text-gray-700 font-medium text-sm">{label}</span>
        {status ? (
            <div className="flex items-center text-brand-green font-bold text-xs bg-white px-2 py-1 rounded shadow-sm border border-green-100">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Yes
            </div>
        ) : (
            <div className="flex items-center text-gray-400 font-bold text-xs bg-white px-2 py-1 rounded shadow-sm border border-gray-100">
                No
            </div>
        )}
    </div>
);

export default PropertyDetails;
