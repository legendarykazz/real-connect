import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link to="/" className="inline-flex items-center text-brand-green hover:text-green-700 font-medium transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-brand-dark p-8 sm:p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <FileText className="w-16 h-16 text-brand-green mx-auto mb-6" />
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Terms of Service</h1>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                            Please read these terms carefully before using the RealConnect platform.
                        </p>
                        <p className="text-sm text-gray-400 mt-6">Last Updated: March 2026</p>
                    </div>

                    <div className="p-8 sm:p-12 prose prose-green max-w-none text-gray-700">
                        <div className="space-y-8">

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">1. Acceptance of Terms</h2>
                                <p className="mb-4">
                                    By accessing or using the RealConnect platform (the "Site", "App", or "Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">2. Description of Service</h2>
                                <p className="mb-4">
                                    RealConnect is a verified marketplace that connects land sellers and agents with potential buyers. We facilitate the listing, discovery, and initial connection for real estate transactions. While we strive for verification excellence, users are encouraged to perform their own due diligence before final payments.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">3. User Conduct & Responsibilities</h2>
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li>You must be at least 18 years old to use this service.</li>
                                    <li>You agree to provide accurate and truthful information in your profile and listings.</li>
                                    <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                                    <li>You agree not to use the service for any fraudulent or illegal activities.</li>
                                    <li>Unauthorized scraping of data or interference with the platform's security is strictly prohibited.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">4. Real Estate Listings</h2>
                                <p className="mb-4">
                                    Sellers and agents are solely responsible for the content of their listings. RealConnect reserves the right to remove any listing that is found to be inaccurate, misleading, or in violation of local property laws. Verification "badges" indicate that documents have been reviewed by our team, but they do not constitute a legal guarantee of title.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">5. Fees and Payments</h2>
                                <p className="mb-4">
                                    RealConnect may charge fees for certain premium listings or verification services. All fees are non-refundable unless otherwise specified. We do not currently process direct property purchase payments through the platform; final transactions occur offline between the parties.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">6. Limitation of Liability</h2>
                                <p className="mb-4">
                                    RealConnect is not liable for any direct, indirect, or incidental damages arising from your use of the platform or any transactions resulting from connections made on the site. We are a marketplace, not a party to the actual sale of property.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">7. Changes to Terms</h2>
                                <p className="mb-4">
                                    We reserve the right to modify these terms at any time. Significant changes will be notified via email or a prominent notice on the site. Your continued use of the service after such changes constitutes acceptance of the new terms.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">8. Contact Us</h2>
                                <p className="mb-4">
                                    If you have any questions about these Terms of Service, please contact us at:
                                </p>
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <p className="font-medium text-brand-dark">RealConnect Africa</p>
                                    <p className="text-brand-green font-medium">realconnectpropertyhub@gmail.com</p>
                                </div>
                            </section>

                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} RealConnect Africa. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
