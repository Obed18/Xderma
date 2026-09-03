import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useXderma } from "../context/AppContext";
import {
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  MapPin,
  Lock,
  Trash2,
  Edit,
  Shield,
  Award,
  Bell,
  Gift,
  CheckCircle, List, Heart, AlertTriangle, Globe,
} from "lucide-react-native";

type ProfileView =
  | "main"
  | "settings"
  | "analytics";

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t, user, logout, authLoading } = useXderma();

  const [view, setView] = useState<ProfileView>("main");

  const handleLogout = async () => {
    if (authLoading) return;

    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to log out at the moment. Please try again.';

      Alert.alert('Logout failed', message);
    }
  };

  if (view === "settings") {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <BackHeader
          title={t("settings.settings")}
          onBack={() => setView("main")}
        />
        <View style={styles.card}>
          <SettingsItem
            icon={<Edit size={18} />}
            label={t("settings.editProfile")}
            desc={t("settings.editProfileDesc")}
          />

          {/* Region */}
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <IconBox>
                <MapPin size={18} />
              </IconBox>
              <View>
                <Text style={styles.itemTitle}>
                  {t("settings.changeRegion")}
                </Text>
              </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              
                <TouchableOpacity style={styles.chipActive}>
                  <Text
                    style={styles.chipText}>
                  </Text>
                </TouchableOpacity>
            </ScrollView>
          </View>

          <SettingsItem icon={<Shield size={18} />} label={t("settings.verifyAccount")}/>

          <SettingsItem
            icon={<Lock size={18} />}
            label={t("settings.privacy")}
            desc={t("settings.privacyDesc")}
          />

          <SettingsItem
            icon={<Bell size={18} />}
            label={t("settings.notifications")}
            desc={t("settings.notificationsDesc")}
          />

          <SettingsItem
            icon={<Trash2 size={18} />}
            label={t("settings.deleteAccount")}
            desc={t("settings.deleteAccountDesc")}
            danger
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("settings.profile")}</Text>

        <View style={styles.profileContainer}>
          <Image source={require("../assets/account.png")} style={styles.profileImage} />
          <Text style={styles.email}>{user?.email ?? ""}</Text>
        </View>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.card}>
        <MenuItem
          icon={<Settings size={18} />}
          label={t("settings.settings")}
          onClick={() => setView("settings")}
        />

        <MenuItem
          icon={<Lock size={18} />}
          label={t("settings.privacy")}
          desc={t("settings.privacyDesc")}
          onClick={() => navigation.navigate('Privacy')}
        />

        <MenuItem
          icon={<Bell size={18} />}
          label={t("settings.notifications")}
          desc={t("settings.notifications")}
          onClick={() => navigation.navigate('NotificationSettings')}
        />


        <MenuItem
          icon={<HelpCircle size={18} />}
          label={t("settings.helpCenter")}
          onClick={() => navigation.navigate('HelpCenter')}
        />

        <MenuItem
          icon={<Globe size={18} />}
          label={t("settings.language")}
          desc={t("settings.languageDesc")}
          onClick={() => navigation.navigate('Language')}
        />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={authLoading}
          activeOpacity={0.8}
        >
          <LogOut size={18} color="#ef4444" />
          <Text style={styles.logoutText}>{authLoading ? 'Logging out...' : t("settings.logout")}</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </ScrollView>
  );
};


const BackHeader: React.FC<{ title: string; onBack: () => void }> =
  ({ title, onBack }) => (
    <View style={styles.backHeader}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <ChevronLeft size={18} color="#666" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );

const IconBox: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <View style={styles.iconBox}>{children}</View>;

const StatBox: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <View style={styles.statBox}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuItem: React.FC<any> = ({
  icon,
  label,
  desc,
  onClick,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onClick}>
    <IconBox>{icon}</IconBox>

    <View style={{ flex: 1 }}>
      <Text style={styles.itemTitle}>{label}</Text>
      {desc && <Text style={styles.itemDesc}>{desc}</Text>}
    </View>

    <ChevronRight size={16} color="#ccc" />
  </TouchableOpacity>
);

const SettingsItem: React.FC<any> = ({
  icon,
  label,
  desc,
  danger,
  onClick,
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onClick}>
    <IconBox>{icon}</IconBox>

    <View style={{ flex: 1 }}>
      <Text
        style={[
          styles.itemTitle,
          danger && { color: "#ef4444" },
        ]}
      >
        {label}
      </Text>
      <Text style={styles.itemDesc}>{desc}</Text>
    </View>

    <ChevronRight size={16} color="#ccc" />
  </TouchableOpacity>
);


const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: "#b1dcf7",
},
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  header: {
    backgroundColor: "#b1dcf7",
    paddingBottom: 30,
    paddingTop: 50,
    width: "100%",
  },
  title: {
    color: "#0A9DED",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    textAlign: 'center',
  },
  profileContainer: {
    alignItems: "center",
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    borderColor: "#ecebeb",
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "700",
    marginRight: 8,
  },
  email: {
    color: "#090909",
    opacity: 0.9,
    marginTop: 4,
  },

  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#9c9999",
    marginBottom: 20,
  },

  cardTitle: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
  subtitle: {
    color: "#444444",
    textAlign: "center",
    marginBottom: 20,
  },

  primaryBtn: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },

  primaryText: { color: "#fff", fontWeight: "600" },

  card: {
    backgroundColor: "#fff",
    margin: 10,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#eceaea",
    alignItems: "center",
    justifyContent: "center",
  },

  itemTitle: { fontWeight: "600", fontSize: 14, color: "#0e0e0e", },
  itemDesc: { fontSize: 12, color: "#3c3b3b" },

  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    marginTop: 20,
    justifyContent: "center",
  },

  logoutText: { color: "#ef4444", fontWeight: "600" },

  backHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: { fontSize: 22, fontWeight: "700" },

  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    marginLeft: 6,
  },

  chipActive: { backgroundColor: "#FF6B00" },
  chipText: { fontSize: 12 },

  ambassadorCard: {
    backgroundColor: "#FF6B00",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },

  awardBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  ambassadorTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },

  ambassadorSub: { color: "rgba(255,255,255,0.8)" },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },

  statValue: { color: "#fff", fontWeight: "700", fontSize: 18 },
  statLabel: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  refBox: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    padding: 10,
  },

  copyBtn: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
  },

  sectionTitle: { fontWeight: "700", marginBottom: 10 },
});

export default ProfileScreen;
