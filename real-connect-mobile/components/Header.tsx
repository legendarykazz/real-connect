import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Alert, Modal, ScrollView, RefreshControl, Dimensions } from 'react-native';
import { Menu, Bell, X, CheckCircle2, XCircle, Info, User as UserIcon, LayoutList, Phone, ChevronRight } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useRouter } from 'expo-router';

const { height } = Dimensions.get('window');

export default function Header() {
    const { user } = useAuth();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalVisible, setModalVisible] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
        setRefreshing(false);
    };

    useEffect(() => {
        fetchNotifications();

        if (user) {
            const channel = supabase
                .channel(`public:notifications:user_id=eq.${user.id}`)
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                }, (payload) => {
                    setNotifications(prev => [payload.new, ...prev].slice(0, 10));
                    setUnreadCount(prev => prev + 1);
                })
                .subscribe();

            return () => { supabase.removeChannel(channel); };
        }
    }, [user]);

    const handleMarkAsRead = async (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', user?.id || '');
    };

    const handleMarkAllAsRead = async () => {
        if (unreadCount === 0) return;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);

        await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user?.id || '')
            .eq('is_read', false);
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'approved': return <CheckCircle2 color="#10b981" size={24} />;
            case 'rejected': return <XCircle color="#ef4444" size={24} />;
            default: return <Info color="#3b82f6" size={24} />;
        }
    };

    // Format relative time (e.g., "2 hours ago")
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const navigateTo = (path: any) => {
        setIsMenuOpen(false);
        router.push(path);
    };

    return (
        <View className={`bg-white px-5 pb-4 border-b border-gray-100 flex-row items-end justify-between shadow-sm z-50 ${Platform.OS === 'ios' ? 'pt-14' : 'pt-10'}`}>
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => setIsMenuOpen(true)} className="mr-3 p-1">
                    <Menu color="#0f172a" size={24} />
                </TouchableOpacity>
                <Text className="text-2xl font-extrabold text-brand-dark tracking-tight">
                    Real<Text className="text-brand-green">Connect</Text>
                </Text>
            </View>
            <View className="flex-row items-center">
                <TouchableOpacity onPress={() => user ? setModalVisible(true) : Alert.alert('Login', 'Please login to view notifications.')} className="p-2 relative">
                    <Bell color="#475569" size={22} />
                    {unreadCount > 0 && (
                        <View className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full items-center justify-center border-2 border-white">
                            <Text className="text-white text-[9px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Navigation Menu Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isMenuOpen}
                onRequestClose={() => setIsMenuOpen(false)}
            >
                <View className="flex-1 bg-black/40 flex-row">
                    {/* Sidebar */}
                    <View className="bg-white w-4/5 h-full shadow-2xl">
                        <View className={`px-6 pb-6 border-b border-gray-100 flex-row justify-between items-end ${Platform.OS === 'ios' ? 'pt-16' : 'pt-12'}`}>
                            <Text className="text-2xl font-extrabold text-brand-dark tracking-tight">
                                Menu
                            </Text>
                            <TouchableOpacity onPress={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 rounded-full">
                                <X color="#4b5563" size={20} />
                            </TouchableOpacity>
                        </View>

                        <View className="flex-1 px-4 py-6">
                            <TouchableOpacity
                                onPress={() => navigateTo('/(tabs)/profile')}
                                className="flex-row items-center justify-between p-4 mb-3 bg-gray-50 rounded-2xl active:bg-gray-100"
                            >
                                <View className="flex-row items-center">
                                    <View className="bg-white p-2.5 rounded-xl shadow-sm mr-4">
                                        <UserIcon color="#10b981" size={22} />
                                    </View>
                                    <Text className="text-lg font-bold text-gray-800">My Profile</Text>
                                </View>
                                <ChevronRight color="#cbd5e1" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => user ? navigateTo('/(profile)/my-listings') : Alert.alert('Login required', 'Please login to see your listings.')}
                                className="flex-row items-center justify-between p-4 mb-3 bg-gray-50 rounded-2xl active:bg-gray-100"
                            >
                                <View className="flex-row items-center">
                                    <View className="bg-white p-2.5 rounded-xl shadow-sm mr-4">
                                        <LayoutList color="#3b82f6" size={22} />
                                    </View>
                                    <Text className="text-lg font-bold text-gray-800">My Listings</Text>
                                </View>
                                <ChevronRight color="#cbd5e1" size={20} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => navigateTo('/(profile)/help')}
                                className="flex-row items-center justify-between p-4 mb-3 bg-gray-50 rounded-2xl active:bg-gray-100"
                            >
                                <View className="flex-row items-center">
                                    <View className="bg-white p-2.5 rounded-xl shadow-sm mr-4">
                                        <Phone color="#f97316" size={22} />
                                    </View>
                                    <Text className="text-lg font-bold text-gray-800">Contact Us</Text>
                                </View>
                                <ChevronRight color="#cbd5e1" size={20} />
                            </TouchableOpacity>
                        </View>

                        <View className="p-6 border-t border-gray-100">
                            <Text className="text-center text-sm font-medium text-gray-400">RealConnect v1.0.0</Text>
                        </View>
                    </View>
                    {/* Overlay Click to Close */}
                    <TouchableOpacity
                        className="flex-1"
                        onPress={() => setIsMenuOpen(false)}
                        activeOpacity={1}
                    />
                </View>
            </Modal>

            {/* Notification Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 bg-black/30 justify-end">
                    <View className="bg-white" style={{ height: height * 0.85, borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
                        {/* Modal Header */}
                        <View className="flex-row items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl">
                            <Text className="text-xl font-bold text-gray-800">Notifications</Text>
                            <View className="flex-row items-center">
                                {unreadCount > 0 && (
                                    <TouchableOpacity onPress={handleMarkAllAsRead} className="mr-4">
                                        <Text className="text-brand-green font-semibold text-sm">Mark all read</Text>
                                    </TouchableOpacity>
                                )}
                                <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-200 p-2 rounded-full">
                                    <X color="#4b5563" size={20} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Modal Body */}
                        <ScrollView
                            className="flex-1 bg-gray-50/30"
                            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNotifications(); }} />}
                        >
                            {notifications.length === 0 ? (
                                <View className="p-10 items-center justify-center mt-10">
                                    <Bell color="#cbd5e1" size={48} />
                                    <Text className="text-gray-400 mt-4 font-medium text-lg">No notifications yet.</Text>
                                    <Text className="text-gray-400 text-sm text-center mt-2">When an admin reviews your property, you'll see it here.</Text>
                                </View>
                            ) : (
                                <View className="pb-10">
                                    {notifications.map((notif) => (
                                        <TouchableOpacity
                                            key={notif.id}
                                            activeOpacity={0.7}
                                            onPress={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                            className={`p-5 flex-row border-b border-gray-100 ${!notif.is_read ? 'bg-blue-50/40' : 'bg-white'}`}
                                        >
                                            <View className="mr-4 mt-1">
                                                {getNotificationIcon(notif.type)}
                                            </View>
                                            <View className="flex-1">
                                                <Text className={`text-base mb-1 ${!notif.is_read ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                                    {notif.title}
                                                </Text>
                                                <Text className="text-sm text-gray-500 leading-5 mb-2">
                                                    {notif.message}
                                                </Text>
                                                <Text className="text-[11px] text-gray-400 font-medium">
                                                    {formatTime(notif.created_at)}
                                                </Text>
                                            </View>
                                            {!notif.is_read && (
                                                <View className="w-2.5 h-2.5 rounded-full bg-brand-green ml-2 mt-1" />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
