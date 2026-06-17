import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Database, X } from "lucide-react-native";

const { width } = Dimensions.get("window");

type SaveDetectionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
  onDontSave?: () => void;
};

const SaveDetectionModal: React.FC<SaveDetectionModalProps> = ({
  visible,
  onClose,
  onSave,
  onDontSave,
}) => {
  const handleSave = () => {
    onSave?.();
    onClose();
  };

  const handleDontSave = () => {
    onDontSave?.();
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
          from={{ opacity: 0, translateY: 40, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: "timing", duration: 300 }}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBox}>
              <Database color="#22c55e" size={22} />
            </View>

            <TouchableOpacity onPress={onClose}>
              <X color="#cbd5f5" size={20} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <Text style={styles.title}>
            Save Detection to History?
          </Text>

          <Text style={styles.description}>
            Would you like to store this skin analysis result in your history for future reference?
          </Text>

          {/* Actions */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.dontSaveBtn}
              onPress={handleDontSave}
            >
              <Text style={styles.dontSaveText}>Don't Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    </Modal>
  );
};

export default SaveDetectionModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 10, 20, 0.5)",
  },
  container: {
    width: width > 500 ? 420 : "92%",
    backgroundColor: "rgba(15, 23, 42, 0.97)",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  iconBox: {
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    fontFamily: "Poppins_600SemiBold",
  },
  description: {
    color: "#cbd5f5",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
    fontFamily: "Poppins_400Regular",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dontSaveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#334155",
    marginRight: 10,
    alignItems: "center",
  },
  dontSaveText: {
    color: "#94a3b8",
    fontSize: 14,
    fontFamily: "Poppins_500Medium",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Poppins_600SemiBold",
  },
});
