import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
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
                        <button className="text-brand-dark">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
