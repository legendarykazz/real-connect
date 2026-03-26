import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Clock, Globe } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: submitError } = await supabase
                .from('contact_messages')
                .insert([
                    {
                        name: formData.name,
                        email: formData.email,
                        phone: formData.phone,
                        subject: formData.subject,
                        message: formData.message,
                    }
                ]);

            if (submitError) throw submitError;

            setSuccess(true);
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
            window.scrollTo(0, 0);
        } catch (err) {
            console.error('Contact error:', err);
            setError(err.message || 'Failed to send message. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    // Abuja, Nigeria coordinates for the map
    const position = [9.0765, 7.3986];

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-16 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-brand-dark mb-4">Get in Touch</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Have questions about a property or want to list your land? Our team is here to help you every step of the way.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    
                    {/* Contact Info Sidebar */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-2xl font-bold text-brand-dark mb-8">Contact Information</h2>
                            
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-green-50 p-3 rounded-2xl">
                                        <Phone className="w-6 h-6 text-brand-green" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Call Us</p>
                                        <a href="tel:+2348123831634" className="text-lg font-bold text-brand-dark hover:text-brand-green transition-colors">+234 812 383 1634</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-50 p-3 rounded-2xl">
                                        <Mail className="w-6 h-6 text-brand-light-blue" />
                                    </div>
                                    <div className="break-all">
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Email Us</p>
                                        <a href="mailto:realconnectpropertyhub@gmail.com" className="text-lg font-bold text-brand-dark hover:text-brand-green transition-colors">realconnectpropertyhub@gmail.com</a>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="bg-orange-50 p-3 rounded-2xl">
                                        <MapPin className="w-6 h-6 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Our Location</p>
                                        <p className="text-lg font-bold text-brand-dark">Nigeria</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-12 border-t border-gray-100 italic text-gray-500 text-sm">
                                "Safe, Transparent, and Reliable Real Estate is our priority."
                            </div>
                        </div>

                        {/* Working Hours */}
                        <div className="bg-brand-dark p-8 rounded-3xl shadow-lg text-white">
                            <div className="flex items-center gap-3 mb-6">
                                <Clock className="w-6 h-6 text-brand-green" />
                                <h3 className="text-xl font-bold">Office Hours</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-gray-400">Monday - Friday</span>
                                    <span className="font-bold text-brand-green">9AM - 6PM</span>
                                </div>
                                <div className="flex justify-between border-b border-white/10 pb-2">
                                    <span className="text-gray-400">Saturday</span>
                                    <span className="font-bold text-brand-green">10AM - 4PM</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Sunday</span>
                                    <span className="text-red-400">Closed</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        {success ? (
                            <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center flex flex-col items-center justify-center min-h-[500px]">
                                <div className="bg-green-100 p-6 rounded-full mb-6">
                                    <CheckCircle2 className="w-16 h-16 text-brand-green" />
                                </div>
                                <h2 className="text-3xl font-extrabold text-brand-dark mb-4">Message Sent!</h2>
                                <p className="text-gray-600 text-lg mb-8 max-w-md">
                                    Thank you for reaching out. We have received your inquiry and our team will get back to you shortly.
                                </p>
                                <button 
                                    onClick={() => setSuccess(false)}
                                    className="bg-brand-green text-white px-10 py-4 rounded-2xl font-bold shadow-xl hover:bg-green-700 transition-all transform hover:-translate-y-1"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Full Name *</label>
                                            <input 
                                                required 
                                                type="text" 
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green outline-none transition-all" 
                                                placeholder="John Doe" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Email Address *</label>
                                            <input 
                                                required 
                                                type="email" 
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green outline-none transition-all" 
                                                placeholder="john@example.com" 
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                            <input 
                                                type="tel" 
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green outline-none transition-all" 
                                                placeholder="+234 ..." 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Subject</label>
                                            <input 
                                                type="text" 
                                                name="subject"
                                                value={formData.subject}
                                                onChange={handleChange}
                                                className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green outline-none transition-all" 
                                                placeholder="How can we help?" 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Message *</label>
                                        <textarea 
                                            required 
                                            rows="6" 
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green outline-none transition-all resize-none" 
                                            placeholder="Tell us more about your inquiry..."
                                        ></textarea>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <button 
                                        disabled={loading}
                                        type="submit" 
                                        className="w-full bg-brand-green hover:bg-green-700 text-white font-extrabold py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 flex justify-center items-center text-lg disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <span className="flex items-center animate-pulse">
                                                <Globe className="w-5 h-5 mr-3 animate-spin" />
                                                Sending Message...
                                            </span>
                                        ) : (
                                            <span className="flex items-center">
                                                Send Message
                                                <Send className="ml-3 w-5 h-5" />
                                            </span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Section */}
                <div className="mt-20">
                    <div className="bg-white p-4 rounded-[40px] shadow-sm border border-gray-100 overflow-hidden h-[450px]">
                        <MapContainer center={position} zoom={13} style={{ height: '100%', width: '100%', borderRadius: '30px' }}>
                            <TileLayer
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker position={position}>
                                <Popup>
                                    <div className="text-center font-sans">
                                        <p className="font-bold text-brand-dark">RealConnect Africa</p>
                                        <p className="text-xs text-gray-500">Trusted Land Marketplace</p>
                                    </div>
                                </Popup>
                            </Marker>
                        </MapContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs;
