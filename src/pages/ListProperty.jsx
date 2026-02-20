import React, { useState } from 'react';
import { Camera, MapPin, Tag, CheckCircle2, ChevronRight, FileText, UploadCloud, Info, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const ListProperty = () => {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [formData, setFormData] = useState({
        firstName: '', lastName: '', email: '', phone: '',
        propertyType: 'Residential', location: '', size: '', price: '',
        titleDocument: 'C of O', description: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate API call
        setTimeout(() => {
            setIsSubmitted(true);
            window.scrollTo(0, 0);
        }, 800);
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
                            Browse Allowed Listings
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

                    {/* Section 3: Media Upload Mock */}
                    <div className="mb-12">
                        <div className="flex items-center space-x-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="bg-gray-100 p-2 rounded-lg"><Camera className="w-5 h-5 text-gray-600" /></div>
                            <h2 className="text-2xl font-bold">3. Media & Documents</h2>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
                            <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                <UploadCloud className="w-8 h-8 text-brand-light-blue" />
                            </div>
                            <p className="font-bold text-lg mb-1">Upload Photos & Documents</p>
                            <p className="text-gray-500 text-sm">Drag and drop files here, or click to browse</p>
                            <p className="text-gray-400 text-xs mt-4">Required: At least 3 clear photos, 1 Survey Plan copy</p>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-brand-green hover:bg-green-700 text-white font-extrabold py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 flex justify-center items-center text-lg">
                        Submit For Verification <ChevronRight className="ml-2 w-6 h-6" />
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
