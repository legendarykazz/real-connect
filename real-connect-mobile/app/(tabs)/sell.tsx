import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import Footer from '../../components/Footer';
import { decode } from 'base64-arraybuffer';

export default function SellScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const [location, setLocation] = useState('');
    const [size, setSize] = useState('');
    const [price, setPrice] = useState('');
    const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [videos, setVideos] = useState<ImagePicker.ImagePickerAsset[]>([]);
    const [docs, setDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

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

        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();

        const { error } = await supabase.storage.from('property-images').upload(filePath, arrayBuffer, { contentType: mimeType });
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('property-images').getPublicUrl(filePath);
        return publicUrl;
    };

    const handleSubmit = async () => {
        if (!location || !size || !price) {
            Alert.alert('Error', 'Please fill in all details');
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
                location,
                size,
                price: parseFloat(price.replace(/,/g, '')),
                image_url: imageUrls[0] || null,
                image_urls: imageUrls,
                video_urls: videoUrls,
                document_urls: docUrls,
                status: 'pending',
                title: `${size} in ${location}`
            });

            if (error) throw error;

            Alert.alert('Success', 'Property submitted for review!');
            setLocation(''); setSize(''); setPrice(''); setImages([]); setVideos([]); setDocs([]);
            router.replace('/(tabs)');
        } catch (error: any) {
            Alert.alert('Upload Error', error.message);
        } finally {
            setLoading(false);
            setUploadStatus('');
        }
    };

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

                    <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Size (Plots/Acres) *</Text>
                    <TextInput className="bg-white rounded-xl px-4 py-4 mb-4 border border-gray-100 text-brand-dark font-medium shadow-sm" placeholder="e.g. 2 Plots or 1.5 Acres" placeholderTextColor="#9ca3af" value={size} onChangeText={setSize} />

                    <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Price (₦) *</Text>
                    <TextInput className="bg-white rounded-xl px-4 py-4 mb-8 border border-gray-100 text-brand-dark font-medium shadow-sm" placeholder="e.g. 20000000" placeholderTextColor="#9ca3af" keyboardType="numeric" value={price} onChangeText={setPrice} />

                    <TouchableOpacity onPress={handleSubmit} disabled={loading} className={`bg-brand-dark py-4 rounded-xl items-center shadow-md border border-gray-800 ${loading ? 'opacity-70' : ''}`}>
                        {loading ? <View className="flex-row items-center"><ActivityIndicator color="white" className="mr-3" /><Text className="text-white font-bold">{uploadStatus || 'Submitting...'}</Text></View> : <Text className="text-white font-bold text-lg">Submit Listing</Text>}
                    </TouchableOpacity>
                </View>
                <Footer />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

