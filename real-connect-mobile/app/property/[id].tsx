import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { MapPin, Phone, Mail, ArrowLeft, Ruler, Calendar, Play, ZoomIn, FileText, Download, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import MediaLightbox from '../../components/MediaLightbox';

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
            if (data.image_urls && data.image_urls.length > 0) {
                data.image_urls.forEach((url: string) => allMedia.push({ url, type: 'image' }));
            } else if (data.image_url) {
                allMedia.push({ url: data.image_url, type: 'image' });
            }
            
            // Add videos
            if (data.video_urls && data.video_urls.length > 0) {
                data.video_urls.forEach((url: string) => allMedia.push({ url, type: 'video' }));
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
                <TouchableOpacity 
                    activeOpacity={0.9} 
                    onPress={() => openLightbox(0)}
                    className="relative w-full h-80 bg-gray-200"
                >
                    <Image
                        source={{ uri: property.image_urls?.[0] || property.image_url || 'https://via.placeholder.com/800x600?text=No+Image' }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                    <View className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100">
                        <ZoomIn color="white" size={32} opacity={0.6} />
                    </View>
                    {property.availability === 'sold' && (
                        <View className="absolute inset-0 bg-black/30 items-center justify-center">
                            <View className="bg-red-600 px-6 py-3 rounded-2xl border-4 border-white transform -rotate-12 shadow-2xl">
                                <Text className="text-white font-black text-2xl tracking-widest">SOLD</Text>
                            </View>
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-4 bg-black/50 p-3 rounded-full"
                    >
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                </TouchableOpacity>

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

                    {/* Media Gallery Grid */}
                    {property.image_urls && property.image_urls.length > 1 && (
                        <View className="mb-8">
                            <Text className="text-lg font-bold text-brand-dark mb-3">Gallery ({property.image_urls.length})</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {property.image_urls.map((url: string, index: number) => (
                                    <TouchableOpacity 
                                        key={index} 
                                        onPress={() => openLightbox(index)}
                                        activeOpacity={0.8}
                                    >
                                        <Image source={{ uri: url }} className="w-32 h-32 rounded-xl mr-3 bg-gray-200" />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Videos */}
                    {property.video_urls && property.video_urls.length > 0 && (
                        <View className="mb-8">
                            <Text className="text-lg font-bold text-brand-dark mb-3">Videos ({property.video_urls.length})</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {property.video_urls.map((url: string, index: number) => {
                                    const videoIndex = (property.image_urls?.length || (property.image_url ? 1 : 0)) + index;
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => openLightbox(videoIndex)}
                                            className="w-48 h-32 rounded-xl mr-3 bg-black justify-center items-center"
                                        >
                                            <Play color="white" size={32} opacity={0.8} />
                                            <Text className="text-white font-bold mt-2 text-center px-2">Watch Video {index + 1}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>
                    )}

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
            <View className="bg-white px-6 py-4 border-t border-gray-100 flex-row justify-between items-center shadow-lg pb-10">
                <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:+2348123831634`)}
                    className="bg-brand-dark flex-row items-center justify-center flex-1 py-4 rounded-xl mr-3"
                >
                    <Phone color="white" size={20} />
                    <Text className="text-white font-bold text-lg ml-2">Call Agent</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:realconnectpropertyhub@gmail.com`)}
                    className="bg-brand-light-blue p-4 rounded-xl"
                >
                    <Mail color="#0f172a" size={24} />
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
