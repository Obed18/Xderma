import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Mail, Lock, User } from "lucide-react-native";
import { useNavigation } from '@react-navigation/native';


import { useXderma } from "../context/AppContext";

const LoginScreen: React.FC = () => {
  const { t } = useXderma();

  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();
  

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setErrors({});
  }, [isSignup]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.email.trim()) {
      errs.email = t("auth.emailRequired");
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = t("auth.invalidEmail");
    }

    if (!formData.password.trim()) {
      errs.password = t("auth.passwordRequired");
    } else if (formData.password.length < 6) {
      errs.password = t("auth.passwordMin");
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
  navigation.navigate('Main');
  };

  const handleForgot = () => {
  navigation.navigate('Reset');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* ================= HEADER ================= */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isSignup ? t("auth.createAccount") : t("auth.welcomeBack")}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isSignup
              ? t("auth.joinMarketplace")
              : t("auth.loginContinue")}
          </Text>
        </View>

        {/* ================= FORM ================= */}
        <View style={styles.formWrapper}>
          <View style={styles.formCard}>
            {/* Email */}
            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.email")}</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.email && styles.inputError,
                ]}
              >
                <Mail size={20} color="#9CA3AF" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.emailPlaceholder")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                />
              </View>
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>{t("auth.password")}</Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.password && styles.inputError,
                ]}
              >
                <Lock size={20} color="#9CA3AF" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder={t("auth.passwordPlaceholder")}
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                />
              </View>
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            <TouchableOpacity style={styles.toggleButton} onPress={handleForgot} >
                    <Text style={styles.resetLink}>
                      {t("auth.forgotPassword")}
                    </Text>
            </TouchableOpacity>
            </View>

            {/* Loader / Button */}
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={styles.loadingText}>
                  {isSignup
                    ? t("auth.creatingAccount")
                    : t("auth.loggingIn")}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitText}>
                  {isSignup ? t("auth.signUp") : t("auth.login")}
                </Text>
              </TouchableOpacity>
            )}

            {/* Toggle */}
            <TouchableOpacity
              onPress={() => setIsSignup(!isSignup)}
              style={styles.toggleButton}
              disabled={loading}
            >
              <Text style={styles.toggleText}>
                {isSignup ? (
                  <>
                    {t("auth.alreadyHaveAccount")}{" "}
                    <Text style={styles.linkText}>
                      {t("auth.login")}
                    </Text>
                  </>
                ) : (
                  <>
                    {t("auth.doNotHaveAccount")}{" "}
                    <Text style={styles.linkText}>
                      {t("auth.signUp")}
                    </Text>
                  </>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { flexGrow: 1 },

  header: {
    backgroundColor: "#CDD9FF",
    paddingVertical: 100,
    paddingHorizontal: 30,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },

  headerTitle: {
    color: "#0F172A",
    fontSize: 28,
    marginBottom: 6,
    fontFamily: 'Poppins_700Bold',
  },

  headerSubtitle: {
    color: "#0F172A",
    opacity: 0.9,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },

  formWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    marginTop: -32,
  },

  formCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  field: { marginBottom: 16 },

  label: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  inputError: {
    borderWidth: 1,
    borderColor: "#05496e",
  },

  icon: { marginRight: 8 },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    fontFamily: 'Poppins_400Regular',
  },

  errorText: {
    color: "#05496e",
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'Poppins_400Regular',
  },

  submitButton: {
    backgroundColor: "#0A9DED",
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },

  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },

  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
  },

  loadingText: {
    marginLeft: 10,
    color: "#0A9DED",
    fontSize: 15,
    fontWeight: "500",
    fontFamily: 'Poppins_500Medium',
  },

  toggleButton: {
    marginTop: 12,
    alignItems: "center",
  },

  toggleText: {
    fontSize: 13,
    color: "#6B7280",
    fontFamily: 'Poppins_400Regular',
  },

  linkText: {
    color: "#0A9DED",
    fontWeight: "600",
  },
  resetLink: {
    color: "#0A9DED",
    fontSize: 13,
    textAlign: "right",
  }
});

export default LoginScreen;
