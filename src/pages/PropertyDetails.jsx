import React, { useState } from 'react';
import {
    ArrowLeft, Share2, Heart, Map, ImageIcon,
    CheckCircle2, MapPin, Maximize, CreditCard,
    FileText, ShieldCheck, Download, ExternalLink,
    MessageCircle, Phone, Calendar as CalendarIcon, FileCheck
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const mockProperty = {
    id: "RC-LK-0001",
    title: "Verified 500 sqm Land in Lekki Phase 1",
    price: "₦75,000,000",
    location: "Lekki, Lagos",
    address: "Plot 12, Block 4, Admiralty Way Extension, Lekki Phase 1, Lagos",
    coordinates: { lat: 6.4474, lng: 3.4723 }, // Lekki Phase 1 coordinates
    size: "500 sqm",
    pricePerSqm: "₦150,000",
    type: "Residential",
    topography: "Dry land",
    titleDocument: "C of O",
    surveyPlan: "Available (Yes)",
    status: "Available",
    verification: {
        ownership: true,
        documents: true,
        survey: true,
        location: true,
        freeFromAcquisition: true
    },
    description: "This is a premium dry residential land located in the heart of Lekki Phase 1. The land is completely free from government acquisition and comes with a valid Certificate of Occupancy. The area is fully developed with excellent road access, reliable electricity, and top-tier security. It is highly suitable for building a luxury residential home or for immediate investment purposes given the rapid appreciation rate in the neighborhood.",
    features: [
        "Good road access", "Dry land", "Fully serviced area",
        "Close to main road", "Electricity available",
        "Gated estate", "Good drainage", "Fast developing area"
    ],
    documents: [
        { name: "Certificate of Occupancy", type: "PDF" },
        { name: "Survey Plan", type: "PDF" },
        { name: "Deed of Assignment (Draft)", type: "PDF" }
    ],
    seller: {
        name: "Adeola Properties Ltd",
        type: "Agency",
        verified: true,
        phone: "+234 800 123 4567"
    },
    images: [
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1500076656116-558758c991c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1518557984649-0d36c5339c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
    ]
};

const PropertyDetails = () => {
    const { id } = useParams();
    const { listings, agencies } = useAppContext();
    const [viewMode, setViewMode] = useState('gallery'); // 'gallery' | 'map'
    const [isSaved, setIsSaved] = useState(false);

    // Merge context data with mock data structure for dynamic display
    const contextProperty = listings.find(l => l.id.toString() === id) || listings[0];
    const agency = agencies.find(a => a.id === contextProperty?.agencyId);
    const isTrusted = agency?.isTrusted || false;

    const property = {
        ...mockProperty,
        ...contextProperty,
        images: [contextProperty?.image || mockProperty.images[0], ...mockProperty.images.slice(1)],
        seller: {
            name: agency ? agency.name : (contextProperty?.submitter || "Adeola Properties"),
            type: agency ? "Agency" : "Individual",
            verified: isTrusted,
            phone: agency?.contact || "+234 800 123 4567"
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: property.title,
                    text: `Check out this property: ${property.title}`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
    };

    const handleScheduleInspection = () => {
        alert("Inspection scheduling module would open here.");
    };

    const handleViewDocument = (docName) => {
        alert(`Opening document: ${docName}`);
    };

    const handleDownloadDocument = (docName) => {
        alert(`Downloading document: ${docName}`);
    };

    const handleViewReport = () => {
        alert("Downloading RealConnect Verification PDF Report...");
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans text-brand-dark">

            {/* Navbar / Top Actions */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/browse" className="flex items-center text-gray-600 hover:text-brand-green transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        <span className="font-semibold">Back to Listings</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleShare}
                            className="p-2 text-gray-600 hover:text-brand-light-blue hover:bg-blue-50 rounded-full transition-colors flex items-center justify-center">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSave}
                            className={`p-2 rounded-full transition-colors flex items-center justify-center ${isSaved ? 'text-red-500 bg-red-50' : 'text-gray-600 hover:text-red-500 hover:bg-red-50'}`}>
                            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

                {/* 1. Header & Media Gallery */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                    {/* Media Column (Left) */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-end space-x-2 mb-2 absolute z-10 p-4">
                            <button
                                onClick={() => setViewMode('gallery')}
                                className={`px-4 py-2 text-sm font-semibold rounded-full shadow-md flex items-center transition-colors ${viewMode === 'gallery' ? 'bg-white text-brand-dark' : 'bg-gray-800/60 text-white hover:bg-gray-800'}`}
                            >
                                <ImageIcon className="w-4 h-4 mr-2" /> Photos
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`px-4 py-2 text-sm font-semibold rounded-full shadow-md flex items-center transition-colors ${viewMode === 'map' ? 'bg-white text-brand-dark' : 'bg-gray-800/60 text-white hover:bg-gray-800'}`}
                            >
                                <Map className="w-4 h-4 mr-2" /> Map
                            </button>
                        </div>

                        {viewMode === 'gallery' ? (
                            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-sm">
                                <div className="col-span-4 md:col-span-3 row-span-2 relative group cursor-pointer h-full">
                                    <img src={property.images[0]} alt="Main Property View" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                </div>
                                <div className="hidden md:block col-span-1 row-span-1 relative group cursor-pointer h-full overflow-hidden">
                                    <img src={property.images[1]} alt="Property View 2" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                </div>
                                <div className="hidden md:block col-span-1 row-span-1 relative group cursor-pointer h-full overflow-hidden">
                                    <img src={property.images[2]} alt="Property View 3" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center transition-opacity hover:bg-black/40">
                                        <span className="text-white font-bold text-lg">+5 Photos</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-sm relative">
                                <iframe
                                    className="w-full h-full border-0"
                                    loading="lazy"
                                    allowFullScreen
                                    src={`https://maps.google.com/maps?q=${property.coordinates.lat},${property.coordinates.lng}&z=15&output=embed`}
                                    title="Property Location"
                                ></iframe>
                            </div>
                        )}
                    </div>

                    {/* Basic Summary Column (Right) */}
                    <div className="flex flex-col">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
                            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                                <span>ID: {property.id}</span>
                                <span>•</span>
                                <span className={`font-semibold ${property.status === 'Available' ? 'text-brand-green' : 'text-orange-500'}`}>
                                    {property.status}
                                </span>
                            </div>

                            <h1 className="text-2xl md:text-3xl font-bold text-brand-dark mb-4 leading-tight">
                                {property.title}
                            </h1>

                            <div className="text-3xl font-bold text-brand-light-blue mb-6">
                                {property.price}
                            </div>

                            <div className="bg-green-50 rounded-xl p-4 mb-8 flex items-start border border-green-100">
                                <CheckCircle2 className="w-6 h-6 text-brand-green mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-green-900 mb-1">Verified by RealConnect</h4>
                                    <p className="text-sm text-green-700">This property has passed our stringent 5-point verification check for your safety.</p>
                                </div>
                            </div>

                            <div className="mt-auto space-y-3">
                                <a href={`tel:${property.seller.phone.replace(/[^0-9+]/g, '')}`} className="w-full bg-brand-light-blue hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex justify-center items-center">
                                    <Phone className="w-5 h-5 mr-2" /> Contact Agent
                                </a>
                                <a href={`https://wa.me/${property.seller.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-full bg-brand-green hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-md transition-colors flex justify-center items-center">
                                    <MessageCircle className="w-5 h-5 mr-2" /> Chat on WhatsApp
                                </a>
                                <button onClick={handleScheduleInspection} className="w-full bg-white hover:bg-gray-50 text-brand-dark border border-gray-200 font-bold py-4 rounded-xl transition-colors flex justify-center items-center">
                                    <CalendarIcon className="w-5 h-5 mr-2" /> Schedule Inspection
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Detail Content (Left 2 columns) */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 2. Key Property Information */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Key Facts</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Location</p>
                                    <p className="font-semibold">{property.location}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Land Size</p>
                                    <p className="font-semibold">{property.size}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Price per sqm</p>
                                    <p className="font-semibold">{property.pricePerSqm}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Type</p>
                                    <p className="font-semibold">{property.type}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Topography</p>
                                    <p className="font-semibold">{property.topography}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Title Document</p>
                                    <p className="font-semibold">{property.titleDocument}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Survey Plan</p>
                                    <p className="font-semibold">{property.surveyPlan}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm mb-1">Seller Type</p>
                                    <p className="font-semibold flex items-center">
                                        {property.seller.type}
                                        {property.seller.verified && (
                                            <CheckCircle2 className="w-4 h-4 text-brand-light-blue ml-1.5" />
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* 4. Description */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-4">Property Description</h2>
                            <p className="text-gray-600 leading-relaxed">
                                {property.description}
                            </p>
                        </div>

                        {/* 5. Features & Amenities */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold mb-6">Features & Amenities</h2>
                            <div className="grid grid-cols-2 gap-4">
                                {property.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center text-gray-700">
                                        <CheckCircle2 className="w-5 h-5 text-brand-green mr-3 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 7. Documents Section */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">Documents</h2>
                            </div>
                            <div className="space-y-4">
                                {property.documents.map((doc, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center">
                                            <div className="bg-gray-100 p-2 rounded-lg mr-4">
                                                <FileText className="w-6 h-6 text-gray-500" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-brand-dark">{doc.name}</h4>
                                                <p className="text-xs text-gray-500">{doc.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button onClick={() => handleViewDocument(doc.name)} className="p-2 text-brand-light-blue hover:bg-blue-50 rounded-lg transition-colors" title="View">
                                                <ExternalLink className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDownloadDocument(doc.name)} className="p-2 text-brand-green hover:bg-green-50 rounded-lg transition-colors" title="Download">
                                                <Download className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Sidebar Content (Right column) */}
                    <div className="space-y-8">

                        {/* 3. Verification Details  */}
                        <div className="bg-gradient-to-b from-green-50 to-white p-6 rounded-2xl shadow-sm border border-green-100">
                            <div className="flex items-center space-x-3 mb-6 border-b border-green-100 pb-4">
                                <div className="bg-brand-green p-2 rounded-full">
                                    <ShieldCheck className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-brand-dark">Verification Report</h2>
                            </div>

                            <div className="space-y-4 mb-6">
                                <VerificationItem label="Ownership Verified" status={property.verification.ownership} />
                                <VerificationItem label="Documents Checked" status={property.verification.documents} />
                                <VerificationItem label="Survey Verified" status={property.verification.survey} />
                                <VerificationItem label="Location Verified" status={property.verification.location} />
                                <VerificationItem label="Free from Govt Acquisition" status={property.verification.freeFromAcquisition} />
                            </div>

                            <button onClick={handleViewReport} className="w-full border-2 border-brand-green text-brand-green hover:bg-brand-green hover:text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center">
                                <FileCheck className="w-5 h-5 mr-2" /> View PDF Report
                            </button>
                        </div>


                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for verification list items
const VerificationItem = ({ label, status }) => (
    <div className="flex items-center justify-between">
        <span className="text-gray-700 font-medium">{label}</span>
        {status ? (
            <div className="flex items-center text-brand-green font-bold text-sm bg-white px-2 py-1 rounded shadow-sm">
                <CheckCircle2 className="w-4 h-4 mr-1" /> Yes
            </div>
        ) : (
            <div className="flex items-center text-gray-400 font-bold text-sm bg-white px-2 py-1 rounded shadow-sm">
                No
            </div>
        )}
    </div>
);

export default PropertyDetails;
