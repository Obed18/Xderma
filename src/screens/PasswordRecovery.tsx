import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { MotiView, AnimatePresence } from "moti";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Smartphone,
} from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type RecoveryStep = "email" | "code" | "password";

interface PasswordRecoveryProps {
  onComplete?: (password: string) => void;
  onBack?: () => void;
}

const COLORS = {
  background: "#080A0F",
  surface: "#10131A",
  surfaceElevated: "#151922",
  border: "#252A35",
  borderActive: "#F5C84B",
  text: "#F8FAFC",
  muted: "#8C93A1",
  mutedDark: "#5D6472",
  accent: "#F5C84B",
  accentStrong: "#FFD866",
  accentSoft: "rgba(245, 200, 75, 0.12)",
  success: "#58D68D",
  danger: "#FF6B6B",
};

const CODE_LENGTH = 4;

const screenTransition = {
  from: {
    opacity: 0,
    translateX: 35,
  },
  animate: {
    opacity: 1,
    translateX: 0,
  },
  exit: {
    opacity: 0,
    translateX: -35,
  },
};

export default function PasswordRecovery({
  onComplete,
  onBack,
}: PasswordRecoveryProps) {
  const { width, height } = useWindowDimensions();

  const isSmallScreen = width < 360;
  const isTablet = width >= 600;

  const [step, setStep] = useState<RecoveryStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const codeRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendTimer]);

  const isValidEmail = /\S+@\S+\.\S+/.test(email);

  const passwordRequirements = {
    length: password.length >= 8,
    number: /\d/.test(password),
  };

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  const codeComplete = code.every((digit) => digit.length === 1);

  const goToCode = () => {
    if (!isValidEmail) return;

    setStep("code");
    setResendTimer(30);

    setTimeout(() => {
      codeRefs.current[0]?.focus();
    }, 350);
  };

  const goToPassword = () => {
    if (!codeComplete) return;
    setStep("password");
  };

  const handleCodeChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const nextCode = [...code];
    nextCode[index] = digit;
    setCode(nextCode);

    if (digit && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (
    event: any,
    index: number
  ) => {
    if (
      event.nativeEvent.key === "Backspace" &&
      !code[index] &&
      index > 0
    ) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;

    setCode(["", "", "", ""]);
    setResendTimer(30);

    setTimeout(() => {
      codeRefs.current[0]?.focus();
    }, 100);
  };

  const handleResetPassword = () => {
    if (!passwordRequirements.length) return;
    if (!passwordRequirements.number) return;
    if (!passwordsMatch) return;

    onComplete?.(password);
  };

  const goBack = () => {
    if (step === "email") {
      onBack?.();
      return;
    }

    if (step === "code") {
      setStep("email");
      return;
    }

    setStep("code");
  };

  const getTitle = () => {
    switch (step) {
      case "email":
        return "Password recovery";
      case "code":
        return "Check your phone";
      case "password":
        return "Reset your password";
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case "email":
        return "Enter your email to recover your password";
      case "code":
        return "We've sent the code to your phone";
      case "password":
        return "Please enter your new password";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              minHeight: height,
              paddingHorizontal: isTablet ? width * 0.2 : 22,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Ambient glow */}
          <MotiView
            from={{
              opacity: 0,
              scale: 0.8,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            transition={{
              type: "timing",
              duration: 1200,
            }}
            style={styles.ambientGlow}
          />

          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={goBack}
              hitSlop={12}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeft
                size={20}
                color={COLORS.text}
                strokeWidth={2}
              />

              <Text style={styles.backText}>Go back</Text>
            </Pressable>

            <View style={styles.stepIndicator}>
              {[0, 1, 2].map((item) => {
                const active =
                  (step === "email" && item === 0) ||
                  (step === "code" && item === 1) ||
                  (step === "password" && item === 2);

                const completed =
                  (step === "code" && item === 0) ||
                  (step === "password" && item <= 1);

                return (
                  <React.Fragment key={item}>
                    <MotiView
                      animate={{
                        width: active || completed ? 28 : 8,
                        opacity: active || completed ? 1 : 0.35,
                      }}
                      transition={{
                        type: "timing",
                        duration: 300,
                      }}
                      style={[
                        styles.progressDot,
                        active && styles.progressDotActive,
                        completed && styles.progressDotCompleted,
                      ]}
                    />

                    {item < 2 && (
                      <View style={styles.progressLine} />
                    )}
                  </React.Fragment>
                );
              })}
            </View>
          </View>

          {/* Content */}
          <View
            style={[
              styles.content,
              {
                maxWidth: isTablet ? 520 : 460,
              },
            ]}
          >
            {/* Animated icon */}
            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={`icon-${step}`}
                from={{
                  opacity: 0,
                  scale: 0.75,
                  translateY: 15,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  translateY: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.85,
                  translateY: -10,
                }}
                transition={{
                  type: "spring",
                  damping: 16,
                  stiffness: 160,
                }}
                style={styles.iconContainer}
              >
                {step === "email" && (
                  <Mail
                    size={27}
                    color={COLORS.accent}
                    strokeWidth={1.8}
                  />
                )}

                {step === "code" && (
                  <Smartphone
                    size={27}
                    color={COLORS.accent}
                    strokeWidth={1.8}
                  />
                )}

                {step === "password" && (
                  <LockKeyhole
                    size={27}
                    color={COLORS.accent}
                    strokeWidth={1.8}
                  />
                )}
              </MotiView>
            </AnimatePresence>

            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={step}
                from={screenTransition.from}
                animate={screenTransition.animate}
                exit={screenTransition.exit}
                transition={{
                  type: "timing",
                  duration: 320,
                }}
                style={styles.formContainer}
              >
                <Text style={styles.title}>{getTitle()}</Text>

                <Text style={styles.subtitle}>
                  {getSubtitle()}
                </Text>

                {/* EMAIL */}
                {step === "email" && (
                  <View style={styles.form}>
                    <FieldLabel>Email address</FieldLabel>

                    <View
                      style={[
                        styles.inputContainer,
                        focusedField === "email" &&
                          styles.inputFocused,
                      ]}
                    >
                      <Mail
                        size={18}
                        color={
                          focusedField === "email"
                            ? COLORS.accent
                            : COLORS.muted
                        }
                      />

                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={COLORS.mutedDark}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        style={styles.input}
                      />

                      {isValidEmail && (
                        <MotiView
                          from={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={styles.validIcon}
                        >
                          <CheckCircle2
                            size={18}
                            color={COLORS.success}
                          />
                        </MotiView>
                      )}
                    </View>

                    <PrimaryButton
                      title="Recover password"
                      disabled={!isValidEmail}
                      onPress={goToCode}
                    />
                  </View>
                )}

                {/* CODE */}
                {step === "code" && (
                  <View style={styles.form}>
                    <View style={styles.codeContainer}>
                      {code.map((digit, index) => (
                        <MotiView
                          key={index}
                          animate={{
                            scale: digit ? 1.04 : 1,
                          }}
                          transition={{
                            type: "spring",
                            damping: 12,
                          }}
                          style={[
                            styles.codeInputWrapper,
                            digit && styles.codeInputFilled,
                          ]}
                        >
                          <TextInput
                            ref={(ref) => {
                              codeRefs.current[index] = ref;
                            }}
                            value={digit}
                            onChangeText={(value) =>
                              handleCodeChange(value, index)
                            }
                            onKeyPress={(event) =>
                              handleCodeKeyPress(event, index)
                            }
                            keyboardType="number-pad"
                            maxLength={1}
                            selectTextOnFocus
                            style={styles.codeInput}
                          />
                        </MotiView>
                      ))}
                    </View>

                    <View style={styles.expiryRow}>
                      <ShieldCheck
                        size={15}
                        color={COLORS.muted}
                      />

                      <Text style={styles.expiryText}>
                        Code expires in{" "}
                        <Text style={styles.expiryValue}>
                          03:{String(resendTimer || 12).padStart(2, "0")}
                        </Text>
                      </Text>
                    </View>

                    <PrimaryButton
                      title="Verify"
                      disabled={!codeComplete}
                      onPress={goToPassword}
                    />

                    <SecondaryButton
                      title={
                        resendTimer > 0
                          ? `Send again in ${resendTimer}s`
                          : "Send again"
                      }
                      disabled={resendTimer > 0}
                      onPress={handleResend}
                    />
                  </View>
                )}

                {/* PASSWORD */}
                {step === "password" && (
                  <View style={styles.form}>
                    <FieldLabel>New password</FieldLabel>

                    <PasswordInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter new password"
                      visible={showPassword}
                      onToggle={() =>
                        setShowPassword((value) => !value)
                      }
                      focused={focusedField === "password"}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                    />

                    <View style={styles.requirements}>
                      <Text style={styles.requirementTitle}>
                        Your password must contain:
                      </Text>

                      <Requirement
                        valid={passwordRequirements.length}
                        text="At least 8 characters"
                      />

                      <Requirement
                        valid={passwordRequirements.number}
                        text="Contains a number"
                      />
                    </View>

                    <FieldLabel>Confirm password</FieldLabel>

                    <PasswordInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Confirm new password"
                      visible={showConfirmPassword}
                      onToggle={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      focused={
                        focusedField === "confirmPassword"
                      }
                      onFocus={() =>
                        setFocusedField("confirmPassword")
                      }
                      onBlur={() => setFocusedField(null)}
                    />

                    {confirmPassword.length > 0 && (
                      <MotiView
                        from={{
                          opacity: 0,
                          translateY: -4,
                        }}
                        animate={{
                          opacity: 1,
                          translateY: 0,
                        }}
                      >
                        <Text
                          style={[
                            styles.matchText,
                            {
                              color: passwordsMatch
                                ? COLORS.success
                                : COLORS.danger,
                            },
                          ]}
                        >
                          {passwordsMatch
                            ? "Passwords match"
                            : "Passwords don't match"}
                        </Text>
                      </MotiView>
                    )}

                    <PrimaryButton
                      title="Done"
                      disabled={
                        !passwordRequirements.length ||
                        !passwordRequirements.number ||
                        !passwordsMatch
                      }
                      onPress={handleResetPassword}
                    />
                  </View>
                )}
              </MotiView>
            </AnimatePresence>
          </View>

          {/* Bottom trust message */}
          <MotiView
            from={{
              opacity: 0,
              translateY: 12,
            }}
            animate={{
              opacity: 1,
              translateY: 0,
            }}
            transition={{
              delay: 500,
              duration: 500,
            }}
            style={styles.securityMessage}
          >
            <LockKeyhole
              size={14}
              color={COLORS.muted}
            />

            <Text style={styles.securityText}>
              Your account security is our priority
            </Text>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------------------------------------------------------
   COMPONENTS
--------------------------------------------------------- */

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function Requirement({
  valid,
  text,
}: {
  valid: boolean;
  text: string;
}) {
  return (
    <View style={styles.requirementRow}>
      <View
        style={[
          styles.requirementIcon,
          valid && styles.requirementIconValid,
        ]}
      >
        {valid && (
          <Check
            size={10}
            color={COLORS.background}
            strokeWidth={3}
          />
        )}
      </View>

      <Text
        style={[
          styles.requirementText,
          valid && styles.requirementTextValid,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function PasswordInput({
  value,
  onChangeText,
  placeholder,
  visible,
  onToggle,
  focused,
  onFocus,
  onBlur,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  visible: boolean;
  onToggle: () => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}) {
  return (
    <View
      style={[
        styles.inputContainer,
        focused && styles.inputFocused,
      ]}
    >
      <LockKeyhole
        size={18}
        color={focused ? COLORS.accent : COLORS.muted}
      />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.mutedDark}
        secureTextEntry={!visible}
        autoCapitalize="none"
        onFocus={onFocus}
        onBlur={onBlur}
        style={styles.input}
      />

      <Pressable
        onPress={onToggle}
        hitSlop={10}
        style={styles.eyeButton}
      >
        {visible ? (
          <EyeOff size={18} color={COLORS.muted} />
        ) : (
          <Eye size={18} color={COLORS.muted} />
        )}
      </Pressable>
    </View>
  );
}

function PrimaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.primaryButtonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      {!disabled && (
        <MotiView
          from={{
            opacity: 0.4,
            scale: 0.8,
          }}
          animate={{
            opacity: 0,
            scale: 1.4,
          }}
          transition={{
            loop: true,
            duration: 1800,
          }}
          style={styles.buttonGlow}
        />
      )}

      <Text
        style={[
          styles.primaryButtonText,
          disabled && styles.disabledButtonText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function SecondaryButton({
  title,
  onPress,
  disabled,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.secondaryButton,
        disabled && styles.secondaryButtonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text
        style={[
          styles.secondaryButtonText,
          disabled && styles.secondaryButtonDisabledText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

/* ---------------------------------------------------------
   STYLES
--------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboard: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingTop: 12,
    paddingBottom: 30,
    position: "relative",
  },

  ambientGlow: {
    position: "absolute",
    top: -130,
    alignSelf: "center",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(245, 200, 75, 0.045)",
  },

  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },

  backButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  backText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "500",
  },

  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  progressDot: {
    height: 5,
    width: 8,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },

  progressDotActive: {
    backgroundColor: COLORS.accent,
  },

  progressDotCompleted: {
    backgroundColor: COLORS.accent,
  },

  progressLine: {
    width: 5,
    height: 1,
    backgroundColor: COLORS.border,
  },

  content: {
    width: "100%",
    flex: 1,
    alignSelf: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },

  iconContainer: {
    alignSelf: "center",
    width: 62,
    height: 62,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    backgroundColor: COLORS.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(245, 200, 75, 0.2)",
  },

  formContainer: {
    width: "100%",
  },

  title: {
    color: COLORS.text,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.6,
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 15,
  },

  form: {
    marginTop: 30,
  },

  fieldLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 9,
    letterSpacing: 0.1,
  },

  inputContainer: {
    minHeight: 55,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingHorizontal: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },

  inputFocused: {
    borderColor: COLORS.borderActive,
    backgroundColor: COLORS.surfaceElevated,
    shadowColor: COLORS.accent,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 2,
  },

  input: {
    flex: 1,
    minHeight: 53,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "500",
  },

  validIcon: {
    alignItems: "center",
    justifyContent: "center",
  },

  eyeButton: {
    padding: 5,
  },

  primaryButton: {
    height: 55,
    width: "100%",
    borderRadius: 17,
    marginTop: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: COLORS.accent,
  },

  primaryButtonDisabled: {
    backgroundColor: "#292A2D",
    borderWidth: 1,
    borderColor: "#303238",
  },

  primaryButtonText: {
    color: "#111318",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  disabledButtonText: {
    color: COLORS.mutedDark,
  },

  buttonGlow: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  secondaryButton: {
    height: 55,
    width: "100%",
    borderRadius: 17,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#373B44",
  },

  secondaryButtonDisabled: {
    opacity: 0.5,
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },

  secondaryButtonDisabledText: {
    color: COLORS.muted,
  },

  buttonPressed: {
    transform: [{ scale: 0.985 }],
  },

  codeContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: SCREEN_WIDTH < 360 ? 9 : 13,
  },

  codeInputWrapper: {
    width: SCREEN_WIDTH < 360 ? 57 : 66,
    height: SCREEN_WIDTH < 360 ? 60 : 68,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  codeInputFilled: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentSoft,
  },

  codeInput: {
    width: "100%",
    height: "100%",
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },

  expiryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 17,
    marginBottom: 3,
  },

  expiryText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  expiryValue: {
    color: COLORS.text,
    fontWeight: "600",
  },

  requirements: {
    padding: 14,
    marginTop: 11,
    marginBottom: 22,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  requirementTitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginBottom: 9,
  },

  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 8,
  },

  requirementIcon: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.mutedDark,
    alignItems: "center",
    justifyContent: "center",
  },

  requirementIconValid: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },

  requirementText: {
    color: COLORS.muted,
    fontSize: 11,
  },

  requirementTextValid: {
    color: COLORS.success,
  },

  matchText: {
    fontSize: 11,
    marginTop: 7,
    marginBottom: 3,
  },

  securityMessage: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  securityText: {
    color: COLORS.mutedDark,
    fontSize: 10,
    fontWeight: "500",
  },

  pressed: {
    opacity: 0.6,
  },
});