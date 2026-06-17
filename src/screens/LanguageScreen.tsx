import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ListRenderItem,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Check } from "lucide-react-native";
import { useXderma } from "../context/AppContext";
import { LanguageCode } from "../i18n/translations";

const { width } = Dimensions.get("window");

type Language = {
  id: LanguageCode;
  name: string;
  native: string;
};

const LANGUAGES: Language[] = [
  { id: "en", name: "English", native: "English" },
  { id: "fr", name: "French", native: "Français" },
  { id: "es", name: "Spanish", native: "Español" },
  { id: "de", name: "German", native: "Deutsch" },
  { id: "it", name: "Italian", native: "Italiano" },
  { id: "pt", name: "Portuguese", native: "Português" },
  { id: "ar", name: "Arabic", native: "العربية" },
  { id: "zh", name: "Chinese", native: "中文" },
  { id: "hi", name: "Hindi", native: "हिन्दी" },
  { id: "sw", name: "Swahili", native: "Kiswahili" },
];

export default function LanguageScreen() {
  const { language: selected, setLanguage, t } = useXderma();

  const selectLanguage = (id: LanguageCode) => {
    void setLanguage(id);

    // 🔐 Persist globally (recommended)
    // AsyncStorage.setItem("app_language", id);
    // update your i18n language here
  };

  const renderItem: ListRenderItem<Language> = ({ item, index }) => {
    const isActive = selected === item.id;

    return (
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: index * 60 }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => selectLanguage(item.id)}
        >
          <BlurView intensity={40} tint="dark" style={styles.card}>
            <View style={styles.left}>
              <View style={[styles.flagDot, isActive && styles.activeDot]} />
              <View>
                <Text style={styles.langName}>{item.name}</Text>
                <Text style={styles.native}>{item.native}</Text>
              </View>
            </View>

            <View style={[styles.radio, isActive && styles.radioActive]}>
              {isActive && <Check size={16} color="#fff" />}
            </View>
          </BlurView>
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("language.title")}</Text>
        <Text style={styles.subtitle}>
          {t("language.subtitle")}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={LANGUAGES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F1A",
    paddingHorizontal: 20,
    paddingTop: 60,
  },

  header: {
    marginBottom: 25,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#A0A0A0",
    lineHeight: 20,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    marginBottom: 14,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  flagDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#444",
  },

  activeDot: {
    backgroundColor: "#4ADE80",
  },

  langName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  native: {
    color: "#A0A0A0",
    fontSize: 13,
    marginTop: 2,
  },

  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#444",
    alignItems: "center",
    justifyContent: "center",
  },

  radioActive: {
    backgroundColor: "#4ADE80",
    borderColor: "#4ADE80",
  },
});
