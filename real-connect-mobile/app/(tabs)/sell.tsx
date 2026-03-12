import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import { X, ChevronDown } from 'lucide-react-native';
import Footer from '../../components/Footer';
import { decode } from 'base64-arraybuffer';
import { Picker } from '@react-native-picker/picker';
import MapView, { Marker } from 'react-native-maps';

export default function SellScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const [location, setLocation] = useState('');
    const [size, setSize] = useState('');
    const [price, setPrice] = useState('');
    const [propertyType, setPropertyType] = useState('Residential');
    const [titleDocument, setTitleDocument] = useState('C of O');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [videos, setVideos] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [docs, setDocs] = useState<any[]>([]);
    const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
    const [latText, setLatText] = useState('');
    const [lngText, setLngText] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    // KYC Verification State
    const [verifStatus, setVerifStatus] = useState<string | null>(null);
    const [verifReason, setVerifReason] = useState<string>('');
    const [verifLoading, setVerifLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            if (!user) return;
            const checkVerification = async () => {
                setVerifLoading(true);
                const { data, error } = await supabase
                    .from('user_verifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching verification:', error);
                }

                if (data) {
                    setVerifStatus(data.status);
                    setVerifReason(data.rejection_reason || '');
                } else {
                    setVerifStatus('none');
                }
                setVerifLoading(false);
            };
            checkVerification();
        }, [user])
    );

    const handleMapUpdate = (coords: { latitude: number; longitude: number } | null) => {
        setCoordinates(coords);
        if (coords) {
            setLatText(coords.latitude.toString());
            setLngText(coords.longitude.toString());
        } else {
            setLatText('');
            setLngText('');
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.8,
            base64: true,
        });

        if (!result.canceled) {
            setImages([...images, ...result.assets].slice(0, 5));
        }
    };

    const pickVideo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['videos'],
            allowsMultipleSelection: true,
            selectionLimit: 2,
            quality: 0.8,
        });

        if (!result.canceled) {
            setVideos([...videos, ...result.assets].slice(0, 2));
        }
    };

    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            multiple: true,
        });

        if (!result.canceled && result.assets) {
            setDocs([...docs, ...result.assets].slice(0, 2));
        }
    };

    const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));
    const removeVideo = (index: number) => setVideos(videos.filter((_, i) => i !== index));
    const removeDocument = (index: number) => setDocs(docs.filter((_, i) => i !== index));

    const uploadImageBase64 = async (image: ImagePicker.ImagePickerAsset) => {
        if (!image.base64) throw new Error('No base64 data');
        const fileExt = image.uri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/images/${fileName}`;

        const { error } = await supabase.storage.from('property-images').upload(filePath, decode(image.base64), { contentType: `image/${fileExt}` });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(filePath);
        return publicUrl;
    };

    const uploadFileBuffer = async (uri: string, prefix: string, extension: string, mimeType: string) => {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
        const filePath = `${user?.id || 'anonymous'}/${prefix}/${fileName}`;

        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const { error } = await supabase.storage.from('property-images').upload(filePath, decode(base64), {
                contentType: mimeType
            });
            if (error) throw error;

            const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(filePath);
            return publicUrl;
        } catch (e: any) {
            console.error('File system upload error:', e);
            throw new Error(`Failed to process ${prefix} file: ` + e.message);
        }
    };

    const handleSubmit = async () => {
        if (!location || !size || !price) {
            Alert.alert('Error', 'Please fill in Location, Size, and Price details');
            return;
        }

        setLoading(true);
        try {
            setUploadStatus('Uploading Photos...');
            const imageUrls = [];
            for (const img of images) {
                const url = await uploadImageBase64(img);
                imageUrls.push(url);
            }

            setUploadStatus('Uploading Videos...');
            const videoUrls = [];
            for (const vid of videos) {
                const ext = vid.uri.split('.').pop() || 'mp4';
                const url = await uploadFileBuffer(vid.uri, 'videos', ext, `video/${ext}`);
                videoUrls.push(url);
            }

            setUploadStatus('Uploading Documents...');
            const docUrls = [];
            for (const doc of docs) {
                const ext = doc.uri.split('.').pop() || 'pdf';
                const mime = doc.mimeType || 'application/pdf';
                const url = await uploadFileBuffer(doc.uri, 'docs', ext, mime);
                docUrls.push(url);
            }

            setUploadStatus('Saving Listing...');
            const { error } = await supabase.from('properties').insert({
                user_id: user?.id,
                first_name: user?.user_metadata?.first_name || 'User',
                last_name: user?.user_metadata?.last_name || '',
                email: user?.email || '',
                phone: user?.user_metadata?.phone || '',
                location,
                size,
                price: parseFloat(price.replace(/,/g, '')),
                property_type: propertyType,
                title_document: titleDocument,
                description: description || `${size} in ${location} (${titleDocument})`,
                latitude: coordinates?.latitude || null,
                longitude: coordinates?.longitude || null,
                image_url: imageUrls[0] || null,
                image_urls: imageUrls,
                video_urls: videoUrls,
                document_urls: docUrls,
                status: 'pending',
                poster_type: 'user',
                is_verified: false,
            });

            if (error) throw error;

            Alert.alert('Success', 'Property submitted for review!');
            setLocation(''); setSize(''); setPrice(''); setDescription(''); setPropertyType('Residential'); setTitleDocument('C of O'); setImages([]); setVideos([]); setDocs([]); handleMapUpdate(null);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Upload Error', error.message);
        } finally {
            setLoading(false);
            setUploadStatus('');
        }
    };

    if (verifLoading) {
        return (
            <View className="flex-1 bg-brand-light items-center justify-center p-6">
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="text-gray-500 mt-4 text-center">Checking verification status...</Text>
            </View>
        );
    }

    if (verifStatus !== 'approved') {
        return (
            <View className="flex-1 bg-brand-light items-center justify-center p-6">
                <View className="bg-white px-6 py-8 rounded-3xl items-center shadow-lg border border-gray-100 max-w-sm w-full">
                    <View className="bg-green-50 p-5 rounded-full mb-6">
                        <Text className="text-5xl">🛡️</Text>
                    </View>

                    {verifStatus === 'pending' ? (
                        <>
                            <Text className="text-xl font-bold text-brand-dark mb-3 text-center">Verification Pending</Text>
                            <Text className="text-gray-500 text-center mb-8 leading-relaxed">
                                Our team is currently reviewing your identity documents. This usually takes less than 24 hours. We will notify you once approved!
                            </Text>
                            <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="bg-brand-dark py-4 px-8 rounded-xl w-full items-center">
                                <Text className="text-white font-bold text-lg">Back to Home</Text>
                            </TouchableOpacity>
                        </>
                    ) : verifStatus === 'rejected' ? (
                        <>
                            <Text className="text-xl font-bold text-red-600 mb-3 text-center">Verification Rejected</Text>
                            <Text className="text-gray-500 text-center mb-4 leading-relaxed">
                                Unfortunately, we could not verify your identity.
                            </Text>
                            {verifReason ? (
                                <View className="bg-red-50 p-3 rounded-lg border border-red-100 mb-6 w-full">
                                    <Text className="text-red-800 text-sm text-center font-medium">Reason: {verifReason}</Text>
                                </View>
                            ) : null}
                            <TouchableOpacity onPress={() => router.push('/kyc-wizard')} className="bg-brand-green py-4 px-8 rounded-xl w-full items-center mb-3 shadow-md">
                                <Text className="text-white font-bold text-lg">Try Again</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text className="text-xl font-bold text-brand-dark mb-3 text-center">Keep RealConnect Safe</Text>
                            <Text className="text-gray-500 text-center mb-8 leading-relaxed">
                                To protect our buyers from fraud, we require all sellers to verify their identity with a Government ID and a quick selfie before listing properties. It only takes 2 minutes.
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/kyc-wizard')} className="bg-brand-green py-4 px-8 rounded-xl shadow-md items-center w-full mb-3">
                                <Text className="text-white font-bold text-lg">Start Verification</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => router.replace('/(tabs)')} className="py-3 px-8 rounded-xl w-full items-center">
                                <Text className="text-gray-400 font-bold">Cancel</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-brand-light">
            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 0 }}>
                <View className="p-6">
                    <View className="mb-6 mt-2">
                        <Text className="text-2xl font-bold text-brand-dark mb-2">Sell Your Land</Text>
                        <Text className="text-gray-500">Fill in the details below to list your property on RealConnect.</Text>
                    </View>

                    {/* Image Uploader */}
                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-sm font-bold text-gray-700 ml-1">Photos (Up to 5)</Text>
                            <Text className="text-xs font-semibold text-brand-green">{images.length}/5</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {images.map((img, index) => (
                                <View key={index} className="relative mr-4 items-center justify-center">
                                    <Image source={{ uri: img.uri }} className="w-32 h-32 rounded-xl bg-gray-200 border border-gray-100" />
                                    <TouchableOpacity onPress={() => removeImage(index)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"><X color="white" size={16} /></TouchableOpacity>
                                </View>
                            ))}
                            {images.length < 5 && (
                                <TouchableOpacity onPress={pickImage} className="w-32 h-32 bg-white rounded-xl border-2 border-dashed border-brand-green/30 items-center justify-center">
                                    <Text className="text-brand-green font-bold text-3xl">+</Text>
                                    <Text className="text-brand-green font-medium text-xs mt-1">Add Photo</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>

                    {/* Video Uploader */}
                    <View className="mb-6">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-sm font-bold text-gray-700 ml-1">Videos (Up to 2)</Text>
                            <Text className="text-xs font-semibold text-brand-green">{videos.length}/2</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {videos.map((vid, index) => (
                                <View key={index} className="relative mr-4 items-center justify-center bg-black rounded-xl w-40 h-24 border border-gray-100">
                                    <Text className="text-white font-bold opacity-60 text-lg">▶ Video {index + 1}</Text>
                                    <TouchableOpacity onPress={() => removeVideo(index)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full"><X color="white" size={16} /></TouchableOpacity>
                                </View>
                            ))}
                            {videos.length < 2 && (
                                <TouchableOpacity onPress={pickVideo} className="w-40 h-24 bg-white rounded-xl border-2 border-dashed border-purple-400/50 items-center justify-center">
                                    <Text className="text-purple-500 font-bold text-3xl">+</Text>
                                    <Text className="text-purple-500 font-medium text-xs mt-1">Add Video</Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>
                    </View>

                    {/* Document Uploader */}
                    <View className="mb-8">
                        <View className="flex-row justify-between items-center mb-2">
                            <Text className="text-sm font-bold text-gray-700 ml-1">Documents (Up to 2 PDFs/Docs)</Text>
                            <Text className="text-xs font-semibold text-brand-green">{docs.length}/2</Text>
                        </View>
                        <View className="space-y-3">
                            {docs.map((doc, index) => (
                                <View key={index} className="flex-row items-center justify-between bg-blue-50/50 border border-blue-100 p-3 rounded-xl mb-3">
                                    <View className="flex-1">
                                        <Text className="text-sm font-semibold text-brand-dark" numberOfLines={1}>{doc.name}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => removeDocument(index)} className="ml-3 p-1"><X color="gray" size={20} /></TouchableOpacity>
                                </View>
                            ))}
                            {docs.length < 2 && (
                                <TouchableOpacity onPress={pickDocument} className="bg-white rounded-xl border-2 border-dashed border-blue-400/50 p-4 items-center justify-center flex-row">
                                    <Text className="text-blue-500 font-bold text-2xl mr-2">+</Text>
                                    <Text className="text-blue-500 font-medium text-sm">Add Document</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Form Fields */}
                    <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Location *</Text>
                    <TextInput className="bg-white rounded-xl px-4 py-4 mb-4 border border-gray-100 text-brand-dark font-medium shadow-sm" placeholder="e.g. Lekki, Lagos" placeholderTextColor="#9ca3af" value={location} onChangeText={setLocation} />

                    <View className="flex-row justify-between items-center mb-1 ml-1">
                        <Text className="text-sm font-bold text-gray-700">Map Pin Location (Optional)</Text>
                        {coordinates && <Text className="text-xs text-brand-green font-bold">Pin Dropped ✓</Text>}
                    </View>
                    <Text className="text-xs text-gray-500 ml-1 mb-2">Tap or hold to drop a pin on the exact location.</Text>
                    {/* Map View - Temporarily disabled to debug crash. Maps often crash on Android if Google Maps API key is missing in app.json */}
                    {/* 
                    <View className="h-64 rounded-xl overflow-hidden mb-3 border border-gray-200 relative">
                        <MapView
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude: 6.5244,
                                longitude: 3.3792,
                                latitudeDelta: 0.2,
                                longitudeDelta: 0.2,
                            }}
                            onPress={(e) => handleMapUpdate(e.nativeEvent.coordinate)}
                            onLongPress={(e) => handleMapUpdate(e.nativeEvent.coordinate)}
                        >
                            {coordinates && (
                                <Marker
                                    coordinate={coordinates}
                                    draggable
                                    onDragEnd={(e) => handleMapUpdate(e.nativeEvent.coordinate)}
                                />
                            )}
                        </MapView>
                        {coordinates && (
                            <TouchableOpacity
                                onPress={() => handleMapUpdate(null)}
                                className="absolute top-2 right-2 bg-red-500 px-3 py-1.5 rounded-full shadow-sm"
                            >
                                <Text className="text-white text-xs font-bold">Clear Pin</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    */}

                    <View className="flex-row gap-4 mb-6">
                        <View className="flex-1">
                            <Text className="text-xs font-bold text-gray-700 mb-1 ml-1">Latitude</Text>
                            <TextInput
                                className="bg-white rounded-xl px-4 py-3 border border-gray-100 text-brand-dark font-medium shadow-sm text-sm"
                                placeholder="e.g. 6.5244"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={latText}
                                onChangeText={(text) => {
                                    setLatText(text);
                                    const val = parseFloat(text);
                                    if (!isNaN(val)) setCoordinates(prev => ({ latitude: val, longitude: prev?.longitude || 0 }));
                                }}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs font-bold text-gray-700 mb-1 ml-1">Longitude</Text>
                            <TextInput
                                className="bg-white rounded-xl px-4 py-3 border border-gray-100 text-brand-dark font-medium shadow-sm text-sm"
                                placeholder="e.g. 3.3792"
                                placeholderTextColor="#9ca3af"
                                keyboardType="numeric"
                                value={lngText}
                                onChangeText={(text) => {
                                    setLngText(text);
                                    const val = parseFloat(text);
                                    if (!isNaN(val)) setCoordinates(prev => ({ latitude: prev?.latitude || 0, longitude: val }));
                                }}
                            />
                        </View>
                    </View>

                    <View className="flex-row gap-4 mb-4">
                        <View className="flex-1">
                            <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Property Type *</Text>
                            <View className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-14 justify-center">
                                {/* Disabled native picker temporarily to debug crash */}
                                <TextInput
                                    className="px-4 py-3 text-brand-dark font-medium"
                                    value={propertyType}
                                    onChangeText={setPropertyType}
                                    placeholder="Enter Type (Residential, etc.)"
                                />
                            </View>
                        </View>

                        <View className="flex-1">
                            <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Title Document *</Text>
                            <View className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden h-14 justify-center">
                                {/* Disabled native picker temporarily to debug crash */}
                                <TextInput
                                    className="px-4 py-3 text-brand-dark font-medium"
                                    value={titleDocument}
                                    onChangeText={setTitleDocument}
                                    placeholder="Enter Title (C of O, etc.)"
                                />
                            </View>
                        </View>
                    </View>

                    <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Size (sqm / plots) *</Text>
                    <TextInput className="bg-white rounded-xl px-4 py-4 mb-4 border border-gray-100 text-brand-dark font-medium shadow-sm" placeholder="e.g. 2 Plots or 1.5 Acres" placeholderTextColor="#9ca3af" value={size} onChangeText={setSize} />

                    <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Price (₦) *</Text>
                    <TextInput className="bg-white rounded-xl px-4 py-4 mb-4 border border-gray-100 text-brand-dark font-medium shadow-sm" placeholder="e.g. 20000000" placeholderTextColor="#9ca3af" keyboardType="numeric" value={price} onChangeText={setPrice} />

                    <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Description</Text>
                    <TextInput
                        className="bg-white rounded-xl px-4 py-4 mb-8 border border-gray-100 text-brand-dark font-medium shadow-sm text-left align-top"
                        placeholder="Brief description about the land..."
                        placeholderTextColor="#9ca3af"
                        value={description}
                        onChangeText={setDescription}
                        multiline={true}
                        numberOfLines={4}
                        style={{ height: 100 }}
                    />

                    <TouchableOpacity onPress={handleSubmit} disabled={loading} className={`bg-brand-dark py-4 rounded-xl items-center shadow-md border border-gray-800 ${loading ? 'opacity-70' : ''}`}>
                        {loading ? <View className="flex-row items-center"><ActivityIndicator color="white" className="mr-3" /><Text className="text-white font-bold">{uploadStatus || 'Submitting...'}</Text></View> : <Text className="text-white font-bold text-lg">Submit Listing</Text>}
                    </TouchableOpacity>
                </View>
                <Footer />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

