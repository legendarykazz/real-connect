import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, User, ChevronDown, X, Search, SlidersHorizontal, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const BrowseLands = () => {
    const [allListings, setAllListings] = useState([]); // All fetched from DB
    const [filteredListings, setFilteredListings] = useState([]); // After filters applied
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Filter state
    const [locationQuery, setLocationQuery] = useState('');
    const [priceMax, setPriceMax] = useState('');
    const [priceMin, setPriceMin] = useState('');
    const [propertyType, setPropertyType] = useState('All');
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showPriceDropdown, setShowPriceDropdown] = useState(false);
    const [showFilterPanel, setShowFilterPanel] = useState(false);

    const locationRef = useRef(null);
    const priceRef = useRef(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handle = (e) => {
            if (locationRef.current && !locationRef.current.contains(e.target)) setShowLocationDropdown(false);
            if (priceRef.current && !priceRef.current.contains(e.target)) setShowPriceDropdown(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const { data, error } = await supabase
                    .from('properties')
                    .select('*')
                    .eq('status', 'approved')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setAllListings(data || []);
                setFilteredListings(data || []);
            } catch (err) {
                console.error("Error fetching properties:", err);
                setError("Failed to load property listings. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        fetchProperties();
    }, []);

    // Apply filters whenever filter state changes
    useEffect(() => {
        let result = [...allListings];

        if (locationQuery.trim()) {
            result = result.filter(p =>
                p.location.toLowerCase().includes(locationQuery.toLowerCase())
            );
        }

        if (propertyType !== 'All') {
            result = result.filter(p => p.property_type === propertyType);
        }

        if (priceMin) {
            result = result.filter(p => {
                const price = parseFloat(p.price.replace(/[^0-9.]/g, ''));
                return price >= parseFloat(priceMin);
            });
        }

        if (priceMax) {
            result = result.filter(p => {
                const price = parseFloat(p.price.replace(/[^0-9.]/g, ''));
                return price <= parseFloat(priceMax);
            });
        }

        setFilteredListings(result);
    }, [locationQuery, priceMin, priceMax, propertyType, allListings]);

    const clearAllFilters = () => {
        setLocationQuery('');
        setPriceMin('');
        setPriceMax('');
        setPropertyType('All');
    };

    const hasActiveFilters = locationQuery || priceMin || priceMax || propertyType !== 'All';

    // Unique locations for suggestions
    const locationSuggestions = [...new Set(allListings.map(p => p.location))]
        .filter(loc => locationQuery && loc.toLowerCase().includes(locationQuery.toLowerCase()))
        .slice(0, 5);

    const PropertyCard = ({ property, mobile = false }) => (
        <div className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 ${!mobile ? 'min-w-[320px] max-w-[320px] snap-center shrink-0' : ''}`}>
            <Link to={`/property/${property.id}`} className="block relative h-56 bg-gray-100">
                {property.image_url ? (
                    <img src={property.image_url} alt={property.location} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                        <Home className="w-12 h-12 mb-2" />
                        <span className="text-sm">No Photo</span>
                    </div>
                )}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full flex items-center shadow-sm">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-brand-light-blue" />
                    <span className="text-xs font-bold text-brand-dark">VERIFIED</span>
                </div>
                <div className="absolute top-4 right-4 bg-black/40 backdrop-blur text-white text-xs font-bold px-2 py-1 rounded-full">
                    {property.property_type}
                </div>
                {property.availability === 'sold' && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                        <span className="bg-red-600 text-white px-4 py-2 rounded-full font-black text-lg tracking-wider transform -rotate-12 border-2 border-white">SOLD</span>
                    </div>
                )}
                {property.availability === 'not_available' && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
                        <span className="bg-gray-800 text-white px-4 py-2 rounded-full font-black text-sm tracking-wider border-2 border-white">NOT AVAILABLE</span>
                    </div>
                )}
            </Link>
            <Link to={`/property/${property.id}`} className="block p-5">
                <h3 className="text-xl font-bold text-brand-dark mb-1">₦{property.price}</h3>
                <p className="text-gray-500 font-medium flex justify-between items-center text-sm">
                    <span className="truncate mr-2">{property.location}</span>
                    <span className="text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md shrink-0">{property.size} sqm</span>
                </p>
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
                    <Link to="/">
                        <img src="/logo.png" alt="RealConnect" className="h-8 md:h-10 w-auto" />
                    </Link>

                    {/* Location Filter Dropdown */}
                    <div className="flex items-center gap-2 flex-1 justify-center">
                        <div ref={locationRef} className="relative">
                            <button
                                onClick={() => { setShowLocationDropdown(!showLocationDropdown); setShowPriceDropdown(false); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${locationQuery ? 'bg-brand-green text-white border-brand-green' : 'border-gray-200 text-gray-700 hover:border-brand-green hover:text-brand-green'}`}
                            >
                                <Search className="w-3.5 h-3.5" />
                                {locationQuery ? locationQuery.slice(0, 12) + (locationQuery.length > 12 ? '...' : '') : 'Location'}
                                {locationQuery ? <X className="w-3.5 h-3.5 ml-1" onClick={(e) => { e.stopPropagation(); setLocationQuery(''); }} /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            {showLocationDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Search by Location</p>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={locationQuery}
                                        onChange={e => setLocationQuery(e.target.value)}
                                        placeholder="e.g. Lekki, Abuja, Ibadan..."
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                                    />
                                    {locationSuggestions.length > 0 && (
                                        <ul className="mt-2 space-y-1">
                                            {locationSuggestions.map((loc, i) => (
                                                <li key={i} onClick={() => { setLocationQuery(loc); setShowLocationDropdown(false); }}
                                                    className="px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-brand-green rounded-lg cursor-pointer">
                                                    📍 {loc}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    <button onClick={() => setShowLocationDropdown(false)} className="mt-3 w-full bg-brand-green text-white text-sm font-bold py-2 rounded-xl hover:bg-green-700 transition-colors">
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Price Filter Dropdown */}
                        <div ref={priceRef} className="relative hidden md:block">
                            <button
                                onClick={() => { setShowPriceDropdown(!showPriceDropdown); setShowLocationDropdown(false); }}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${(priceMin || priceMax) ? 'bg-brand-green text-white border-brand-green' : 'border-gray-200 text-gray-700 hover:border-brand-green hover:text-brand-green'}`}
                            >
                                {(priceMin || priceMax) ? `₦${priceMin || '0'} – ₦${priceMax || '∞'}` : 'Price'}
                                {(priceMin || priceMax) ? <X className="w-3.5 h-3.5 ml-1" onClick={(e) => { e.stopPropagation(); setPriceMin(''); setPriceMax(''); }} /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                            {showPriceDropdown && (
                                <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-3">Price Range (₦)</p>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Min Price</label>
                                            <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="e.g. 5000000"
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-500 mb-1 block">Max Price</label>
                                            <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="e.g. 100000000"
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                                        </div>
                                    </div>
                                    {/* Quick presets */}
                                    <div className="grid grid-cols-2 gap-2 mb-3">
                                        {[['Under ₦10M', '', '10000000'], ['₦10M – ₦50M', '10000000', '50000000'], ['₦50M – ₦100M', '50000000', '100000000'], ['Over ₦100M', '100000000', '']].map(([label, min, max]) => (
                                            <button key={label} onClick={() => { setPriceMin(min); setPriceMax(max); }}
                                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 hover:border-brand-green hover:text-brand-green transition-colors">
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => setShowPriceDropdown(false)} className="w-full bg-brand-green text-white text-sm font-bold py-2 rounded-xl hover:bg-green-700 transition-colors">
                                        Apply
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilterPanel(!showFilterPanel)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${showFilterPanel || hasActiveFilters ? 'bg-brand-dark text-white border-brand-dark' : 'border-gray-200 text-gray-700 hover:border-brand-dark hover:text-brand-dark'}`}
                        >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Filter</span>
                            {hasActiveFilters && <span className="bg-brand-green text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{filteredListings.length}</span>}
                        </button>
                        <button onClick={() => navigate('/login')} className="p-2 rounded-full hover:bg-gray-100 transition-colors" title="Login">
                            <User className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Expanded Filter Panel */}
                {showFilterPanel && (
                    <div className="max-w-7xl mx-auto mt-4 pb-4 border-t border-gray-100 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Property Type</label>
                            <select value={propertyType} onChange={e => setPropertyType(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-green">
                                <option value="All">All Types</option>
                                <option>Residential</option>
                                <option>Commercial</option>
                                <option>Agricultural</option>
                                <option>Mixed Use</option>
                            </select>
                        </div>
                        <div className="md:hidden">
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Min Price (₦)</label>
                            <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="e.g. 5000000"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                        </div>
                        <div className="md:hidden">
                            <label className="text-xs font-bold text-gray-500 mb-1.5 block">Max Price (₦)</label>
                            <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="e.g. 100000000"
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                        </div>
                        {hasActiveFilters && (
                            <div className="col-span-2 md:col-span-1 flex items-end">
                                <button onClick={clearAllFilters} className="w-full flex items-center justify-center gap-2 text-sm font-bold text-red-500 border border-red-200 rounded-xl py-2 hover:bg-red-50 transition-colors">
                                    <X className="w-4 h-4" /> Clear All Filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-brand-dark">Verified Land Listings</h1>
                        {!loading && (
                            <p className="text-sm text-gray-500 mt-1">
                                {filteredListings.length} {filteredListings.length === 1 ? 'property' : 'properties'} found
                                {hasActiveFilters && ' (filtered)'}
                            </p>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <button onClick={clearAllFilters} className="text-sm text-red-500 font-semibold flex items-center gap-1 hover:underline">
                            <X className="w-4 h-4" /> Clear filters
                        </button>
                    )}
                </div>

                {loading && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
                                <div className="h-56 bg-gray-200" />
                                <div className="p-5 space-y-3">
                                    <div className="h-5 bg-gray-200 rounded-lg w-3/4" />
                                    <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {error && <div className="bg-red-50 p-4 text-red-600 rounded-xl mb-6">{error}</div>}

                {!loading && !error && filteredListings.length === 0 && (
                    <div className="text-center py-24 px-4">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                            <Home className="w-10 h-10 text-brand-green" />
                        </div>
                        <h2 className="text-2xl font-bold text-brand-dark mb-3">
                            {hasActiveFilters ? 'No results found' : 'No listings yet'}
                        </h2>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                            {hasActiveFilters ? 'Try adjusting your filters to see more properties.' : 'Be the first to list your property! All submissions are reviewed and verified by our team before going live.'}
                        </p>
                        {hasActiveFilters ? (
                            <button onClick={clearAllFilters} className="inline-block bg-brand-dark text-white font-bold px-8 py-4 rounded-2xl shadow-md hover:bg-gray-900 transition-colors">
                                Clear Filters
                            </button>
                        ) : (
                            <Link to="/list-property" className="inline-block bg-brand-green text-white font-bold px-8 py-4 rounded-2xl shadow-md hover:bg-green-700 transition-colors">
                                List Your Property
                            </Link>
                        )}
                    </div>
                )}

                {/* Desktop: Horizontal scroll */}
                {!loading && !error && filteredListings.length > 0 && (
                    <div className="overflow-x-auto pb-8 pt-4 -mx-4 px-4 hidden md:flex space-x-6 snap-x snap-mandatory hide-scrollbar">
                        {filteredListings.map(property => <PropertyCard key={property.id} property={property} />)}
                    </div>
                )}

                {/* Mobile: Vertical list */}
                {!loading && !error && filteredListings.length > 0 && (
                    <div className="pb-24 md:hidden space-y-6">
                        {filteredListings.map(property => <PropertyCard key={property.id} property={property} mobile />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseLands;
