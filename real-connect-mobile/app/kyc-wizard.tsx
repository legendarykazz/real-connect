import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckCircle2, ShieldCheck, Camera, FileText } from 'lucide-react-native';
import { decode } from 'base64-arraybuffer';

export default function KYCWizard() {
    const { user } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [idType, setIdType] = useState('NIN');
    const [idNumber, setIdNumber] = useState('');
    const [idImage, setIdImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [addressImage, setAddressImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
    const [selfieImage, setSelfieImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

    const pickImage = async (setImage: any, useCamera = false) => {
        const options: ImagePicker.ImagePickerOptions = {
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: useCamera ? [1, 1] : undefined,
            quality: 0.7,
            base64: true,
        };

        const result = useCamera
            ? await ImagePicker.launchCameraAsync(options)
            : await ImagePicker.launchImageLibraryAsync(options);

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    const uploadBase64Image = async (image: ImagePicker.ImagePickerAsset, prefix: string) => {
        if (!image.base64) throw new Error('No base64 data');
        const fileExt = image.uri.split('.').pop() || 'jpg';
        const fileName = `${prefix}-${Date.now()}.${fileExt}`;
        const filePath = `${user?.id || 'anonymous'}/${fileName}`;

        const { error } = await supabase.storage.from('kyc_documents').upload(filePath, decode(image.base64), { contentType: `image/${fileExt}` });
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from('kyc_documents').getPublicUrl(filePath);
        return publicUrl;
    };

    const handleSubmit = async () => {
        if (!idImage || !addressImage || !selfieImage || !idNumber || !fullName || !address) {
            Alert.alert('Incomplete', 'Please provide all required details and photos.');
            return;
        }

        setLoading(true);
        try {
            // Upload images
            const idUrl = await uploadBase64Image(idImage, 'id_doc');
            const addressUrl = await uploadBase64Image(addressImage, 'address_doc');
            const selfieUrl = await uploadBase64Image(selfieImage, 'selfie');

            const payload = {
                user_id: user?.id,
                full_name: fullName,
                address: address,
                email: user?.email,
                phone: user?.user_metadata?.phone || '',
                status: 'pending',
                id_type: idType,
                id_number: idNumber,
                id_document_url: idUrl,
                address_document_url: addressUrl,
                selfie_url: selfieUrl,
                rejection_reason: null
            };

            const { error: err } = await supabase.from('user_verifications').upsert(payload, { onConflict: 'user_id' });

            if (err) {
                // Check if it's the unique constraint violation for ID Number
                if (err.message?.includes('user_verifications_id_number_key') || err.message?.includes('duplicate key') || err.code === '23505') {
                    throw new Error('This ID Number is already registered to another account.');
                }
                throw err;
            }

            Alert.alert('Success', 'Verification submitted successfully! Our team will review your application soon.');
            router.replace('/(tabs)/sell');

        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
            <View className="flex-row items-center p-6 pb-2 border-b border-gray-100 mt-8">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <ArrowLeft color="#374151" size={24} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-brand-dark">Identity Verification</Text>
            </View>

            {/* Progress Bar */}
            <View className="flex-row px-8 pt-6 pb-2 items-center justify-between relative">
                <View className="absolute top-1/2 left-10 right-10 h-1 bg-gray-100 -z-10 translate-y-[2px]" />
                <View className="absolute top-1/2 left-10 right-10 h-1 bg-brand-green -z-10 translate-y-[2px]" style={{ width: `${((step - 1) / 2) * 100}%` }} />

                {[1, 2, 3].map((s) => (
                    <View key={s} className={`w-8 h-8 rounded-full items-center justify-center border-2 ${step >= s ? 'bg-brand-green border-brand-green' : 'bg-white border-gray-300'}`}>
                        <Text className={`font-bold text-xs ${step >= s ? 'text-white' : 'text-gray-400'}`}>{s}</Text>
                    </View>
                ))}
            </View>
            <View className="flex-row px-6 justify-between mb-6 text-xs text-gray-500 font-medium">
                <Text>ID</Text>
                <Text>Address</Text>
                <Text>Selfie</Text>
            </View>

            <ScrollView className="flex-1 px-6">
                {step === 1 && (
                    <View className="animate-fade-in">
                        <View className="items-center mb-6">
                            <View className="bg-blue-50 p-4 rounded-full mb-4">
                                <FileText color="#3b82f6" size={32} />
                            </View>
                            <Text className="text-2xl font-bold text-brand-dark mb-2">Government ID</Text>
                            <Text className="text-gray-500 text-center">Please provide your full name and a valid Government ID.</Text>
                        </View>

                        <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Full Legal Name *</Text>
                        <TextInput
                            className="bg-white rounded-xl px-4 py-4 mb-4 border border-gray-200 text-brand-dark font-medium shadow-sm"
                            placeholder="e.g. John Doe"
                            value={fullName}
                            onChangeText={setFullName}
                        />

                        <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">ID Type</Text>
                        <View className="bg-white rounded-xl border border-gray-200 mb-4 overflow-hidden flex-row shadow-sm">
                            {['NIN', 'Passport'].map((t) => (
                                <TouchableOpacity key={t} onPress={() => setIdType(t)} className={`flex-1 py-3 items-center ${idType === t ? 'bg-brand-dark' : 'bg-transparent'}`}>
                                    <Text className={`font-bold ${idType === t ? 'text-white' : 'text-gray-500'}`}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">ID Number *</Text>
                        <TextInput
                            className="bg-white rounded-xl px-4 py-4 mb-6 border border-gray-200 text-brand-dark font-medium shadow-sm"
                            placeholder="e.g. 12345678901"
                            value={idNumber}
                            onChangeText={setIdNumber}
                        />

                        <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Upload Photo of ID</Text>
                        <TouchableOpacity onPress={() => pickImage(setIdImage, false)} className="border-2 border-dashed border-gray-300 rounded-2xl h-40 bg-gray-50 items-center justify-center mb-8 overflow-hidden">
                            {idImage ? (
                                <Image source={{ uri: idImage.uri }} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Camera color="#9ca3af" size={32} className="mb-2" />
                                    <Text className="text-gray-500 font-medium">Tap to scan or select ID</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                if (idImage && idNumber && fullName) setStep(2);
                                else Alert.alert('Required', 'Please enter your name, ID number and upload ID photo.');
                            }}
                            className="bg-brand-green py-4 rounded-xl items-center shadow-md mb-8"
                        >
                            <Text className="text-white font-bold text-lg">Next Step</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {step === 2 && (
                    <View className="animate-fade-in">
                        <View className="items-center mb-6">
                            <View className="bg-purple-50 p-4 rounded-full mb-4">
                                <ShieldCheck color="#a855f7" size={32} />
                            </View>
                            <Text className="text-2xl font-bold text-brand-dark mb-2">Proof of Address</Text>
                            <Text className="text-gray-500 text-center">Provide your residential address and upload a recent utility bill or bank statement (not older than 3 months).</Text>
                        </View>

                        <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Residential Address *</Text>
                        <TextInput
                            className="bg-white rounded-xl px-4 py-4 mb-6 border border-gray-200 text-brand-dark font-medium shadow-sm"
                            placeholder="e.g. 123 Main St, Lagos"
                            value={address}
                            onChangeText={setAddress}
                            multiline
                        />

                        <TouchableOpacity onPress={() => pickImage(setAddressImage, false)} className="border-2 border-dashed border-gray-300 rounded-2xl h-48 bg-gray-50 items-center justify-center mb-8 overflow-hidden">
                            {addressImage ? (
                                <Image source={{ uri: addressImage.uri }} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <FileText color="#9ca3af" size={32} className="mb-2" />
                                    <Text className="text-gray-500 font-medium">Tap to select Image</Text>
                                    <Text className="text-gray-400 text-xs mt-1">(Image format only: JPG, PNG)</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row mb-8">
                            <TouchableOpacity onPress={() => setStep(1)} className="flex-1 bg-gray-100 py-4 rounded-xl items-center mr-2">
                                <Text className="text-gray-600 font-bold text-lg">Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (addressImage && address) setStep(3);
                                    else Alert.alert('Required', 'Please enter your address and upload a proof document.');
                                }}
                                className="flex-1 bg-brand-green py-4 rounded-xl items-center shadow-md ml-2"
                            >
                                <Text className="text-white font-bold text-lg">Next Step</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {step === 3 && (
                    <View className="animate-fade-in">
                        <View className="items-center mb-6">
                            <View className="bg-green-50 p-4 rounded-full mb-4">
                                <CheckCircle2 color="#10b981" size={32} />
                            </View>
                            <Text className="text-2xl font-bold text-brand-dark mb-2">Liveness Selfie</Text>
                            <Text className="text-gray-500 text-center">Take a clear selfie of your face in a well-lit environment. Please remove any hats or sunglasses.</Text>
                        </View>

                        <TouchableOpacity onPress={() => pickImage(setSelfieImage, true)} className="border-2 border-dashed border-gray-300 rounded-full w-48 h-48 mx-auto bg-gray-50 items-center justify-center mb-8 overflow-hidden shadow-sm">
                            {selfieImage ? (
                                <Image source={{ uri: selfieImage.uri }} className="w-full h-full object-cover" />
                            ) : (
                                <>
                                    <Camera color="#9ca3af" size={32} className="mb-2" />
                                    <Text className="text-gray-500 font-medium text-center px-4">Tap to open Camera</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row mb-8">
                            <TouchableOpacity onPress={() => setStep(2)} className="flex-1 bg-gray-100 py-4 rounded-xl items-center mr-2" disabled={loading}>
                                <Text className="text-gray-600 font-bold text-lg">Back</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={loading}
                                className={`flex-[2] bg-brand-dark py-4 rounded-xl items-center shadow-md ml-2 ${loading ? 'opacity-70' : ''}`}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" />
                                ) : (
                                    <Text className="text-white font-bold text-lg">Submit Securely</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
