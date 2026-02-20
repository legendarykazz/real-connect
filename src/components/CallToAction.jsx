import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CallToAction = () => {
    return (
        <section className="py-24 bg-brand-green relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-10">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M0 40L40 0H20L0 20M40 40V20L20 40" fill="currentColor" fillOpacity="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#pattern)" />
                </svg>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">
                    Have land to sell?
                </h2>
                <p className="text-xl text-green-50 mb-10 max-w-2xl mx-auto">
                    List your land with RealConnect and reach serious buyers. We verify your property before publishing it on our platform to ensure trust and speed up your sale.
                </p>
                <Link to="/list-property" className="bg-white text-brand-green px-10 py-5 rounded-full font-bold text-lg hover:bg-gray-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center">
                    List Your Land / Contact Us
                    <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
            </div>
        </section>
    );
};

export default CallToAction;
