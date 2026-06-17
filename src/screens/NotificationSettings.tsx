import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
} from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import {
  Bell,
  Shield,
  Activity,
  FlaskConical,
} from "lucide-react-native";

type SettingsType = {
  push: boolean;
  sound: boolean;
  vibration: boolean;
  results: boolean;
  alerts: boolean;
  reminders: boolean;
  reports: boolean;
  tips: boolean;
  updates: boolean;
  data: boolean;
  history: boolean;
};

type SectionProps = {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
};

const Section: React.FC<SectionProps> = ({ icon: Icon, title, children }) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ delay: 100 }}
    style={styles.section}
  >
    <BlurView intensity={40} tint="light" style={styles.sectionBlur}>
      <View style={styles.sectionHeader}>
        <Icon size={20} color="#01DE10" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </BlurView>
  </MotiView>
);

type SettingItemProps = {
  title: string;
  description: string;
  value: boolean;
  onToggle: () => void;
};

const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  value,
  onToggle,
}) => (
  <View style={styles.item}>
    <View style={{ flex: 1 }}>
      <Text style={styles.itemTitle}>{title}</Text>
      <Text style={styles.itemDesc}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: "#ccc", true: "#01DE10" }}
      thumbColor={value ? "#fff" : "#f4f3f4"}
    />
  </View>
);

const NotificationSettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<SettingsType>({
    push: true,
    sound: true,
    vibration: false,
    results: true,
    alerts: true,
    reminders: false,
    reports: true,
    tips: true,
    updates: false,
    data: false,
    history: true,
  });

  const toggle = (key: keyof SettingsType) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>Notification Settings</Text>

        {/* General */}
        <Section icon={Bell} title="General">
          <SettingItem
            title="Push Notifications"
            description="Enable all notifications"
            value={settings.push}
            onToggle={() => toggle("push")}
          />
          <SettingItem
            title="Sound"
            description="Play sound for notifications"
            value={settings.sound}
            onToggle={() => toggle("sound")}
          />
          <SettingItem
            title="Vibration"
            description="Vibrate on alerts"
            value={settings.vibration}
            onToggle={() => toggle("vibration")}
          />
        </Section>

        {/* Detection */}
        <Section icon={FlaskConical} title="Detection Alerts">
          <SettingItem
            title="Results Ready"
            description="Notify when analysis is complete"
            value={settings.results}
            onToggle={() => toggle("results")}
          />
          <SettingItem
            title="Abnormal Alerts"
            description="Critical skin condition alerts"
            value={settings.alerts}
            onToggle={() => toggle("alerts")}
          />
          <SettingItem
            title="Scan Reminders"
            description="Reminders to check your skin"
            value={settings.reminders}
            onToggle={() => toggle("reminders")}
          />
        </Section>

        {/* Activity */}
        <Section icon={Activity} title="Activity">
          <SettingItem
            title="Weekly Reports"
            description="Receive weekly skin insights"
            value={settings.reports}
            onToggle={() => toggle("reports")}
          />
          <SettingItem
            title="Tips & Recommendations"
            description="Personalized skin care tips"
            value={settings.tips}
            onToggle={() => toggle("tips")}
          />
          <SettingItem
            title="App Updates"
            description="New features & improvements"
            value={settings.updates}
            onToggle={() => toggle("updates")}
          />
        </Section>

        {/* Privacy */}
        <Section icon={Shield} title="Privacy">
          <SettingItem
            title="Data Usage Alerts"
            description="Notify about sensitive data usage"
            value={settings.data}
            onToggle={() => toggle("data")}
          />
          <SettingItem
            title="History Saved"
            description="Notify when detections are saved"
            value={settings.history}
            onToggle={() => toggle("history")}
          />
        </Section>
      </ScrollView>
    </View>
  );
};

export default NotificationSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1B2B",
    paddingHorizontal: 16,
    paddingTop: 50,
  },

  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 20,
  },

  section: {
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
  },

  sectionBlur: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#0B1B2B",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.3,
    borderColor: "#ddd",
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#f3f3f3",
  },

  itemDesc: {
    fontSize: 12,
    color: "#b9b9b9",
  },
});