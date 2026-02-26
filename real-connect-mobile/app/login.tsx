import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        if (!isLogin && (!firstName || !lastName)) {
            Alert.alert('Error', 'First and Last name are required for new accounts.');
            return;
        }

        setLoading(true);
        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                router.replace('/(tabs)');
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                        },
                    },
                });
                if (error) throw error;
                Alert.alert('Success', 'Check your email to verify your account!');
            }
        } catch (error: any) {
            Alert.alert('Authentication Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-brand-light"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                <View className="mb-10 items-center">
                    <Text className="text-4xl font-extrabold text-brand-dark mb-2">RealConnect</Text>
                    <Text className="text-gray-500 text-base text-center">
                        {isLogin ? 'Welcome back! Log in to continue.' : 'Create an account to get started.'}
                    </Text>
                </View>

                <View className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    {!isLogin && (
                        <>
                            <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">First Name</Text>
                            <TextInput
                                className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-brand-dark"
                                placeholder="John"
                                placeholderTextColor="#9ca3af"
                                value={firstName}
                                onChangeText={setFirstName}
                            />

                            <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Last Name</Text>
                            <TextInput
                                className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-brand-dark"
                                placeholder="Doe"
                                placeholderTextColor="#9ca3af"
                                value={lastName}
                                onChangeText={setLastName}
                            />
                        </>
                    )}

                    <Text className="text-sm font-bold text-gray-700 mb-1 ml-1">Email</Text>
                    <TextInput
                        className="bg-gray-50 rounded-xl px-4 py-3 mb-4 text-brand-dark"
                        placeholder="you@example.com"
                        placeholderTextColor="#9ca3af"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-sm font-bold text-gray-700 ml-1">Password</Text>
                        {isLogin && (
                            <TouchableOpacity onPress={() => router.push('/forgot-password' as any)}>
                                <Text className="text-sm font-bold text-brand-green mr-1">Forgot?</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                    <TextInput
                        className="bg-gray-50 rounded-xl px-4 py-3 mb-6 text-brand-dark"
                        placeholder="••••••••"
                        placeholderTextColor="#9ca3af"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity
                        onPress={handleAuth}
                        disabled={loading}
                        className={`bg-brand-green py-4 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
                    >
                        <Text className="text-white font-bold text-lg">
                            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={() => setIsLogin(!isLogin)}
                    className="items-center mt-2"
                >
                    <Text className="text-gray-600 font-medium">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <Text className="text-brand-green font-bold">
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </Text>
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
