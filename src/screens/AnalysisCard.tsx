import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { MotiView } from "moti";
import {
  Brain,
  Eye,
  RotateCcw,
  FileText,
  Info,
} from "lucide-react-native";
import ConfidenceCircle from "./ConfidenceCircle";
import ProgressBar from "./ProgressBar";
import SaveDetectionModal from "./SaveDetectionModal";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

const AnalysisCard = ({ route }: any) => {
  const [showGradCam, setShowGradCam] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<
    "SkinAnalysis" | "History" | null
  >(null);
  const navigation = useNavigation();
  const selectedImage = route?.params?.image;
  const symptoms = route?.params?.symptoms?.trim();

  const promptBeforeLeaving = (destination: "SkinAnalysis" | "History") => {
    setPendingRoute(destination);
    setSaveModalVisible(true);
  };

  const continueToPendingRoute = () => {
    setSaveModalVisible(false);

    if (pendingRoute) {
      navigation.navigate(pendingRoute as never);
      setPendingRoute(null);
    }
  };

  const closeSaveModal = () => {
    setSaveModalVisible(false);
    setPendingRoute(null);
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
      {/* MODEL CARD */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500 }}
        style={styles.modelCard}
      >
        <View style={styles.imageWrapper}>
          <Image
            source={selectedImage || require("../assets/sd1.webp")}
            style={styles.image}
          />
          {showGradCam && (
            <Image
              source={require("../assets/heatmap.png")}
              style={styles.heatmapOverlay}
            />
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.row}>
            <Brain size={18} color="#00E0FF" />
            <Text style={styles.modelTitle}>Model Information</Text>
          </View>

          <Text style={styles.modelText}>
            Architecture: EfficientNet-B4 (Ensemble)
          </Text>
          <Text style={styles.modelText}>
            Dataset: HAM10000 + ISIC Archive
          </Text>
          <Text style={styles.modelText}>Accuracy: 87.3%</Text>
          <Text style={styles.modelText}>ROC-AUC: 0.934</Text>

          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setShowGradCam(!showGradCam)}
          >
            <Eye size={16} color="#00E0FF" />
            <Text style={styles.toggleText}>
              {showGradCam ? "Show Original" : "Grad-CAM Heatmap"}
            </Text>
          </TouchableOpacity>
        </View>
      </MotiView>

      {/* RESULT CARD */}
      <MotiView
        from={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 200 }}
        style={styles.resultCard}
      >
        <ConfidenceCircle value={86} />

        <View style={{ flex: 1 }}>
          <Text style={styles.risk}>⚠ Medium Risk</Text>
          <Text style={styles.title}>Actinic Keratosis</Text>
          <Text style={styles.subtitle}>
            Primary classification with 86.0% confidence
          </Text>
        </View>
      </MotiView>

      {/* DIFFERENTIAL */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Differential Diagnosis</Text>

        <ProgressBar label="Actinic Keratosis" value={86.9} />
        <ProgressBar label="Dermatofibroma" value={18.8} />
        <ProgressBar label="Squamous Cell Carcinoma" value={4.9} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What This Means</Text>
        <Text style={styles.detailHeading}>Clear description</Text>
        <Text style={styles.detailText}>
          The AI result suggests features that are most consistent with actinic
          keratosis, a rough or scaly lesion caused by long-term sun exposure.
          It is often considered pre-cancerous, which means it deserves prompt
          clinical review even when it is not immediately dangerous.
        </Text>

        <Text style={styles.detailHeading}>Possible next steps</Text>
        <Text style={styles.detailText}>
          A dermatologist may confirm the finding with a skin exam and decide
          whether monitoring, cryotherapy, topical treatment, or biopsy is the
          best next step. Avoid picking at the area, protect it from sun
          exposure, and arrange an appointment if the spot is growing, bleeding,
          painful, or changing quickly.
        </Text>

        <Text style={styles.detailHeading}>How critical it could be</Text>
        <Text style={styles.detailText}>
          This result fits a medium-risk category. It usually does not mean an
          emergency, but it should not be ignored because some lesions can
          progress into skin cancer if left untreated.
        </Text>

        {symptoms ? (
          <View style={styles.symptomsSummary}>
            <Text style={styles.detailHeading}>Your notes</Text>
            <Text style={styles.detailText}>{symptoms}</Text>
          </View>
        ) : null}
      </View>

      {/* CLINICAL ADVISORY */}
      <View style={styles.advisory}>
        <View style={styles.row}>
          <Info size={18} color="#00E0FF" />
          <Text style={styles.advisoryTitle}>Clinical Advisory</Text>
        </View>
        <Text style={styles.advisoryText}>
          Pre-cancerous lesion suspected. Dermatology follow-up recommended
          within 30 days.
        </Text>
      </View>

      {/* BUTTONS */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => promptBeforeLeaving("SkinAnalysis")}
        >
          <RotateCcw size={18} color="#fff" />
          <Text style={styles.btnText}>New Analysis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => promptBeforeLeaving("History")}
        >
          <FileText size={18} color="#fff" />
          <Text style={styles.btnText}>View History</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>

      <SaveDetectionModal
        visible={saveModalVisible}
        onClose={closeSaveModal}
        onSave={continueToPendingRoute}
        onDontSave={continueToPendingRoute}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },

  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  modelCard: {
    flexDirection: "row",
    backgroundColor: "#1B2433",
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
  },

  imageWrapper: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: 12,
    marginRight: 10,
    overflow: "hidden",
    position: "relative",
  },

  image: {
    width: "100%",
    height: "100%",
  },

  heatmapOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 0.9,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  modelTitle: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },

  modelText: {
    color: "#aaa",
    fontSize: 12,
  },

  toggleBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },

  toggleText: {
    color: "#00E0FF",
    marginLeft: 5,
  },

  resultCard: {
    flexDirection: "row",
    backgroundColor: "#1B2433",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },

  risk: {
    color: "#F59E0B",
    marginBottom: 4,
  },

  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#aaa",
    fontSize: 12,
  },

  section: {
    backgroundColor: "#1B2433",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },

  sectionTitle: {
    color: "#fff",
    marginBottom: 10,
    fontWeight: "600",
    fontSize: 16,
  },

  detailHeading: {
    color: "#D8E5FF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 6,
  },

  detailText: {
    color: "#AEB8C7",
    fontSize: 13,
    lineHeight: 20,
  },

  symptomsSummary: {
    marginTop: 8,
  },

  advisory: {
    backgroundColor: "#1B2433",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },

  advisoryTitle: {
    color: "#00E0FF",
    marginLeft: 6,
  },

  advisoryText: {
    color: "#aaa",
    marginTop: 6,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },

  primaryBtn: {
    flex: 1,
    backgroundColor: "#00AEEF",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    marginRight: 8,
  },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "#3B4252",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
  },

  btnText: {
    color: "#fff",
    marginLeft: 6,
  },
});

export default AnalysisCard;
