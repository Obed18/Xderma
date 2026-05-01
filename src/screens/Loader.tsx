import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    Easing,
} from 'react-native-reanimated';

const Loader: React.FC = ({ route }: any) => {
    const scanPosition = useSharedValue(0);
    const clipAnim = useSharedValue(0);
    const selectedImage = route?.params?.image;

    useEffect(() => {
        scanPosition.value = withRepeat(
        withTiming(54, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
    );

        clipAnim.value = withRepeat(
        withTiming(1, {
            duration: 2000,
            easing: Easing.linear,
        }),
        -1,
        false
        );
    }, [clipAnim, scanPosition]);

    const scanLineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanPosition.value }],
    }));

    const glowLineStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: scanPosition.value }],
        opacity: 0.6,
    }));

    const textMaskStyle = useAnimatedStyle(() => {
        const progress = clipAnim.value;

        return {
        opacity:
            progress < 0.25 ? 1 : progress < 0.5 ? 0 : progress < 0.75 ? 0 : 1,
        };
    });

    return (
        <View style={styles.container}>
        <View style={styles.loaderWrapper}>
            <ImageBackground
                source={selectedImage || require("../assets/sd1.webp")}
                style={styles.backgroundImage}
                imageStyle={styles.imageStyle}
            >
            <View style={styles.overlay} />
            <Animated.View style={[styles.glowLine, glowLineStyle]} />
            <Animated.View style={[styles.scanLine, scanLineStyle]} />

            <Animated.Text style={[styles.text, textMaskStyle]}>Scanning skin..</Animated.Text>
        </ImageBackground>
        </View>
        </View>
    );
};

export default Loader;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderWrapper: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.88)',
        width: '100%',
        maxWidth: 320,
        height: 150,
        borderRadius: 20,
    },
    imageStyle: {
        opacity: 0.4,
        resizeMode: "cover",
        borderRadius: 20,
    },

    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(17, 24, 39, 0.49)",
        opacity: 0.82,
        width: '100%',
        borderRadius: 20,
    },
    backgroundImage: {
        flex: 1,
        padding: 20,
        borderRadius: 20,
        width: '100%',
    },
    text: {
        color: 'rgb(242,255,240)',
        fontSize: 30,
        fontStyle: 'italic',
        fontWeight: '600',
        zIndex: 2,
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 5,
        backgroundColor: '#ff8282',
        borderRadius: 4,
        zIndex: 3,
    },
    glowLine: {
        position: 'absolute',
        width: '100%',
        height: 6,
        backgroundColor: '#ff828291',
        borderRadius: 4,
        zIndex: 1,
    },
    });
