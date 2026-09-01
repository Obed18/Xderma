import React, { useRef, useState } from "react";
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
  Image,
  Dimensions,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useXderma } from "../context/AppContext";

const { width } = Dimensions.get("window");

type AccountVerificationRouteParams = {
  AccountVerification: {
    email: string;
    password: string;
  };
};

const AccountVerificationScreen: React.FC = () => {
  const { verifyAccount, resendAccountVerificationCode } = useXderma();
  const navigation = useNavigation<any>();
  const route =
    useRoute<RouteProp<AccountVerificationRouteParams, "AccountVerification">>();

  const submittedEmail = route.params?.email ?? "";
  const password = route.params?.password ?? "";

  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState<string | null>(
    "A 6-digit verification code has been sent to your email."
  );
  const [error, setError] = useState("");
  const codeInputRef = useRef<TextInput>(null);

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError("Enter the complete 6-digit code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(null);

    try {
      await verifyAccount(submittedEmail, verificationCode, password);
      setSuccess("Account verified successfully.");
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (err) {
      console.log(err);
      setError("Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResending(true);
    setError("");
    setSuccess(null);

    try {
      await resendAccountVerificationCode(submittedEmail);
      setVerificationCode("");
      setSuccess("A new 6-digit verification code has been sent to your email.");
    } catch (err) {
      console.log(err);
      setError("Failed to resend verification code. Try again.");
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(digitsOnly);

    if (error) {
      setError("");
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  const codeDigits = Array.from({ length: 6 }, (_, index) => {
    return verificationCode[index] ?? "";
  });

  const isSubmitting = loading || resending;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Verify Account</Text>
          <Text style={styles.headerSubtitle}>
            Enter the 6-digit code sent to your email
          </Text>
        </View>

        <View style={styles.formWrapper}>
          <View style={styles.formCard}>
            <View style={styles.field}>
              <Text style={styles.codeTitle}>Enter Verification Code</Text>
              <Text style={styles.codeDescription}>
                Enter the 6-digit code sent to {submittedEmail}
              </Text>

              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.codeRow}
                onPress={() => codeInputRef.current?.focus()}
              >
                {codeDigits.map((digit, index) => (
                  <View
                    key={index}
                    style={[
                      styles.codeBox,
                      verificationCode.length === index
                        ? styles.codeBoxActive
                        : null,
                      error ? styles.codeBoxError : null,
                    ]}
                  >
                    <Text style={styles.codeDigit}>{digit}</Text>
                  </View>
                ))}
              </TouchableOpacity>

              <TextInput
                ref={codeInputRef}
                value={verificationCode}
                onChangeText={handleCodeChange}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.hiddenCodeInput}
                autoFocus
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            {success ? <Text style={styles.successText}>{success}</Text> : null}

            {isSubmitting ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#0A9DED" />
                <Text style={styles.loadingText}>
                  {resending ? "Sending code..." : "Verifying account..."}
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleVerifyCode}
                >
                  <Text style={styles.submitText}>Verify Account</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleResendCode}
                >
                  <Text style={styles.secondaryButtonText}>Resend Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleBackToLogin}
                >
                  <Text style={styles.loginButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A9DED" },
  scrollContainer: { flexGrow: 1 },

  header: {
    backgroundColor: "#b1dcf7",
    paddingVertical: 90,
    paddingHorizontal: 30,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    justifyContent: "center",
  },

  logo: {
    width: width * 0.4,
    height: width * 0.4,
    maxWidth: 280,
    maxHeight: 280,
    margin: "auto",
  },

  headerTitle: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },

  headerSubtitle: {
    color: "#000000",
    opacity: 0.9,
    fontSize: 15,
    textAlign: "center",
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

  errorText: {
    color: "#ef4444",
    fontSize: 12,
    marginTop: 6,
  },

  successText: {
    color: "#16a34a",
    fontSize: 13,
    marginBottom: 12,
    textAlign: "center",
  },

  codeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },

  codeDescription: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 18,
  },

  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  codeBox: {
    width: 44,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },

  codeBoxActive: {
    borderColor: "#0A9DED",
    backgroundColor: "#EFF6FF",
  },

  codeBoxError: {
    borderColor: "#ef4444",
  },

  codeDigit: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },

  hiddenCodeInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
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
  },

  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#E5E7EB",
  },

  secondaryButtonText: {
    color: "#111827",
    fontWeight: "600",
    fontSize: 16,
  },

  loginButton: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },

  loginButtonText: {
    color: "#0A9DED",
    fontWeight: "600",
    fontSize: 15,
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
  },
});

export default AccountVerificationScreen;
