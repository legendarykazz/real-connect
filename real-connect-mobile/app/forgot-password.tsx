import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleReset = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address.');
            return;
        }

        setLoading(true);
        try {
            // Usually, users will open the link in their email which will direct them to the web app to reset
            // We'll configure typical behavior for Supabase.
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                // If you have a specific mobile deep link or prefer using the web app URL:
                redirectTo: 'https://realconnect.vercel.app/reset-password', // or 'realconnectmobile://reset-password'
            });

            if (error) throw error;
            Alert.alert('Success', "We've sent a password reset link to your email.");
            router.replace('/login');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-brand-light justify-center p-6"
        >
            <View className="mb-10 items-center">
                <Text className="text-3xl font-extrabold text-brand-dark mb-2">Reset Password</Text>
                <Text className="text-gray-500 text-base text-center">
                    Enter your email to receive a reset link.
                </Text>
            </View>

            <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Email</Text>
                <TextInput
                    className="bg-gray-50 rounded-xl px-4 py-3 mb-6 text-brand-dark"
                    placeholder="you@example.com"
                    placeholderTextColor="#9ca3af"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <TouchableOpacity
                    onPress={handleReset}
                    disabled={loading}
                    className={`bg-brand-green py-4 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="items-center mt-6"
                >
                    <Text className="text-brand-green font-bold">
                        Back to Log In
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}
