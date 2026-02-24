import { Stack } from 'expo-router';

export default function ProfileLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="my-listings" />
            <Stack.Screen name="account-settings" />
            <Stack.Screen name="help" />
        </Stack>
    );
}
