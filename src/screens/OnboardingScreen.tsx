import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";

type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Home: undefined;
  Main: undefined;
  Settings: undefined;
  History: undefined;
  Language: undefined;
  Privacy: undefined;
  HelpCenter: undefined;
  NotificationSettings: undefined;
  SkinAnalysis: undefined;
  Reset: undefined;
  ResultsScreen: undefined;
};

const { width } = Dimensions.get("window");

const slides = [
  {
    image: require("../assets/face-scan.png"),
    title: "Take Live Pictures to Scan Your Skin",
    description: "Use your camera to capture real-time images and get instant AI-powered skin analysis.",
  },
  {
    image: require("../assets/hand-scan.png"),
    title: "Upload Skin Images for Analysis",
    description: "Upload photos of your skin from your gallery to get instant AI-powered detection and insights.",
  },
  {
    image: require("../assets/ai-scan.png"),
    title: "AI Skin Issue Detection",
    description: "Our AI analyzes your skin images to identify possible conditions and provide early insights into potential issues.",
  },
];

export const OnboardingScreen = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigation.navigate("Login");
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={slides[currentSlide].image}
          style={styles.image}
          resizeMode="cover"
        />
        <Text style={styles.title}>{slides[currentSlide].title}</Text>
        <Text style={styles.description}>
          {slides[currentSlide].description}
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.indicator,
                idx === currentSlide && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1B2B",
    padding: 24,
    justifyContent: "space-between",
    alignItems: "center",
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#d9d9d9",
    textAlign: "center",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: "#b0b0b0",
    textAlign: "center",
    marginHorizontal: 16,
    marginBottom: 24,
  },
  bottomSection: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  indicator: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: "#d1d5db",
    marginHorizontal: 4,
  },
  activeIndicator: {
    width: 24,
    backgroundColor: "#0A9DED",
  },
  button: {
    backgroundColor: "#0A9DED",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
