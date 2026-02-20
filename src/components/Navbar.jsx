import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center space-x-2 cursor-pointer">
                            <img src="/logo.png" alt="RealConnect Logo" className="h-10 w-auto object-contain" />
                        </Link>
                    </div>

                    <div className="hidden md:flex space-x-8 items-center">
                        <Link to="/browse" className="text-brand-dark hover:text-brand-green font-medium transition-colors">Browse Lands</Link>
                        <Link to="/list-property" className="text-brand-dark hover:text-brand-green font-medium transition-colors">List Property</Link>
                        <button onClick={() => alert("Opening contact form...")} className="bg-brand-green text-white px-6 py-2.5 rounded-full font-medium hover:bg-green-700 transition-colors shadow-md hover:shadow-lg transform hover:-translate-y-0.5 duration-200">
                            Contact Us
                        </button>
                    </div>

                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-brand-dark hover:text-brand-green p-2 transition-colors">
                            {isMobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {isMobileMenuOpen && (
                    <div className="md:hidden pb-6 border-t border-gray-100 pt-4 space-y-4 px-2">
                        <Link to="/browse" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-brand-dark hover:text-brand-green hover:bg-gray-50 rounded-md">Browse Lands</Link>
                        <Link to="/list-property" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-brand-dark hover:text-brand-green hover:bg-gray-50 rounded-md">List Property</Link>
                        <button onClick={() => { alert("Opening contact form..."); setIsMobileMenuOpen(false); }} className="w-full mt-2 bg-brand-green text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors shadow-sm">
                            Contact Us
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
