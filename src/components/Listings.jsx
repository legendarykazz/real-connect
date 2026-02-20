import React from 'react';
import { BadgeCheck, MapPin, Maximize, CreditCard, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAppContext } from '../context/AppContext';

const Listings = () => {
    const { listings, agencies } = useAppContext();
    const approvedListings = listings.filter(l => l.status === 'Approved');
    return (
        <section className="py-24 bg-white" id="listings">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-brand-dark mb-4">Available Verified Lands</h2>
                        <p className="text-gray-600 max-w-2xl">Browse our curated selection of verified properties. Every listing has undergone strict documentation and location checks.</p>
                    </div>
                    <Link to="/browse" className="hidden text-brand-light-blue font-semibold md:flex items-center hover:text-blue-700 transition-colors">
                        View All Listings <ChevronRight className="w-5 h-5 ml-1" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {approvedListings.slice(0, 3).map((listing) => {
                        const agency = agencies.find(a => a.id === listing.agencyId);
                        const isTrusted = agency?.isTrusted;

                        return (
                            <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={listing.image}
                                        alt={`Land in ${listing.location}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center shadow-sm">
                                        <BadgeCheck className={`w-5 h-5 mr-1.5 ${isTrusted ? 'text-brand-light-blue' : 'text-brand-green'}`} />
                                        <span className="text-sm font-bold text-brand-dark">VERIFIED {isTrusted ? 'AGENCY' : ''}</span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-brand-dark flex flex-col">
                                            <span className="flex items-center text-gray-500 text-sm font-normal mb-1">
                                                <MapPin className="w-4 h-4 mr-1" /> {listing.location}
                                            </span>
                                            {listing.price}
                                        </h3>
                                    </div>

                                    <div className="flex items-center space-x-6 mb-6">
                                        <div className="flex items-center text-gray-600">
                                            <Maximize className="w-4 h-4 mr-2 opacity-50" />
                                            <span className="text-sm font-medium">{listing.size}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {listing.features.map((feature, idx) => (
                                            <span key={idx} className="bg-gray-50 text-gray-600 text-xs px-3 py-1 rounded-full border border-gray-100">
                                                {feature}
                                            </span>
                                        ))}
                                    </div>

                                    <Link to={`/property/${listing.id}`} className="w-full block text-center bg-white text-brand-dark border border-gray-200 py-3 rounded-xl font-semibold hover:bg-brand-green hover:text-white hover:border-brand-green transition-all duration-200">
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <Link to="/browse" className="md:hidden w-full mt-8 text-brand-light-blue font-semibold flex items-center justify-center hover:text-blue-700 transition-colors">
                    View All Listings <ChevronRight className="w-5 h-5 ml-1" />
                </Link>
            </div>
        </section>
    );
};

export default Listings;
