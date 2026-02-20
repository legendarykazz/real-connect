import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-brand-dark text-white pt-20 pb-10 border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    <div className="lg:col-span-1">
                        <div className="flex items-center space-x-2 mb-6 cursor-pointer">
                            <img src="/logo.png" alt="RealConnect Logo" className="h-12 w-auto object-contain bg-white px-2 py-1 rounded-lg" />
                        </div>
                        <p className="text-gray-400 mb-6 font-medium">Trusted Verified Land Marketplace</p>
                        <div className="flex space-x-4 text-sm font-semibold text-brand-green">
                            <span>Secure</span>
                            <span className="text-gray-600">•</span>
                            <span>Transparent</span>
                            <span className="text-gray-600">•</span>
                            <span>Reliable</span>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-6">Contact RealConnect</h3>
                        <p className="text-gray-400 mb-6">Want your land displayed? Have questions about a property? Reach out to us — we're ready to help.</p>
                        <ul className="space-y-4">
                            <li className="flex items-center text-gray-300 hover:text-brand-green transition-colors cursor-pointer">
                                <Mail className="w-5 h-5 mr-3 shrink-0" />
                                <span>info@realconnect.com</span>
                            </li>
                            <li className="flex items-center text-gray-300 hover:text-brand-green transition-colors cursor-pointer">
                                <Phone className="w-5 h-5 mr-3 shrink-0" />
                                <span>+234 XXX XXX XXXX</span>
                            </li>
                            <li className="flex items-center text-gray-300">
                                <MapPin className="w-5 h-5 mr-3 shrink-0" />
                                <span>Nigeria</span>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-6">Quick Links</h3>
                        <ul className="space-y-4">
                            <li><Link to="/browse" className="text-gray-400 hover:text-brand-light-blue transition-colors">Browse Lands</Link></li>
                            <li><Link to="/list-property" className="text-gray-400 hover:text-brand-light-blue transition-colors text-left block w-full">List Property</Link></li>
                            <li><button onClick={() => alert("Opening contact form...")} className="text-gray-400 hover:text-brand-light-blue transition-colors text-left">Contact Us</button></li>
                            <li><button onClick={() => alert("Loading Privacy Policy...")} className="text-gray-400 hover:text-brand-light-blue transition-colors text-left">Privacy Policy</button></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-500 text-sm mb-4 md:mb-0">
                        © {new Date().getFullYear()} RealConnect. All rights reserved.
                    </p>
                    <div className="flex space-x-6 text-sm text-gray-500">
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
