import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Image, TouchableOpacity, TextInput, LayoutAnimation, Platform, UIManager } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Link } from 'expo-router';
import { Search, SlidersHorizontal, X, ChevronDown, Home } from 'lucide-react-native';
import { Picker } from '@react-native-picker/picker';
import Footer from '../../components/Footer';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function BrowseScreen() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [propertyType, setPropertyType] = useState('All');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

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

  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (searchQuery.trim()) {
      result = result.filter(p =>
        p.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (propertyType !== 'All') {
      result = result.filter(p => p.property_type === propertyType);
    }

    if (priceMin) {
      result = result.filter(p => {
        const price = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
        return price >= parseFloat(priceMin);
      });
    }

    if (priceMax) {
      result = result.filter(p => {
        const price = parseFloat(String(p.price).replace(/[^0-9.]/g, ''));
        return price <= parseFloat(priceMax);
      });
    }

    return result;
  }, [searchQuery, priceMin, priceMax, propertyType, properties]);

  const toggleFilter = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsFilterVisible(!isFilterVisible);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPriceMin('');
    setPriceMax('');
    setPropertyType('All');
  };

  const hasActiveFilters = searchQuery || priceMin || priceMax || propertyType !== 'All';

  const renderItem = ({ item }: { item: any }) => (
    <Link href={`/property/${item.id}` as any} asChild>
      <TouchableOpacity className="bg-white mx-4 mb-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
        <View className="relative">
          <Image
            source={{ uri: item.image_urls?.[0] || 'https://via.placeholder.com/400x300?text=No+Image' }}
            className="w-full h-48 bg-gray-200"
            resizeMode="cover"
          />
          <View className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded-full flex-row items-center shadow-sm">
            <Text className="text-[10px] font-bold text-brand-dark">VERIFIED</Text>
          </View>
          <View className="absolute top-3 right-3 bg-black/40 px-2 py-1 rounded-full">
            <Text className="text-white text-[10px] font-bold">{item.property_type}</Text>
          </View>
        </View>
        <View className="p-4">
          <Text className="font-bold text-lg text-brand-dark mb-1">₦{parseInt(String(item.price || 0).replace(/\D/g, ''), 10).toLocaleString()}</Text>
          <Text className="text-gray-500 mb-2">{item.location}</Text>
          <View className="flex-row items-center justify-between">
            <View className="bg-brand-green/10 px-2 py-1 rounded">
              <Text className="text-xs font-semibold text-brand-green">
                {item.size} sqm
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              {new Date(item.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View className="flex-1 bg-brand-light">
      {/* Search and Filter Header */}
      <View className="bg-white px-4 py-3 border-b border-gray-100 shadow-sm pt-4">
        <View className="flex-row items-center space-x-3 mb-2">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-4 py-1.5 border border-gray-200">
            <Search size={18} color="#64748b" />
            <TextInput
              placeholder="Search by location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              className="flex-1 ml-2 text-sm text-brand-dark py-2"
              placeholderTextColor="#94a3b8"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            onPress={toggleFilter}
            className={`p-3 rounded-2xl border ${isFilterVisible || hasActiveFilters ? 'bg-brand-dark border-brand-dark' : 'bg-white border-gray-200 shadow-sm'}`}
          >
            <SlidersHorizontal size={20} color={isFilterVisible || hasActiveFilters ? '#fff' : '#0f172a'} />
          </TouchableOpacity>
        </View>

        {/* Expandable Filter Panel */}
        {isFilterVisible && (
          <View className="mt-3 pb-2 space-y-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider">Filters</Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearFilters}>
                  <Text className="text-xs font-bold text-red-500">Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View className="space-y-3">
              <Text className="text-xs font-bold text-gray-500">Property Type</Text>
              <View className="bg-gray-50 rounded-xl border border-gray-100">
                <Picker
                  selectedValue={propertyType}
                  onValueChange={(itemValue) => setPropertyType(itemValue)}
                  style={{ height: 50, width: '100%' }}
                >
                  <Picker.Item label="All Types" value="All" />
                  <Picker.Item label="Residential" value="Residential" />
                  <Picker.Item label="Commercial" value="Commercial" />
                  <Picker.Item label="Agricultural" value="Agricultural" />
                  <Picker.Item label="Mixed Use" value="Mixed Use" />
                </Picker>
              </View>
            </View>

            <View className="flex-row space-x-3">
              <View className="flex-1 space-y-1.5">
                <Text className="text-xs font-bold text-gray-500">Min Price (₦)</Text>
                <TextInput
                  keyboardType="numeric"
                  placeholder="e.g. 1M"
                  value={priceMin}
                  onChangeText={setPriceMin}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                />
              </View>
              <View className="flex-1 space-y-1.5">
                <Text className="text-xs font-bold text-gray-500">Max Price (₦)</Text>
                <TextInput
                  keyboardType="numeric"
                  placeholder="e.g. 50M"
                  value={priceMax}
                  onChangeText={setPriceMax}
                  className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm"
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : filteredProperties.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-gray-100 p-6 rounded-full mb-4">
            <Home size={40} color="#94a3b8" />
          </View>
          <Text className="text-xl font-bold text-brand-dark mb-2">No properties found</Text>
          <Text className="text-gray-500 text-center">
            {hasActiveFilters 
              ? "We couldn't find any properties matching your filters. Try adjusting them." 
              : "There are no approved properties available at the moment."}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity 
              onPress={clearFilters}
              className="mt-6 bg-brand-dark px-8 py-3 rounded-2xl"
            >
              <Text className="text-white font-bold">Clear All Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProperties}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          ListFooterComponent={<Footer />}
        />
      )}
    </View>
  );
}
