import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Link } from 'expo-router';
import Footer from '../../components/Footer';

export default function BrowseScreen() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <Link href={`/property/${item.id}` as any} asChild>
      <TouchableOpacity className="bg-white mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <Image
          source={{ uri: item.image_urls?.[0] || 'https://via.placeholder.com/400x300?text=No+Image' }}
          className="w-full h-48 bg-gray-200"
          resizeMode="cover"
        />
        <View className="p-4">
          <Text className="font-bold text-lg text-brand-dark mb-1">₦{parseInt(String(item.price || 0).replace(/\D/g, ''), 10).toLocaleString()}</Text>
          <Text className="text-gray-500 mb-2">{item.location}</Text>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-brand-green bg-brand-light-blue/20 px-2 py-1 rounded">
              {item.size}
            </Text>
            <Text className="text-xs text-gray-400">
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View className="flex-1 bg-brand-light pt-4">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : properties.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-xl font-bold text-gray-400 text-center">No properties found</Text>
        </View>
      ) : (
        <FlatList
          data={properties}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<Footer />}
        />
      )}
    </View>
  );
}
