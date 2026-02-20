import React from 'react';
import { ShieldAlert, SearchCheck, ThumbsUp, CheckCircle2 } from 'lucide-react';

const WhyChooseUs = () => {
    return (
        <section className="py-24 bg-brand-dark text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-light-blue/10 blur-[100px] rounded-full pointer-events-none transform translate-x-1/3"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                            Why Choose <span className="text-brand-green">RealConnect?</span>
                        </h2>
                        <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                            We help buyers avoid land fraud by verifying property documents, ownership details, and location information before listing any land on our platform.
                        </p>

                        <div className="space-y-6">
                            {[
                                "Verified land ownership documents",
                                "Trusted sellers and agents",
                                "Clear property details and location",
                                "Safe and transparent transactions"
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center space-x-4">
                                    <div className="bg-brand-green/20 p-1 rounded-full text-brand-green">
                                        <CheckCircle2 className="w-6 h-6" />
                                    </div>
                                    <span className="text-lg font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        {/* Visual element representing trust/security */}
                        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-8 rounded-3xl relative">
                            <div className="absolute -top-6 -right-6 bg-brand-green w-24 h-24 rounded-full blur-2xl opacity-50"></div>
                            <div className="absolute -bottom-6 -left-6 bg-brand-light-blue w-32 h-32 rounded-full blur-2xl opacity-50"></div>

                            <div className="relative z-10 space-y-8">
                                <div className="bg-brand-dark border border-white/10 p-6 rounded-2xl flex items-start space-x-4 transform transition-transform hover:-translate-y-1">
                                    <ShieldAlert className="w-10 h-10 text-brand-green shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-lg mb-1">Fraud Prevention</h4>
                                        <p className="text-sm text-gray-400">Every listing goes through our 5-point verification check to ensure absolute authenticity.</p>
                                    </div>
                                </div>

                                <div className="bg-brand-dark border border-white/10 p-6 rounded-2xl flex items-start space-x-4 transform transition-transform hover:-translate-y-1">
                                    <SearchCheck className="w-10 h-10 text-brand-light-blue shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-lg mb-1">Document Verification</h4>
                                        <p className="text-sm text-gray-400">Our legal team reviews C of O, survey plans, and deeds before approval.</p>
                                    </div>
                                </div>

                                <div className="bg-brand-dark border border-white/10 p-6 rounded-2xl flex items-start space-x-4 transform transition-transform hover:-translate-y-1">
                                    <ThumbsUp className="w-10 h-10 text-brand-green shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-lg mb-1">Seamless Experience</h4>
                                        <p className="text-sm text-gray-400">From finding the land to contacting the verified seller, everything is streamlined.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default WhyChooseUs;
