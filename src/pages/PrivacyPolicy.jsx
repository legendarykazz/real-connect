import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const PrivacyPolicy = () => {
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
                        <Shield className="w-16 h-16 text-brand-green mx-auto mb-6" />
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Privacy Policy</h1>
                        <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                            Your privacy is critically important to us at RealConnect. This policy explains how we collect, use, and protect your personal information.
                        </p>
                        <p className="text-sm text-gray-400 mt-6">Last Updated: March 2026</p>
                    </div>

                    <div className="p-8 sm:p-12 prose prose-green max-w-none text-gray-700">
                        <div className="space-y-8">

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">1. Information We Collect</h2>
                                <p className="mb-3">We collect information to provide better services to all our users. The types of personal information we obtain include:</p>
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li><strong>Contact Information:</strong> First name, last name, phone number, and email address when you register for an account.</li>
                                    <li><strong>Account Data:</strong> Passwords (securely hashed) and profile preferences.</li>
                                    <li><strong>Property Data:</strong> Details about properties you list, including location coordinates, descriptions, prices, title documents, images, and videos.</li>
                                    <li><strong>Usage Data:</strong> Information about how you interact with our website and mobile application.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">2. How We Use Your Information</h2>
                                <p className="mb-3">We use the information we collect from all our services for the following purposes:</p>
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li>To provide, maintain, and improve our platform (RealConnect).</li>
                                    <li>To safely connect property sellers with potential buyers and agents.</li>
                                    <li>To communicate with you via email or push notifications regarding property approvals, rejections, updates, or security alerts.</li>
                                    <li>To enforce our terms, conditions, and policies to protect against fraud or abuse.</li>
                                    <li>To verify the authenticity of real estate listings and protect our users from scams.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">3. Information Sharing and Disclosure</h2>
                                <p className="mb-3">RealConnect does not sell your personal information to third parties. We only share information under the following circumstances:</p>
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li><strong>With Other Users:</strong> Only public listing information (property details, images, sizes, locations) is shared with platform visitors. Your direct contact details are kept private unless explicitly requested during a transaction inquiry.</li>
                                    <li><strong>Service Providers:</strong> We use trusted third-party services (like Supabase for database hosting and Resend for emails) who process your data strictly on our behalf under strict confidentiality agreements.</li>
                                    <li><strong>Legal Requirements:</strong> We may disclose information if required by law, regulation, or legally binding governmental request.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">4. Data Security</h2>
                                <p className="mb-4">
                                    We employ industry-standard security measures, including Row Level Security (RLS) in our database, Secure Sockets Layer (SSL) encryption, and secure application constraints to protect your data from unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is ever 100% secure, and we cannot guarantee absolute security.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">5. Your Data Rights</h2>
                                <p className="mb-3">Depending on your location, you have the right to:</p>
                                <ul className="list-disc pl-6 space-y-2 mb-4">
                                    <li>Access the personal data we hold about you.</li>
                                    <li>Request immediate correction of inaccurate or incomplete data.</li>
                                    <li>Request the deletion of your account and associated personal data from our servers.</li>
                                    <li>Opt-out of non-essential marketing communications.</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-brand-dark mb-4 pb-2 border-b border-gray-100">6. Contact Us</h2>
                                <p className="mb-4">
                                    If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact our support team at:
                                </p>
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                    <p className="font-medium text-brand-dark">RealConnect Africa</p>
                                    <p className="text-brand-green font-medium">support@realconnectafrica.com</p>
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

export default PrivacyPolicy;
