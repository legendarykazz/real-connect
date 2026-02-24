import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { LogOut } from 'lucide-react-native';
import { Link } from 'expo-router';
import Footer from '../../components/Footer';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut();
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <ScrollView className="flex-1 bg-brand-light p-6">
            <View className="items-center mb-10 mt-6">
                <View className="w-24 h-24 bg-brand-green/20 rounded-full items-center justify-center mb-4">
                    <Text className="text-4xl font-bold text-brand-green">
                        {user?.user_metadata?.first_name?.[0]?.toUpperCase() || 'U'}
                    </Text>
                </View>
                <Text className="text-2xl font-bold text-brand-dark">
                    {user?.user_metadata?.first_name} {user?.user_metadata?.last_name}
                </Text>
                <Text className="text-gray-500 mt-1">{user?.email}</Text>
            </View>

            <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <Link href="/(profile)/my-listings" asChild>
                    <TouchableOpacity className="px-6 py-4 border-b border-gray-100 flex-row items-center">
                        <Text className="text-lg text-brand-dark font-medium flex-1">My Listings</Text>
                        <Text className="text-gray-400">→</Text>
                    </TouchableOpacity>
                </Link>
                <Link href="/(profile)/account-settings" asChild>
                    <TouchableOpacity className="px-6 py-4 border-b border-gray-100 flex-row items-center">
                        <Text className="text-lg text-brand-dark font-medium flex-1">Account Settings</Text>
                        <Text className="text-gray-400">→</Text>
                    </TouchableOpacity>
                </Link>
                <Link href="/(profile)/help" asChild>
                    <TouchableOpacity className="px-6 py-4 flex-row items-center">
                        <Text className="text-lg text-brand-dark font-medium flex-1">Help & Support</Text>
                        <Text className="text-gray-400">→</Text>
                    </TouchableOpacity>
                </Link>
            </View>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-50 border border-red-100 py-4 flex-row justify-center items-center rounded-2xl mb-10"
            >
                <LogOut color="#ef4444" size={20} className="mr-2" />
                <Text className="text-red-500 font-bold text-lg ml-2">Log Out</Text>
            </TouchableOpacity>
            <Footer />
        </ScrollView>
    );
}
