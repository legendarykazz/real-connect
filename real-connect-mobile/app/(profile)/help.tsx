import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { ArrowLeft, Phone, Mail, Globe, MapPin, Shield } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-brand-light">
            <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100 flex-row items-center shadow-sm z-50">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-brand-dark">Help & Support</Text>
            </View>

            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                <Text className="text-2xl font-bold text-brand-dark mb-2">How can we assist you?</Text>
                <Text className="text-gray-500 mb-8 leading-relaxed">
                    Our support team is available Monday through Friday from 9am to 6pm WAT to help you with any issues regarding your properties or account.
                </Text>

                <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                    <TouchableOpacity
                        onPress={() => Linking.openURL('tel:+2348123831634')}
                        className="px-6 py-5 border-b border-gray-100 flex-row items-center"
                    >
                        <View className="bg-blue-50 p-3 rounded-full mr-4"><Phone color="#3b82f6" size={20} /></View>
                        <View>
                            <Text className="text-lg font-bold text-brand-dark mb-1">Call Support</Text>
                            <Text className="text-gray-500">+2348123831634</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => Linking.openURL('mailto:realconnectpropertyhub@gmail.com')}
                        className="px-6 py-5 border-b border-gray-100 flex-row items-center"
                    >
                        <View className="bg-green-50 p-3 rounded-full mr-4"><Mail color="#10b981" size={20} /></View>
                        <View>
                            <Text className="text-lg font-bold text-brand-dark mb-1">Email Us</Text>
                            <Text className="text-gray-500">realconnectpropertyhub@gmail.com</Text>
                        </View>
                    </TouchableOpacity>

                    <View className="px-6 py-5 flex-row items-center">
                        <View className="bg-orange-50 p-3 rounded-full mr-4"><MapPin color="#f97316" size={20} /></View>
                        <View>
                            <Text className="text-lg font-bold text-brand-dark mb-1">Office Address</Text>
                            <Text className="text-gray-500">Lekki Phase 1, Lagos, Nigeria</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={() => router.push('/privacy-policy' as any)}
                    className="bg-brand-dark flex-row justify-center items-center py-4 rounded-xl mb-4"
                >
                    <Shield color="white" size={20} className="mr-2" />
                    <Text className="text-white font-bold text-lg">Privacy Policy</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => Linking.openURL('https://realconnectafrica.com')}
                    className="bg-brand-green flex-row justify-center items-center py-4 rounded-xl mb-12"
                >
                    <Globe color="white" size={20} className="mr-2" />
                    <Text className="text-white font-bold text-lg">Visit our Website</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
