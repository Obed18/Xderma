import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView, ImageBackground, StatusBar, 
} from "react-native";
import { BlurView } from "expo-blur";
import { MotiView, AnimatePresence } from "moti";
import {
  Menu,
  X,
  Camera,
  Upload,
  Clock,
  Info,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import DisclaimerModal from "./DisclaimerModal";
import { useXderma } from "../context/AppContext";
import { Ionicons } from "@expo/vector-icons";


const { width } = Dimensions.get("window");

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useXderma();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
        <BlurView intensity={50} style={styles.mainHeader}>
            <View>
            <Text style={styles.Headertitle}>Home</Text>
            <Text style={styles.Headersubtitle}>
                Skin Care with AI dermatology analysis
            </Text>
            </View>

            <View style={styles.headerIcons}>
                <Ionicons name="search" size={22} color="#fff" />
                <Ionicons name="options-outline" size={22} color="#fff" />
            </View>
        </BlurView>
      {/* 🔽 MAIN CONTENT (slides down) */}
      <MotiView
        animate={{
          translateY: menuOpen ? 200 : 0,
        }}
        transition={{ type: "timing", duration: 400 }}
        style={styles.main}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HERO CARD */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            style={styles.heroCard}
          >
          <ImageBackground
            source={require("../assets/card.png")}
            style={styles.backgroundImage}
            imageStyle={styles.imageStyle}
          >
        <View style={styles.overlay} />
            <Text style={styles.title}>{t("home.title")}</Text>
            <Text style={styles.highlight}>{t("home.highlight")}</Text>

            <Text style={styles.description}>
              {t("home.description")}
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setShowDisclaimer(true)}
                activeOpacity={0.85}
              >
                <Camera color="#fff" size={18} />
                <Text style={styles.primaryText}>{t("home.startAnalysis")}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryBtn}>
                <Info color="#fff" size={18} />
                <Text style={styles.secondaryText}>{t("home.learnMore")}</Text>
              </TouchableOpacity>
            </View>
      </ImageBackground>
          </MotiView>

          {/* STATS */}
          <View style={styles.statsRow}>
            {[
              ["87.3%", t("home.accuracy")],
              ["0.934", "ROC-AUC"],
              ["7", t("home.conditions")],
              ["<3s", t("home.response")],
            ].map((item, i) => (
              <View key={i} style={styles.statBox}>
                <Text style={styles.statValue}>{item[0]}</Text>
                <Text style={styles.statLabel}>{item[1]}</Text>
              </View>
            ))}
          </View>

          {/* ACTION CARDS */}
          <ActionCard
            icon={<Camera color="#9CA3AF" />}
            title={t("home.captureImage")}
            desc={t("home.captureImageDesc")}
          />

          <ActionCard
            icon={<Upload color="#00D4FF" />}
            title={t("home.uploadImage")}
            desc={t("home.uploadImageDesc")}
            highlight
          />

          <ActionCard
            icon={<Clock color="#00D4FF" />}
            title={t("home.viewHistory")}
            desc={t("home.viewHistoryDesc")}
          />
        </ScrollView>
      </MotiView>

      <DisclaimerModal
        visible={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onAgree={() => navigation.navigate("SkinAnalysis")}
      />
    </View>
  );
};

export default HomeScreen;

/* 🔹 ACTION CARD COMPONENT */
const ActionCard = ({
  icon,
  title,
  desc,
  highlight,
}: any) => (
  <MotiView
    from={{ opacity: 0, translateY: 15 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ delay: 300 }}
    style={[
      styles.card,
      highlight && { borderColor: "#00d5ff3f", backgroundColor: "#0f2a3a" },
    ]}
  >
    <View style={[styles.cardIcon, { width: 25, height: 25 }]}>{icon}</View>
    <View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>
    </View>
  </MotiView>
);

/* 🎨 STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1B2B",
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    paddingBottom: 100,
  },
    mainHeader: {
        padding: 16,
        paddingTop: 60,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        borderTopRightRadius: 24,
        borderTopLeftRadius: 24,
    },

    Headertitle: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
    },

    Headersubtitle: {
        color: "#9CA3AF",
        fontSize: 13,
    },

    headerIcons: {
        flexDirection: "row",
        gap: 12,
    },

  main: {
    flex: 1,
    paddingHorizontal: 16,
  },

  header: {
    marginTop: 50,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
  },

  heroCard: {
    backgroundColor: "#0f243877",
    borderRadius: 20,
    marginTop: 20,
  },
  imageStyle: {
    opacity: 0.3,
    resizeMode: "cover",
    borderRadius: 20,
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0f243845",
    opacity: 0.82,
  },
  backgroundImage: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    
  },


  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "600",
    fontFamily: 'Poppins_600SemiBold',
  },

  highlight: {
    fontSize: 24,
    color: "#00D4FF",
    fontWeight: "800",
    marginBottom: 10,
    fontFamily: 'Poppins_700Bold',
  },

  description: {
    color: "#C7D2FE",
    marginBottom: 20,
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DA1F2",
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },

  primaryText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: 'Poppins_600SemiBold',
  },

  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#fff",
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },

  secondaryText: {
    color: "#fff",
    fontFamily: 'Poppins_600SemiBold',
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 50,
  },

  statBox: {
    alignItems: "center",
  },

  statValue: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: 'Poppins_700Bold',
  },

  statLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1F3A5F",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#12263A",
    gap: 12,
  },

  cardIcon: {
    marginRight: 10,
  },

  cardTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },

  cardDesc: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 4,
    maxWidth: width * 0.7,
    fontFamily: 'Poppins_400Regular',
  },
});
