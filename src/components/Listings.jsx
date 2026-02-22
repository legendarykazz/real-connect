import React, { useEffect, useState } from 'react';
import { BadgeCheck, MapPin, Maximize, ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Listings = () => {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const { data, error } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('status', 'approved')
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (error) throw error;
                setListings(data || []);
            } catch (err) {
                console.error('Error fetching homepage listings:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLatest();
    }, []);

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

                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
                                <div className="h-64 bg-gray-200" />
                                <div className="p-6 space-y-4">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                                    <div className="h-10 bg-gray-100 rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty state */}
                {!loading && listings.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-3xl">
                        <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Home className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-2">No listings yet</h3>
                        <p className="text-gray-500 mb-6">Be the first to list your property with RealConnect.</p>
                        <Link to="/list-property" className="inline-block bg-brand-green text-white font-bold px-8 py-3 rounded-xl hover:bg-green-700 transition-colors">
                            List Your Property
                        </Link>
                    </div>
                )}

                {/* Live listings from Supabase */}
                {!loading && listings.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {listings.map((listing) => (
                            <div key={listing.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                                <div className="relative h-64 overflow-hidden bg-gray-100">
                                    {listing.image_url ? (
                                        <img
                                            src={listing.image_url}
                                            alt={`Land in ${listing.location}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                            <Home className="w-12 h-12 mb-2" />
                                            <span className="text-sm">No Photo</span>
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center shadow-sm">
                                        <BadgeCheck className="w-5 h-5 mr-1.5 text-brand-light-blue" />
                                        <span className="text-sm font-bold text-brand-dark">VERIFIED</span>
                                    </div>
                                    <div className="absolute top-4 right-4 bg-black/40 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {listing.property_type}
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="mb-4">
                                        <span className="flex items-center text-gray-500 text-sm font-normal mb-1">
                                            <MapPin className="w-4 h-4 mr-1 shrink-0" /> {listing.location}
                                        </span>
                                        <h3 className="text-xl font-bold text-brand-dark">₦{listing.price}</h3>
                                    </div>
                                    <div className="flex items-center mb-6 text-gray-600">
                                        <Maximize className="w-4 h-4 mr-2 opacity-50" />
                                        <span className="text-sm font-medium">{listing.size} sqm</span>
                                        <span className="ml-3 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{listing.title_document}</span>
                                    </div>
                                    <Link
                                        to={`/property/${listing.id}`}
                                        className="w-full block text-center bg-white text-brand-dark border border-gray-200 py-3 rounded-xl font-semibold hover:bg-brand-green hover:text-white hover:border-brand-green transition-all duration-200"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <Link to="/browse" className="md:hidden w-full mt-8 text-brand-light-blue font-semibold flex items-center justify-center hover:text-blue-700 transition-colors">
                    View All Listings <ChevronRight className="w-5 h-5 ml-1" />
                </Link>
            </div>
        </section>
    );
};

export default Listings;
