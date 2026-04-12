import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { MapPin, Phone, Mail, ArrowLeft, Ruler, Calendar, Play, ZoomIn, FileText, Download, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import MediaLightbox from '../../components/MediaLightbox';
import { MessageCircle } from 'lucide-react-native';

const REALCONNECT_CONTACT = {
    phone: '+2348123831634',
    whatsapp: '2348123831634', // No + for WhatsApp URL
    email: 'realconnectpropertyhub@gmail.com'
};

export default function PropertyDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Lightbox State
    const [lightboxVisible, setLightboxVisible] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const [lightboxMedia, setLightboxMedia] = useState<{ url: string; type: 'image' | 'video' }[]>([]);

    useEffect(() => {
        if (id) fetchPropertyDetails();
    }, [id]);

    const fetchPropertyDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setProperty(data);
            
            // Prepare media for lightbox
            const allMedia: { url: string; type: 'image' | 'video' }[] = [];
            
            // Add images
            const images = (data.image_urls || []).filter(Boolean);
            if (images.length > 0) {
                images.forEach((url: string) => allMedia.push({ url, type: 'image' }));
            } else if (data.image_url) {
                allMedia.push({ url: data.image_url, type: 'image' });
            }
            
            // Add videos
            const videos = (data.video_urls || []).filter(Boolean);
            if (videos.length > 0) {
                videos.forEach((url: string) => allMedia.push({ url, type: 'video' }));
            }
            
            // Fallback: if no images but has videos, add a placeholder for the header
            if (allMedia.length === 0) {
                allMedia.push({ url: 'https://via.placeholder.com/800x600?text=No+Media', type: 'image' });
            }
            
            setLightboxMedia(allMedia);
            
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxVisible(true);
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-brand-light">
                <ActivityIndicator size="large" color="#10b981" />
            </View>
        );
    }

    if (!property) {
        return (
            <View className="flex-1 justify-center items-center bg-brand-light">
                <Text className="text-xl font-bold text-gray-500">Property not found</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-brand-green px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-brand-light">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {/* Header Image */}
                <View className="relative w-full h-80 bg-gray-200">
                    <TouchableOpacity 
                        activeOpacity={0.9} 
                        onPress={() => openLightbox(lightboxIndex)}
                        className="w-full h-full"
                    >
                        <Image
                            source={{ uri: lightboxMedia[lightboxIndex]?.url || property.image_url || 'https://via.placeholder.com/800x600?text=No+Image' }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                        <View className="absolute inset-0 bg-black/5 items-center justify-center">
                            <ZoomIn color="white" size={32} opacity={0.4} />
                        </View>
                        {property.availability === 'sold' && (
                            <View className="absolute inset-0 bg-black/30 items-center justify-center">
                                <View className="bg-red-600 px-6 py-3 rounded-2xl border-4 border-white transform -rotate-12 shadow-2xl">
                                    <Text className="text-white font-black text-2xl tracking-widest">SOLD</Text>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-4 bg-black/50 p-3 rounded-full"
                    >
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                </View>

                {/* Thumbnail Strip */}
                {lightboxMedia.length > 1 && (
                    <View className="bg-white border-b border-gray-100 py-3">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
                            {lightboxMedia.map((item, index) => (
                                <TouchableOpacity 
                                    key={index}
                                    onPress={() => setLightboxIndex(index)}
                                    className={`mr-3 rounded-xl overflow-hidden border-2 ${lightboxIndex === index ? 'border-brand-green' : 'border-transparent'}`}
                                >
                                    <View className="relative w-16 h-16 bg-gray-100">
                                        <Image source={{ uri: item.url }} className="w-full h-full" resizeMode="cover" />
                                        {item.type === 'video' && (
                                            <View className="absolute inset-0 bg-black/30 items-center justify-center">
                                                <Play color="white" size={16} />
                                            </View>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View className="p-6">
                    {/* Title & Price */}
                    <View className="mb-6">
                        <Text className="text-3xl font-extrabold text-brand-dark mb-2">₦{parseInt(String(property.price || 0).replace(/\D/g, ''), 10).toLocaleString()}</Text>
                        <Text className="text-xl font-bold text-gray-700">{property.title}</Text>
                    </View>

                    {/* Quick Stats Grid */}
                    <View className="flex-row flex-wrap justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <View className="w-1/2 flex-row items-center mb-4">
                            <View className="bg-green-50 p-2 rounded-lg mr-3"><MapPin color="#10b981" size={20} /></View>
                            <View>
                                <Text className="text-xs text-gray-400">Location</Text>
                                <Text className="font-bold text-brand-dark">{property.location}</Text>
                            </View>
                        </View>
                        <View className="w-1/2 flex-row items-center mb-4">
                            <View className="bg-blue-50 p-2 rounded-lg mr-3"><Ruler color="#3b82f6" size={20} /></View>
                            <View>
                                <Text className="text-xs text-gray-400">Size</Text>
                                <Text className="font-bold text-brand-dark">{property.size}</Text>
                            </View>
                        </View>
                        <View className="w-1/2 flex-row items-center">
                            <View className="bg-orange-50 p-2 rounded-lg mr-3"><Calendar color="#f97316" size={20} /></View>
                            <View>
                                <Text className="text-xs text-gray-400">Listed</Text>
                                <Text className="font-bold text-brand-dark">{new Date(property.created_at).toLocaleDateString()}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Verification Report - High Prominence */}
                    <View className="mb-8 p-5 bg-white rounded-3xl border border-green-100 shadow-sm">
                        <View className="flex-row items-center mb-5 pb-3 border-b border-green-50">
                            <View className="bg-brand-green p-2.5 rounded-2xl mr-3 shadow-md">
                                <ShieldCheck color="white" size={20} />
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-brand-dark">Verification Status</Text>
                                <Text className="text-xs text-gray-400">Official RealConnect verification report</Text>
                            </View>
                        </View>
                        
                        <View className="mb-5">
                            <VerificationItem label="Ownership Verified" status={property.owner_verified || false} />
                            <VerificationItem label="Documents Checked" status={property.docs_verified || false} />
                            <VerificationItem label="Survey Verified" status={property.survey_verified || false} />
                            <VerificationItem label="Location Verified" status={property.location_verified || false} />
                            <VerificationItem label="Free from Govt Acquisition" status={property.acquisition_free || false} />
                        </View>

                        <TouchableOpacity 
                            onPress={() => {
                                if (property.verification_report_url) {
                                    WebBrowser.openBrowserAsync(property.verification_report_url);
                                } else {
                                    alert('Report coming soon! Our team is finalizing the official verification document for this property.');
                                }
                            }}
                            activeOpacity={0.8}
                            className={`w-full py-4 rounded-2xl flex-row justify-center items-center border-2 ${property.verification_report_url ? 'border-brand-green bg-green-50/10' : 'border-gray-200 bg-gray-50'}`}
                        >
                            <FileText color={property.verification_report_url ? "#10b981" : "#9ca3af"} size={20} />
                            <Text className={`font-bold ml-2 ${property.verification_report_url ? 'text-brand-green' : 'text-gray-400'}`}>
                                {property.verification_report_url ? 'View Full PDF Report' : 'Report Processing...'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Description */}
                    <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
                        <Text className="text-lg font-bold text-brand-dark mb-3">Property Description</Text>
                        <Text className="text-gray-600 leading-relaxed text-base">
                            {property.description || "No description provided."}
                        </Text>
                    </View>

                    {/* Map Location */}
                    {property.latitude && property.longitude && (
                        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
                            <Text className="text-lg font-bold text-brand-dark mb-3">Map Location</Text>
                            <View className="h-48 rounded-xl overflow-hidden border border-gray-200 pointer-events-none">
                                <MapView
                                    style={{ flex: 1 }}
                                    initialRegion={{
                                        latitude: property.latitude,
                                        longitude: property.longitude,
                                        latitudeDelta: 0.05,
                                        longitudeDelta: 0.05,
                                    }}
                                    pitchEnabled={false}
                                    rotateEnabled={false}
                                    scrollEnabled={false}
                                    zoomEnabled={false}
                                >
                                    <Marker
                                        coordinate={{ latitude: property.latitude, longitude: property.longitude }}
                                        title={property.location}
                                    />
                                </MapView>
                            </View>
                        </View>
                    )}

                    {/* Media Gallery Grid - Removed as it's now in the header thumbnail strip */}

                </View>
            </ScrollView>

            {/* Lightbox Component */}
            <MediaLightbox
                visible={lightboxVisible}
                onClose={() => setLightboxVisible(false)}
                media={lightboxMedia}
                initialIndex={lightboxIndex}
            />

            {/* Bottom Action Bar */}
            <View className="bg-white px-6 py-4 border-t border-gray-100 shadow-lg pb-10">
                <View className="flex-row mb-3">
                    <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${REALCONNECT_CONTACT.phone}`)}
                        className="bg-brand-dark flex-row items-center justify-center flex-1 py-4 rounded-xl mr-3"
                    >
                        <Phone color="white" size={20} />
                        <Text className="text-white font-bold text-lg ml-2">Call Now</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => {
                            const msg = encodeURIComponent(`Hello RealConnect, I'm interested in the property in ${property.location} (₦${parseInt(String(property.price || 0).replace(/\D/g, ''), 10).toLocaleString()}).`);
                            Linking.openURL(`https://wa.me/${REALCONNECT_CONTACT.whatsapp}?text=${msg}`);
                        }}
                        className="bg-brand-green flex-row items-center justify-center flex-1 py-4 rounded-xl"
                    >
                        <MessageCircle color="white" size={20} />
                        <Text className="text-white font-bold text-lg ml-2">WhatsApp</Text>
                    </TouchableOpacity>
                </View>
                
                <TouchableOpacity
                    onPress={() => {
                        const msg = encodeURIComponent(`Hello RealConnect, I'd like to schedule an inspection for the property in ${property.location}.`);
                        Linking.openURL(`https://wa.me/${REALCONNECT_CONTACT.whatsapp}?text=${msg}`);
                    }}
                    className="w-full bg-white border-2 border-brand-light-blue py-3 rounded-xl items-center flex-row justify-center"
                >
                    <Calendar color="#3b82f6" size={18} />
                    <Text className="text-brand-light-blue font-bold ml-2">Schedule Inspection</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const VerificationItem = ({ label, status }: { label: string; status: boolean }) => (
    <View className="flex-row items-center justify-between mb-3">
        <Text className="text-gray-600 font-semibold text-sm">{label}</Text>
        {status ? (
            <View className="flex-row items-center bg-white px-2.5 py-1 rounded-xl border border-green-100 shadow-sm">
                <CheckCircle2 color="#10b981" size={12} />
                <Text className="text-brand-green font-bold text-[10px] ml-1 uppercase">Verified</Text>
            </View>
        ) : (
            <View className="flex-row items-center bg-white/50 px-2.5 py-1 rounded-xl border border-gray-100">
                <Text className="text-gray-400 font-bold text-[10px] uppercase">Pending</Text>
            </View>
        )}
    </View>
);
