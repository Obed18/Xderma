import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { AlertTriangle, Shield, X } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

type DisclaimerModalProps = {
  visible: boolean;
  onClose: () => void;
  onAgree?: () => void;
  onDecline?: () => void;
};

const disclaimerItems = [
  "I understand this system is NOT a medical diagnosis and should not be used as a substitute for professional medical evaluation.",
  "I will consult a qualified dermatologist for any skin concerns, regardless of the AI analysis results.",
  "I understand that uploaded images are processed for analysis only and are not permanently stored on the server.",
  "I acknowledge that AI models have inherent limitations, including potential biases across different skin tones and conditions.",
];

const DisclaimerModal: React.FC<DisclaimerModalProps> = ({
  visible,
  onClose,
  onAgree,
  onDecline,
}) => {
  const handleAgree = () => {
    onAgree?.();
    onClose();
  };

  const handleDecline = () => {
    onDecline?.();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.scrim} />

        <MotiView
          from={{ opacity: 0, translateY: 50, scale: 0.96 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: "timing", duration: 350 }}
          style={styles.container}
        >
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Shield color="#facc15" size={22} />
              </View>
              <Text style={styles.title}>Important Disclaimer</Text>
            </View>

            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color="#cbd5f5" size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.warningBox}>
            <AlertTriangle color="#facc15" size={20} />
            <Text style={styles.warningText}>
              XDERMA is an AI-assisted screening tool designed for educational and
              research purposes. It does not replace professional medical advice,
              diagnosis, or treatment.
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {disclaimerItems.map((item, index) => (
              <MotiView
                key={index}
                from={{ opacity: 0, translateX: 30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: index * 90 }}
                style={styles.card}
              >
                <Text style={styles.cardText}>{item}</Text>
              </MotiView>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handleDecline}>
              <Text style={styles.decline}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.agreeBtn} onPress={handleAgree}>
              <Text style={styles.agreeText}>Agree</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

export default DisclaimerModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 10, 20, 0.45)",
  },
  container: {
    width: width > 500 ? 450 : "92%",
    maxHeight: height * 0.78,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconBox: {
    backgroundColor: "#1e293b",
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
    fontFamily: 'Poppins_600SemiBold',
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#1e293b",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  warningText: {
    color: "#cbd5f5",
    fontSize: 13,
    flex: 1,
    lineHeight: 19,
    fontFamily: 'Poppins_400Regular',
  },
  scrollContent: {
    paddingBottom: 4,
  },
  card: {
    backgroundColor: "#1e293b",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardText: {
    color: "#e2e8f0",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins_400Regular',
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  decline: {
    color: "#94a3b8",
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  agreeBtn: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  agreeText: {
    color: "#fff",
    fontWeight: "600",
    fontFamily: 'Poppins_600SemiBold',
  },
});
