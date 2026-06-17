import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
} from 'react-native-reanimated';

type Props = {
    onFinish?: () => void;
    onComplete?: () => void;
};

const SmartLoader: React.FC<Props> = ({ onFinish, onComplete }) => {
    const rotation = useSharedValue(0);
    
    // Support onComplete as an alias for onFinish
    const handleComplete = onFinish || onComplete;

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360, {
                duration: 2000,
                easing: Easing.linear,
            }),
            -1,
            false
        );

        // Auto-complete after 3 seconds
        const timer = setTimeout(() => {
            if (handleComplete) {
                handleComplete();
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [rotation, handleComplete]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: rotation.value + 'deg' }],
    }));

    return (
        <View style={styles.container}>
            <View style={styles.glow} />
            <View style={styles.loaderShell}>
                <Animated.View style={[styles.loader, animatedStyle]}>
                    <ActivityIndicator size="large" color="#00FFC6" />
                </Animated.View>
            </View>
            <Text style={styles.title}>Analyzing skin...</Text>
            <Text style={styles.subtitle}>Please wait while we process your image</Text>
            <View style={styles.progressTrack}>
                <Animated.View style={styles.progressFill} />
            </View>
        </View>
    );
};

export default SmartLoader;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 340,
        minHeight: 210,
        paddingVertical: 26,
        paddingHorizontal: 22,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
        backgroundColor: 'rgba(17, 24, 39, 0.92)',
        justifyContent: 'flex-start',
        alignItems: 'center',
        overflow: 'hidden',
    },
    glow: {
        position: 'absolute',
        top: -80,
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(0, 255, 198, 0.08)',
    },
    loader: {
        transform: [{ scale: 1.02 }],
    },
    loaderShell: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 198, 0.28)',
        backgroundColor: 'rgba(2, 44, 34, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    title: {
        color: '#F9FAFB',
        fontSize: 20,
        lineHeight: 26,
        marginBottom: 8,
        fontFamily: 'Poppins_600SemiBold',
        textAlign: 'center',
    },
    subtitle: {
        color: '#9CA3AF',
        fontSize: 13,
        lineHeight: 20,
        textAlign: 'center',
        fontFamily: 'Poppins_400Regular',
        marginBottom: 18,
    },
    progressTrack: {
        width: '100%',
        height: 6,
        borderRadius: 999,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
    },
    progressFill: {
        width: '68%',
        height: '100%',
        borderRadius: 999,
        backgroundColor: '#00FFC6',
    },
});
