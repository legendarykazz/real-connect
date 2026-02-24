import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function AccountSettingsScreen() {
    const { user } = useAuth();
    const router = useRouter();

    const [firstName, setFirstName] = useState(user?.user_metadata?.first_name || '');
    const [lastName, setLastName] = useState(user?.user_metadata?.last_name || '');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const updates: any = {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                }
            };

            if (password.length > 0) {
                if (password.length < 6) {
                    Alert.alert('Error', 'Password must be at least 6 characters');
                    setLoading(false);
                    return;
                }
                updates.password = password;
            }

            const { error } = await supabase.auth.updateUser(updates);

            if (error) throw error;

            Alert.alert('Success', 'Profile updated successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);

        } catch (err: any) {
            Alert.alert('Error updating profile', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-brand-light">
            <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100 flex-row items-center shadow-sm z-50">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
                    <ArrowLeft color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-brand-dark">Account Settings</Text>
            </View>

            <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Personal Details</Text>

                    <View className="mb-4">
                        <Text className="text-brand-dark font-medium mb-2">First Name</Text>
                        <TextInput
                            value={firstName}
                            onChangeText={setFirstName}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-brand-dark"
                            placeholder="Enter first name"
                        />
                    </View>

                    <View className="mb-4">
                        <Text className="text-brand-dark font-medium mb-2">Last Name</Text>
                        <TextInput
                            value={lastName}
                            onChangeText={setLastName}
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-brand-dark"
                            placeholder="Enter last name"
                        />
                    </View>

                    <View className="mb-2">
                        <Text className="text-brand-dark font-medium mb-2">Email Address</Text>
                        <TextInput
                            value={user?.email || ''}
                            editable={false}
                            className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-gray-500"
                        />
                        <Text className="text-xs text-gray-400 mt-1">Email cannot be changed.</Text>
                    </View>
                </View>

                <View className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                    <Text className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Security</Text>

                    <View className="mb-2">
                        <Text className="text-brand-dark font-medium mb-2">New Password (Optional)</Text>
                        <TextInput
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-brand-dark"
                            placeholder="Enter new password"
                        />
                        <Text className="text-xs text-gray-400 mt-1">Leave blank to keep current password.</Text>
                    </View>
                </View>

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    className={`flex-row items-center justify-center py-4 rounded-xl mb-12 ${loading ? 'bg-brand-green/70' : 'bg-brand-green'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <>
                            <Save color="white" size={20} className="mr-2" />
                            <Text className="text-white font-bold text-lg">Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
