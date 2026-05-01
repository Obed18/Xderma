import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  Menu,
  X,
  Home,
  Microscope,
  History,
  Shield,
  Settings,
} from "lucide-react-native";
import HomeScreen from "./HomeScreen";
import SettingsScreen from "./SettingsScreen";
import DisclaimerModal from "./DisclaimerModal";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const menuItems = [
  { id: 1, label: "Home", icon: Home },
  { id: 2, label: "Analyze", icon: Microscope },
  { id: 3, label: "History", icon: History },
  { id: 4, label: "Privacy", icon: Shield },
  { id: 5, label: "Settings", icon: Settings },
];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MainScreen = () => {
  const navigation = useNavigation<any>();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState("Home");
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const closeMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMenuOpen(false);
  };

  const openMenu = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMenuOpen(true);
  };

  const toggleMenu = () => {
    if (menuOpen) {
      closeMenu();
      return;
    }

    openMenu();
  };

  const handleMenuItemPress = (label: string) => {
    if (label === "Analyze") {
      navigation.navigate("SkinAnalysis");
      closeMenu();
      return;
    }

    setActiveMenuItem(label);
    closeMenu();
  };

  const renderMainContent = () => {
    if (activeMenuItem === "Home") {
      return <HomeScreen />;
    }

    if (activeMenuItem === "Settings") {
      return <SettingsScreen />;
    }

    return (
      <View style={styles.placeholderContent}>
        <Text style={styles.title}>{activeMenuItem}</Text>
        <Text style={styles.subtitle}>
          {activeMenuItem} content will be shown here when this menu item is active.
        </Text>
      </View>
    );
  };

  return (
      <>
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require("../assets/Background.png")}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <View style={styles.overlay} />

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={menuOpen ? closeMenu : openMenu}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            {menuOpen ? (
              <X color="#364e84" size={28} />
            ) : (
              <Menu color="#364e84" size={28} />
            )}
          </TouchableOpacity>
        </View>

        {menuOpen && (
          <View style={styles.menuContainer}>
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeMenuItem === item.label;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isActive && styles.activeMenuItem]}
                  onPress={() => handleMenuItemPress(item.label)}
                >
                  <IconComponent color="#081f2c" size={22} />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={styles.content}>{renderMainContent()}</View>
      </ImageBackground>
    </View>

<DisclaimerModal
  visible={showDisclaimer}
  onClose={() => setShowDisclaimer(false)}
  onAgree={() => navigation.navigate("SkinAnalysis")}
/>
</>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#b7c7fa",
  },

  backgroundImage: {
    flex: 1,
    width,
    height,
  },

  logo: {
    width: 80,
    height: 80,
  },

  imageStyle: {
    opacity: 0.12,
    resizeMode: "cover",
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#a9bdffc1",
    opacity: 0.82,
  },

  header: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
    elevation: 10,
  },

  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuButton: {
    padding: 8,
    zIndex: 11,
    elevation: 11,
  },

  content: {
    flex: 1,
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },

  subtitle: {
    color: "#D6E4FF",
    fontSize: 16,
    lineHeight: 22,
  },

  menuContainer: {
    backgroundColor: "rgba(10, 75, 255, 0)",
    overflow: "hidden",
    marginBottom: 30,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 24,
  },

  activeMenuItem: {
    backgroundColor: "#0a9ded1c",
  },

  menuItemText: {
    color: "#081f2c",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 16,
  },

  placeholderContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "flex-start",
  },
});
