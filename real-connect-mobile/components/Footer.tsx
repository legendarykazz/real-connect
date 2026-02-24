import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Phone, Mail, Instagram, Twitter, Facebook } from 'lucide-react-native';

export default function Footer() {
    return (
        <View className="bg-brand-dark pt-12 pb-8 px-6 mt-8">
            <View className="mb-8">
                <Text className="text-white text-3xl font-extrabold mb-4">Real<Text className="text-brand-green">Connect</Text></Text>
                <Text className="text-gray-400 text-base leading-relaxed">
                    Premium land and property listings across Nigeria. Verified for your peace of mind.
                </Text>
            </View>

            <View className="mb-8">
                <Text className="text-white text-lg font-bold mb-4">Contact Us</Text>
                <View className="flex-row items-center mb-3">
                    <Phone color="#10b981" size={20} />
                    <Text className="text-gray-300 ml-3 shrink-0">+234812383164</Text>
                </View>
                <View className="flex-row items-center">
                    <Mail color="#10b981" size={20} />
                    <Text className="text-gray-300 ml-3 shrink-0">realconnectpropertyhub@gmail.com</Text>
                </View>
            </View>

            <View className="flex-row items-center space-x-4 mb-8">
                <TouchableOpacity className="bg-gray-800 p-3 rounded-full">
                    <Facebook color="white" size={20} />
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-800 p-3 rounded-full mr-4 ml-4">
                    <Twitter color="white" size={20} />
                </TouchableOpacity>
                <TouchableOpacity className="bg-gray-800 p-3 rounded-full mr-4">
                    <Instagram color="white" size={20} />
                </TouchableOpacity>
            </View>

            <View className="border-t border-gray-800 pt-6">
                <Text className="text-gray-500 text-center text-sm">
                    © {new Date().getFullYear()} RealConnect Mobile. All rights reserved.
                </Text>
            </View>
        </View>
    );
}
