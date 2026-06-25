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
  ActivityIndicator, ImageBackground, Dimensions,
} from "react-native";
import { Mail, Lock } from "lucide-react-native";
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");



import { useXderma } from "../context/AppContext";

const LoginScreen: React.FC = () => {
  const { authLoading, login, signup, t } = useXderma();

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

  const isSubmitting = loading || authLoading;

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
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const email = formData.email.trim();

      if (isSignup) {
        await signup(email, formData.password);
      } else {
        await login(email, formData.password);
      }

      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";

      setErrors({ submit: message });
    } finally {
      setLoading(false);
    }
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
      <ImageBackground
        source={require("../assets/Background.png")}
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
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
                  placeholderTextColor="#7C8BA1"
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
                  placeholderTextColor="#7C8BA1"
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
            <TouchableOpacity style={styles.resetButton} onPress={handleForgot} >
                    <Text style={styles.resetLink}>
                      {t("auth.forgotPassword")}
                    </Text>
            </TouchableOpacity>
            </View>

            {/* Loader / Button */}
            {errors.submit && (
              <Text style={styles.submitError}>{errors.submit}</Text>
            )}

            {isSubmitting ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#009dff" />
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
                disabled={isSubmitting}
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
              disabled={isSubmitting}
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
      </ImageBackground>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1B2B" },
  scrollContainer: { flexGrow: 1 },
  backgroundImage: {
    flex: 1,
    width,
    height,
  },

  imageStyle: {
    opacity: 0.12,
    resizeMode: "cover",
  },

  header: {
    backgroundColor: "#7C8BA1",
    paddingVertical: 100,
    paddingHorizontal: 30,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },

  headerTitle: {
    color: "#e5edff",
    fontSize: 28,
    marginBottom: 6,
    fontFamily: 'Poppins_700Bold',
  },

  headerSubtitle: {
    color: "#dfe4f1",
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
    backgroundColor: "#1a344d",
    borderRadius: 24,
    padding: 20,
    elevation: 8,
    shadowColor: "#6e6d6d",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },

  field: { marginBottom: 16 },

  label: {
    fontSize: 13,
    color: "#a4acbb",
    marginBottom: 8,
    fontFamily: 'Poppins_400Regular',
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0B1B2B",
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },

  inputError: {
    borderWidth: 1,
    borderColor: "#c91010",
  },

  icon: { marginRight: 8 },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#ced3dd",
    fontFamily: 'Poppins_400Regular',
  },

  errorText: {
    color: "#c91717",
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'Poppins_400Regular',
  },

  submitError: {
    color: "#f87171",
    fontSize: 13,
    marginBottom: 10,
    textAlign: "center",
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

  resetButton:  {
    marginTop: 12,
    alignItems: "flex-end",
  },
  toggleButton: {
    marginTop: 12,
    alignItems: "center",
  },

  toggleText: {
    fontSize: 13,
    color: "#9ea4b0",
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
