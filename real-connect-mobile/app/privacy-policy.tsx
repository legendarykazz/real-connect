import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Lock, Eye, FileText, Mail } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    const sections = [
        {
            title: "1. Information We Collect",
            icon: <Eye size={20} color="#10b981" />,
            content: "We collect information you provide directly to us when you create an account, list a property, or communicate with us. This includes your name, email, phone number, and any property details or photos you upload."
        },
        {
            title: "2. How We Use Information",
            icon: <FileText size={20} color="#10b981" />,
            content: "We use your information to facilitate property listings, verify users, provide customer support, and improve our services. Your contact info is shared with potential buyers/sellers only when you authorize it."
        },
        {
            title: "3. Data Security",
            icon: <Lock size={20} color="#10b981" />,
            content: "We use industry-standard security measures (via Supabase) to protect your data. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security."
        },
        {
            title: "4. Your Rights",
            icon: <Shield size={20} color="#10b981" />,
            content: "You have the right to access, update, or delete your personal information at any time through your account settings. You can also contact us for assistance with data removal."
        },
        {
            title: "5. Contact Us",
            icon: <Mail size={20} color="#10b981" />,
            content: "If you have any questions about this Privacy Policy, please contact us at realconnectpropertyhub@gmail.com or +2348123831634."
        }
    ];

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="px-6 py-4 border-b border-gray-100 flex-row items-center">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 bg-gray-50 rounded-full">
                    <ArrowLeft size={20} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-brand-dark">Privacy Policy</Text>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
                <View className="mb-8">
                    <Text className="text-gray-500 leading-6">
                        Last updated: March 2026. This Privacy Policy describes how RealConnect collects, uses, and shares your personal information.
                    </Text>
                </View>

                {sections.map((section, index) => (
                    <View key={index} className="mb-8">
                        <View className="flex-row items-center mb-3">
                            <View className="bg-brand-light-blue/20 p-2 rounded-lg mr-3">
                                {section.icon}
                            </View>
                            <Text className="text-lg font-bold text-brand-dark">{section.title}</Text>
                        </View>
                        <Text className="text-gray-600 leading-6 text-base">
                            {section.content}
                        </Text>
                    </View>
                ))}

                <View className="mt-4 mb-12 p-6 bg-brand-light rounded-2xl border border-gray-100">
                    <Text className="text-sm text-gray-400 text-center italic">
                        By using RealConnect, you agree to the collection and use of information in accordance with this policy.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
