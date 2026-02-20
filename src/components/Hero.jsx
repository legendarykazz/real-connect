import React from 'react';
import { ShieldCheck, MapPin, FileCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-brand-light">
            {/* Background decorations */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-brand-light-blue/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-4xl mx-auto">
                    <div className="inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-full text-brand-green text-sm font-semibold mb-8 shadow-sm border border-brand-green/20">
                        <ShieldCheck className="w-4 h-4" />
                        <span>100% Verified Land Listings</span>
                    </div>

                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-brand-dark mb-8 leading-tight">
                        Find Verified Land <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green to-brand-light-blue">
                            You Can Trust.
                        </span>
                    </h1>

                    <p className="mt-4 text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
                        Buy land with confidence. RealConnect connects you with carefully verified land listings, complete documentation, and transparent ownership details.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
                        <Link to="/browse" className="w-full sm:w-auto bg-brand-green text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-brand-green/30 transform hover:-translate-y-1 inline-block text-center">
                            Browse Available Lands
                        </Link>
                        <Link to="/list-property" className="w-full sm:w-auto text-center inline-block bg-white text-brand-dark-blue border-2 border-brand-dark-blue/20 px-8 py-4 rounded-full font-bold text-lg hover:border-brand-dark-blue hover:bg-blue-50 transition-all shadow-sm">
                            List Your Property
                        </Link>
                    </div>
                </div>

                {/* Floating features quick info below hero text */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                        <div className="bg-green-50 p-3 rounded-full text-brand-green shrink-0">
                            <FileCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-dark">Ownership Documents</h3>
                            <p className="text-sm text-gray-500">Thoroughly verified</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                        <div className="bg-blue-50 p-3 rounded-full text-brand-light-blue shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-dark">Trusted Sellers</h3>
                            <p className="text-sm text-gray-500">Vetted agents & owners</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-shadow">
                        <div className="bg-gray-50 p-3 rounded-full text-brand-dark shrink-0">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-brand-dark">Clear Locations</h3>
                            <p className="text-sm text-gray-500">Exact coordinates verified</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
