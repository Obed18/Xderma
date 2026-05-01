import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { HelpCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const OnboardingScreen: React.FC = () => {
  const fade = useSharedValue(0);
  const translateY = useSharedValue(40);
  const navigation = useNavigation<any>();

  const bottomSheetY = useSharedValue(200);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 800 });
    translateY.value = withTiming(0, {
      duration: 800,
      easing: Easing.out(Easing.exp),
    });

    bottomSheetY.value = withDelay(
      400,
      withTiming(0, {
        duration: 700,
        easing: Easing.out(Easing.exp),
      })
    );
  }, []);

  const animatedHeader = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBottom = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomSheetY.value }],
  }));

const handleLogin = () => {
  navigation.navigate('Login');
};

  const handleForgot = () => {
  navigation.navigate('Reset');
  };

  const handleHelp = () => {
  navigation.navigate('Help');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Background */}
      <View style={styles.redBackground} />

      {/* Header Content */}
      <Animated.View style={[styles.centerContent, animatedHeader]}>
        <View style={styles.logoRow}>
          <Image
            source={require('../assets/logo.png')} // replace
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Deep Learning and Explainable AI</Text>
        <Text style={styles.subtitle}>
          An Intelligent Skin Disease Detection and Clinical Decision Support System Using 
        </Text>
      </Animated.View>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, animatedBottom]}>
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>Tap to Log In</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineBtn} onPress={handleForgot}>
          <Text style={styles.outlineText}>Forgot Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.helpRow} onPress={handleHelp}>
          <HelpCircle size={16} color="#666" />
          <Text style={styles.helpText}> Need help? Tap here.</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#CDD9FF',
  },

  redBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#CDD9FF',
  },

  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  logo: {
    width: 150,
    height: 150,
  },

  title: {
    fontSize: 18,
    color: '#0F172A',
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Poppins_700Bold',
  },

  subtitle: {
    fontSize: 14,
    color: '#0A9DED',
    marginTop: 6,
    opacity: 0.9,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },

  bottomSheet: {
    backgroundColor: '#eee',
    padding: 30,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    alignItems: 'center',
    paddingBottom: 70,
    paddingTop: 60,
  },

  loginBtn: {
    backgroundColor: '#0A9DED',
    width: '90%',
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },

  loginText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600semiBold',
  },

  outlineBtn: {
    width: '90%',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#0A9DED',
    alignItems: 'center',
    marginBottom: 14,
  },

  outlineText: {
    color: '#0A9DED',
    fontSize: 15,
    fontFamily: 'Poppins_600semiBold',
  },

  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  helpText: {
    fontSize: 13,
    color: '#555',
    fontFamily: 'Poppins_400Regular',
  },
});

export default OnboardingScreen;