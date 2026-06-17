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
import HistoryScreen from "./HistoryScreen";
import PrivacyScreen from "./PrivacyScreen";
import { useNavigation } from "@react-navigation/native";
import { useXderma } from "../context/AppContext";
import { TranslationKey } from "../i18n/translations";

const { width, height } = Dimensions.get("window");

type MenuItemId = "home" | "analyze" | "history" | "privacy" | "settings";

const menuItems: Array<{
  id: MenuItemId;
  labelKey: TranslationKey;
  icon: typeof Home;
}> = [
  { id: "home", labelKey: "main.home", icon: Home },
  { id: "analyze", labelKey: "main.analyze", icon: Microscope },
  { id: "history", labelKey: "main.history", icon: History },
  { id: "privacy", labelKey: "main.privacy", icon: Shield },
  { id: "settings", labelKey: "main.settings", icon: Settings },
];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MainScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useXderma();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMenuItem, setActiveMenuItem] = useState<MenuItemId>("home");
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

  const handleMenuItemPress = (id: MenuItemId) => {
    if (id === "analyze") {
      navigation.navigate("SkinAnalysis");
      closeMenu();
      return;
    }

    setActiveMenuItem(id);
    closeMenu();
  };

  const renderMainContent = () => {
    if (activeMenuItem === "home") {
      return <HomeScreen />;
    }

    if (activeMenuItem === "settings") {
      return <SettingsScreen />;
    }

    if (activeMenuItem === "history")  {
      return <HistoryScreen />;
    }

    if (activeMenuItem === "privacy")  {
      return <PrivacyScreen />;
    }
    
    const activeLabelKey =
      menuItems.find((item) => item.id === activeMenuItem)?.labelKey ??
      "main.home";
    const activeLabel = t(activeLabelKey);

    return (
      <View style={styles.placeholderContent}>
        <Text style={styles.title}>{activeLabel}</Text>
        <Text style={styles.subtitle}>
          {t("main.placeholder", { screen: activeLabel })}
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
              const isActive = activeMenuItem === item.id;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isActive && styles.activeMenuItem]}
                  onPress={() => handleMenuItemPress(item.id)}
                >
                  <IconComponent color="#081f2c" size={22} />
                  <Text style={styles.menuItemText}>{t(item.labelKey)}</Text>
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
    backgroundColor: "#f8f8f8",
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
    backgroundColor: "#cad3efc1",
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
