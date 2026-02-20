import React from 'react';
import { CheckCircle2, User, ChevronDown, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAppContext } from '../context/AppContext';

const BrowseLands = () => {
    const { listings, agencies } = useAppContext();
    const approvedListings = listings.filter(l => l.status === 'Approved');

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* Main White Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link to="/">
                        <img src="/logo.png" alt="RealConnect" className="h-8 md:h-10 w-auto" />
                    </Link>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <span onClick={() => alert("Opening filter module...")} className="hidden md:inline cursor-pointer hover:text-brand-green">Location</span>
                        <span onClick={() => alert("Opening filter module...")} className="hidden md:inline cursor-pointer hover:text-brand-green">Price</span>
                        <User onClick={() => alert("Opening user profile...")} className="w-5 h-5 cursor-pointer hover:text-brand-green" />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-brand-dark">Verified Land Listings</h1>
                    <button onClick={() => alert("Opening comprehensive filter module...")} className="flex items-center space-x-2 border border-brand-green text-brand-green px-4 py-2 rounded-md hover:bg-green-50 transition-colors">
                        <span>Filter</span>
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>

                {/* Horizontal Scrollable Feed */}
                <div className="overflow-x-auto pb-8 pt-4 px-4 hidden md:flex space-x-6 snap-x snap-mandatory hide-scrollbar">
                    {approvedListings.map(property => {
                        const agency = agencies.find(a => a.id === property.agencyId);
                        const isTrusted = agency?.isTrusted;

                        return (
                            <div key={property.id} className="min-w-[320px] max-w-[320px] bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 snap-center shrink-0">
                                <Link to={`/property/${property.id}`} className="block relative h-56">
                                    <img src={property.image} alt={property.location} className="w-full h-full object-cover" />
                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center shadow-sm">
                                        <CheckCircle2 className={`w-4 h-4 mr-1 ${isTrusted ? 'text-brand-light-blue' : 'text-brand-green'}`} />
                                        <span className="text-xs font-bold text-brand-dark">VERIFIED {isTrusted ? 'AGENCY' : ''}</span>
                                    </div>
                                </Link>
                                <Link to={`/property/${property.id}`} className="block p-5">
                                    <h3 className="text-xl font-bold text-brand-dark mb-1">{property.price}</h3>
                                    <p className="text-gray-500 font-medium flex justify-between items-center text-sm">
                                        {property.location} <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{property.size}</span>
                                    </p>
                                </Link>
                            </div>
                        )
                    })}
                </div>

                {/* Vertical Feed for Mobile */}
                <div className="px-4 pb-24 md:hidden space-y-6">
                    {approvedListings.map(property => {
                        const agency = agencies.find(a => a.id === property.agencyId);
                        const isTrusted = agency?.isTrusted;

                        return (
                            <div key={property.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                                <Link to={`/property/${property.id}`} className="block relative h-64">
                                    <img src={property.image} alt={property.location} className="w-full h-full object-cover" />
                                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center shadow-sm">
                                        <CheckCircle2 className={`w-4 h-4 mr-1 ${isTrusted ? 'text-brand-light-blue' : 'text-brand-green'}`} />
                                        <span className="text-xs font-bold text-brand-dark">VERIFIED {isTrusted ? 'AGENCY' : ''}</span>
                                    </div>
                                </Link>
                                <Link to={`/property/${property.id}`} className="block p-5">
                                    <h3 className="text-2xl font-bold text-brand-dark mb-1">{property.price}</h3>
                                    <p className="text-gray-500 font-medium flex justify-between items-center text-sm mb-4">
                                        {property.location} <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{property.size}</span>
                                    </p>
                                </Link>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default BrowseLands;
