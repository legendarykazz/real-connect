import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { MapPin, Phone, Mail, ArrowLeft, Ruler, Calendar, Play } from 'lucide-react-native';

export default function PropertyDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [property, setProperty] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
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
                    <Image
                        source={{ uri: property.image_urls?.[0] || property.image_url || 'https://via.placeholder.com/800x600?text=No+Image' }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-4 bg-black/50 p-3 rounded-full"
                    >
                        <ArrowLeft color="white" size={24} />
                    </TouchableOpacity>
                </View>

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

                    {/* Description */}
                    <View className="mb-8">
                        <Text className="text-lg font-bold text-brand-dark mb-3">About this property</Text>
                        <Text className="text-gray-600 leading-relaxed text-base">
                            {property.description || "No description provided."}
                        </Text>
                    </View>

                    {/* Media Gallery Grid */}
                    {property.image_urls && property.image_urls.length > 1 && (
                        <View className="mb-8">
                            <Text className="text-lg font-bold text-brand-dark mb-3">Gallery ({property.image_urls.length})</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {property.image_urls.map((url: string, index: number) => (
                                    <Image key={index} source={{ uri: url }} className="w-32 h-32 rounded-xl mr-3 bg-gray-200" />
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Videos */}
                    {property.video_urls && property.video_urls.length > 0 && (
                        <View className="mb-8">
                            <Text className="text-lg font-bold text-brand-dark mb-3">Videos ({property.video_urls.length})</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {property.video_urls.map((url: string, index: number) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => Linking.openURL(url)}
                                        className="w-48 h-32 rounded-xl mr-3 bg-black justify-center items-center"
                                    >
                                        <Play color="white" size={32} opacity={0.8} />
                                        <Text className="text-white font-bold mt-2">Watch Video {index + 1}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Bottom Action Bar */}
            <View className="bg-white px-6 py-4 border-t border-gray-100 flex-row justify-between items-center shadow-lg pb-8">
                <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${property.phone || '+234812383164'}`)}
                    className="bg-brand-dark flex-row items-center justify-center flex-1 py-4 rounded-xl mr-3"
                >
                    <Phone color="white" size={20} />
                    <Text className="text-white font-bold text-lg ml-2">Call Agent</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${property.email || 'realconnectpropertyhub@gmail.com'}`)}
                    className="bg-brand-light-blue p-4 rounded-xl"
                >
                    <Mail color="#0f172a" size={24} />
                </TouchableOpacity>
            </View>
        </View>
    );
}
