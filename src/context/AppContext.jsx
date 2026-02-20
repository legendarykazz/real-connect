import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
    return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
    const [agencies, setAgencies] = useState([
        { id: 'AG-01', name: 'Prime Estates Ltd', contact: 'prime@example.com', joined: 'Jan 2025', isTrusted: true },
        { id: 'AG-02', name: 'Ade Properties', contact: 'ade@example.com', joined: 'Mar 2026', isTrusted: false },
        { id: 'AG-03', name: 'Global Land Speculators', contact: 'info@global.com', joined: 'Oct 2026', isTrusted: false },
    ]);

    const [listings, setListings] = useState([
        {
            id: '1',
            title: '500 sqm Land in Lekki Phase 1',
            location: 'Lekki, Lagos',
            size: '500 sqm',
            price: '₦75,000,000',
            image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            features: ['Dry Land', 'C of O'],
            status: 'Approved',
            agencyId: 'AG-01',
            submitter: 'Prime Estates Ltd',
            date: 'Oct 24, 2026'
        },
        {
            id: '2',
            title: 'Corner Piece in Abuja',
            location: 'Abuja, FCT',
            size: '800 sqm',
            price: '₦120,000,000',
            image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            features: ['Corner Piece', 'R of O'],
            status: 'Approved',
            agencyId: 'AG-02',
            submitter: 'Ade Properties',
            date: 'Oct 23, 2026'
        },
        {
            id: '3',
            title: '1 Acre Farmland Epe',
            location: 'Epe, Lagos',
            size: '4000 sqm',
            price: '₦15,000,000',
            image: 'https://images.unsplash.com/photo-1518557984649-0d36c5339c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            features: ['Survey Plan', 'Deed of Assignment'],
            status: 'Pending',
            agencyId: 'AG-03',
            submitter: 'Global Land Speculators',
            date: 'Oct 22, 2026'
        }
    ]);

    const approveListing = (id) => {
        setListings(listings.map(l => l.id === id ? { ...l, status: 'Approved' } : l));
    };

    const rejectListing = (id) => {
        setListings(listings.map(l => l.id === id ? { ...l, status: 'Rejected' } : l));
    };

    const toggleAgencyTrust = (id) => {
        setAgencies(agencies.map(a => a.id === id ? { ...a, isTrusted: !a.isTrusted } : a));
    };

    const addAgency = (newAgency) => {
        setAgencies([{ ...newAgency, id: `AG-${Date.now().toString().slice(-4)}`, joined: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), isTrusted: false }, ...agencies]);
    };

    const editAgency = (updatedAgency) => {
        setAgencies(agencies.map(a => a.id === updatedAgency.id ? updatedAgency : a));
    };

    const addListing = (newListing) => {
        setListings([{ ...newListing, id: Date.now().toString(), date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }, ...listings]);
    };

    return (
        <AppContext.Provider value={{
            agencies, listings, approveListing, rejectListing, toggleAgencyTrust, addAgency, editAgency, addListing
        }}>
            {children}
        </AppContext.Provider>
    );
};
