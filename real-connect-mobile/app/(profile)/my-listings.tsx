import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function MyListingsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchMyListings();
    }, [user]);

    const fetchMyListings = async () => {
        try {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .eq('user_id', user?.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProperties(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert(
            'Delete Property',
            'Are you sure you want to delete this listing?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.from('properties').delete().eq('id', id);
                        if (!error) setProperties(properties.filter(p => p.id !== id));
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View className="bg-white mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex-row">
            <Image
                source={{ uri: item.image_urls?.[0] || 'https://via.placeholder.com/150' }}
                className="w-32 h-32 bg-gray-200"
                resizeMode="cover"
            />
            <View className="flex-1 p-4 justify-between">
                <View>
                    <Text className="font-bold text-lg text-brand-dark mb-1" numberOfLines={1}>{item.title}</Text>
                    <Text className="text-gray-500 text-sm mb-1">{item.location}</Text>
                    <Text className="text-xs font-semibold text-brand-green bg-brand-light-blue/20 px-2 py-1 rounded self-start">
                        {item.status.toUpperCase()}
                    </Text>
                </View>
                <View className="flex-row justify-between items-center mt-2">
                    <Text className="font-bold text-brand-dark">₦{parseInt(String(item.price || 0).replace(/\D/g, ''), 10).toLocaleString()}</Text>
                    <TouchableOpacity onPress={() => handleDelete(item.id)} className="bg-red-50 p-2 rounded-lg">
                        <Trash2 color="#ef4444" size={16} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-brand-light">
            <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100 flex-row items-center shadow-sm z-50">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-brand-dark">My Listings</Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : properties.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-xl font-bold text-gray-400 text-center mb-4">No listings yet</Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/sell')} className="bg-brand-green px-6 py-3 rounded-xl">
                        <Text className="text-white font-bold">Post Property</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={properties}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}
