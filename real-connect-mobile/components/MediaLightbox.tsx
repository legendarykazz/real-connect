import React, { useState } from 'react';
import {
    Modal,
    View,
    TouchableOpacity,
    Image,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    Text,
    Platform
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface MediaLightboxProps {
    visible: boolean;
    onClose: () => void;
    media: { url: string; type: 'image' | 'video' }[];
    initialIndex: number;
}

export default function MediaLightbox({ visible, onClose, media, initialIndex }: MediaLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [loading, setLoading] = useState(true);

    if (!media || media.length === 0) return null;

    const currentMedia = media[currentIndex];

    const handlePrev = () => {
        setLoading(true);
        setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
    };

    const handleNext = () => {
        setLoading(true);
        setCurrentIndex((prev) => (prev + 1) % media.length);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Close Button */}
                <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                >
                    <X color="white" size={32} />
                </TouchableOpacity>

                {/* Counter */}
                <View style={styles.counter}>
                    <Text style={styles.counterText}>
                        {currentIndex + 1} / {media.length}
                    </Text>
                </View>

                {/* Main Content */}
                <View style={styles.contentContainer}>
                    {loading && (
                        <View style={styles.loader}>
                            <ActivityIndicator size="large" color="#10b981" />
                        </View>
                    )}

                    {currentMedia.type === 'image' ? (
                        <Image
                            source={{ uri: currentMedia.url }}
                            style={styles.image}
                            resizeMode="contain"
                            onLoadEnd={() => setLoading(false)}
                        />
                    ) : (
                        <Video
                            source={{ uri: currentMedia.url }}
                            style={styles.video}
                            useNativeControls
                            resizeMode={ResizeMode.CONTAIN}
                            isLooping={false}
                            shouldPlay
                            onLoad={() => setLoading(false)}
                            onError={(e) => {
                                console.error("Video error:", e);
                                setLoading(false);
                            }}
                        />
                    )}
                </View>

                {/* Navigation Arrows */}
                {media.length > 1 && (
                    <>
                        <TouchableOpacity
                            style={[styles.navButton, styles.prevButton]}
                            onPress={handlePrev}
                        >
                            <ChevronLeft color="white" size={40} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.navButton, styles.nextButton]}
                            onPress={handleNext}
                        >
                            <ChevronRight color="white" size={40} />
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 40,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    counter: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 66 : 46,
        left: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    counterText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    contentContainer: {
        width: width,
        height: height * 0.8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height * 0.8,
    },
    video: {
        width: width,
        height: height * 0.8,
    },
    loader: {
        position: 'absolute',
        zIndex: 1,
    },
    navButton: {
        position: 'absolute',
        top: '50%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 10,
        borderRadius: 30,
        marginTop: -30,
    },
    prevButton: {
        left: 10,
    },
    nextButton: {
        right: 10,
    },
});
