import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView, 
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

type PrivacyIconName = keyof typeof Ionicons.glyphMap;

type SettingItemProps = {
  icon: PrivacyIconName;
  title: string;
  subtitle?: string;
  value: boolean;
  onToggle: (value: boolean) => void;
};

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

const PrivacyScreen = () => {
  const [saveHistory, setSaveHistory] = useState(true);
  const [analytics, setAnalytics] = useState(false);
  const [aiImprove, setAiImprove] = useState(true);
  const [camera, setCamera] = useState(true);
  const [gallery, setGallery] = useState(true);
  const [biometric, setBiometric] = useState(false);

  const SettingItem = ({ icon, title, subtitle, value, onToggle }: SettingItemProps) => (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={20} color="#00E676" />
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "#2A2A2A", true: "#00E676" }}
        thumbColor="#fff"
      />
    </View>
  );

  const Section = ({ title, children }: SectionProps) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* Header */}
        <BlurView intensity={50} style={styles.header}>
            <View>
            <Text style={styles.title}>Privacy & Security</Text>
            <Text style={styles.subtitle}>
                Your data, your control
            </Text>
            </View>

            {/* <View style={styles.headerIcons}>
                <Ionicons name="search" size={22} color="#fff" />
                <Ionicons name="options-outline" size={22} color="#fff" />
            </View> */}
        </BlurView>

      {/* Data Usage */}
      <Section title="Data Usage">
        <SettingItem
          icon="time-outline"
          title="Save to History"
          subtitle="Store your scans securely"
          value={saveHistory}
          onToggle={setSaveHistory}
        />
        <SettingItem
          icon="analytics-outline"
          title="Anonymous Analytics"
          subtitle="Help us improve performance"
          value={analytics}
          onToggle={setAnalytics}
        />
        <SettingItem
          icon="sparkles-outline"
          title="Improve AI"
          subtitle="Use data to enhance detection"
          value={aiImprove}
          onToggle={setAiImprove}
        />
      </Section>

      {/* Permissions */}
      <Section title="Permissions">
        <SettingItem
          icon="camera-outline"
          title="Camera Access"
          value={camera}
          onToggle={setCamera}
        />
        <SettingItem
          icon="image-outline"
          title="Gallery Access"
          value={gallery}
          onToggle={setGallery}
        />
      </Section>

      {/* Security */}
      <Section title="Security">
        <SettingItem
          icon="finger-print-outline"
          title="Biometric Lock"
          subtitle="Protect access to your scans"
          value={biometric}
          onToggle={setBiometric}
        />
      </Section>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: "#FF5252" }]}>
          Danger Zone
        </Text>

        <TouchableOpacity style={styles.dangerButton}>
          <Text style={styles.dangerText}>Delete All History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton}>
          <Text style={styles.dangerText}>Delete Account</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetButton}>
          <Text style={styles.resetText}>Reset Privacy Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default PrivacyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1B2B",
    paddingBottom: 50,
    marginBottom: 30,
  },

  header: {
        padding: 16,
        paddingTop: 50,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#fff",
  },

  headerSubtitle: {
    fontSize: 14,
    color: "#aaa",
    marginTop: 4,
  },

  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },

  sectionTitle: {
    color: "#aaa",
    fontSize: 13,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#1b2f43",
    borderRadius: 20,
    paddingVertical: 10,
  },

  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#0B1B2B",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },

  subtitle: {
    color: "#777",
    fontSize: 12,
    marginTop: 2,
  },

  dangerButton: {
    backgroundColor: "#2A0D0D",
    borderWidth: 1,
    borderColor: "#FF5252",
    padding: 16,
    borderRadius: 16,
    marginTop: 10,
  },

  dangerText: {
    color: "#FF5252",
    textAlign: "center",
    fontWeight: "600",
  },

  resetButton: {
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#333",
    marginBottom: 70,
  },

  resetText: {
    color: "#ccc",
    textAlign: "center",
  },
});
