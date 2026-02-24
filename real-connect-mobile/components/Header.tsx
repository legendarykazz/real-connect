import React from 'react';
import { View, Text, TouchableOpacity, Platform, Alert } from 'react-native';
import { Menu, Bell } from 'lucide-react-native';

export default function Header() {
    return (
        <View className={`bg-white px-5 pb-4 border-b border-gray-100 flex-row items-end justify-between shadow-sm z-50 ${Platform.OS === 'ios' ? 'pt-14' : 'pt-10'}`}>
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => Alert.alert('Menu', 'Navigation menu coming soon')} className="mr-3 p-1">
                    <Menu color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text className="text-2xl font-extrabold text-brand-dark tracking-tight">
                    Real<Text className="text-brand-green">Connect</Text>
                </Text>
            </View>
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => Alert.alert('Notifications', 'You have no new notifications')} className="p-2 relative">
                    <Bell color="#475569" size={22} />
                    <View className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                </TouchableOpacity>
            </View>
        </View>
    );
}
