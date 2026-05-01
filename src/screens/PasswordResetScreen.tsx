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
} from "react-native";
import { Mail } from "lucide-react-native";
import { useXderma } from "../context/AppContext";

const PasswordResetScreen: React.FC = () => {
  const { resetPassword } = useXderma();

  const [email, setEmail] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [showCodeStep, setShowCodeStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const codeInputRef = useRef<TextInput>(null);

  const validate = (): boolean => {
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email");
      return false;
    }

    setError("");
    return true;
  };

  const handleReset = async () => {
    if (!validate()) return;

    setLoading(true);
    setSuccess(null);
    setError("");

    try {
      await resetPassword(email);
      const normalizedEmail = email.trim();

      setSubmittedEmail(normalizedEmail);
      setShowCodeStep(true);
      setResetCode("");
      setSuccess(
        "A 6-digit password reset code has been sent to your email."
      );
    } catch (err) {
      console.log(err);
      setError("Failed to send reset code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, "").slice(0, 6);
    setResetCode(digitsOnly);

    if (error) {
      setError("");
    }
  };

  const handleUseAnotherEmail = () => {
    setShowCodeStep(false);
    setResetCode("");
    setSuccess(null);
    setError("");
  };

  const codeDigits = Array.from({ length: 6 }, (_, index) => {
    return resetCode[index] ?? "";
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reset Password</Text>
          <Text style={styles.headerSubtitle}>
            {showCodeStep
              ? "Enter the 6-digit code sent to your email"
              : "Enter your email to receive a 6-digit reset code"}
          </Text>
        </View>

        <View style={styles.formWrapper}>
          <View style={styles.formCard}>
            {!showCodeStep ? (
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>

                <View
                  style={[
                    styles.inputContainer,
                    error && styles.inputError,
                  ]}
                >
                  <Mail size={20} color="#9CA3AF" style={styles.icon} />
                  <TextInput
                    style={styles.input}
                    placeholder="youremail@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
              </View>
            ) : (
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
                        resetCode.length === index &&
                          styles.codeBoxActive,
                        error && styles.codeBoxError,
                      ]}
                    >
                      <Text style={styles.codeDigit}>{digit}</Text>
                    </View>
                  ))}
                </TouchableOpacity>

                <TextInput
                  ref={codeInputRef}
                  value={resetCode}
                  onChangeText={handleCodeChange}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.hiddenCodeInput}
                  autoFocus
                />

                {error ? (
                  <Text style={styles.errorText}>{error}</Text>
                ) : null}
              </View>
            )}

            {success ? (
              <Text style={styles.successText}>{success}</Text>
            ) : null}

            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FF6B00" />
                <Text style={styles.loadingText}>Sending reset code...</Text>
              </View>
            ) : !showCodeStep ? (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleReset}
              >
                <Text style={styles.submitText}>Send Reset Code</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleUseAnotherEmail}
              >
                <Text style={styles.secondaryButtonText}>
                  Use Another Email
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: { flexGrow: 1 },

  header: {
    backgroundColor: "#bcccff",
    paddingVertical: 90,
    paddingHorizontal: 30,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
  },

  headerTitle: {
    color: "#0F172A",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 6,
  },

  headerSubtitle: {
    color: "#000000",
    opacity: 0.9,
    fontSize: 15,
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
    borderColor: "#ef4444",
  },

  icon: { marginRight: 8 },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },

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

  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 14,
  },

  loadingText: {
    marginLeft: 10,
    color: "#FF6B00",
    fontSize: 15,
    fontWeight: "500",
  },
});

export default PasswordResetScreen;
