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
  ShieldAlert,
  Stethoscope,
} from "lucide-react-native";
import ConfidenceCircle from "./ConfidenceCircle";
import ProgressBar from "./ProgressBar";
import SaveDetectionModal from "./SaveDetectionModal";
import { useNavigation } from "@react-navigation/native";
import { SkinPrediction } from "../services/skinAnalysisApi";

const { width } = Dimensions.get("window");

const CLASS_DESCRIPTIONS: Record<string, string> = {
  akiec: "A rough, scaly lesion pattern associated with sun exposure and pre-cancerous change.",
  bcc: "A common skin cancer pattern that usually grows slowly but should be medically reviewed.",
  bkl: "A benign keratosis pattern, often linked with non-cancerous skin growths.",
  df: "A dermatofibroma pattern, commonly a benign firm skin growth.",
  mel: "A melanoma-like pattern. Melanoma can be serious and needs prompt clinical review.",
  nv: "A melanocytic nevus pattern, commonly associated with ordinary moles.",
  vasc: "A vascular lesion pattern, including angiomas and related blood-vessel lesions.",
};

const getConfidencePercent = (prediction?: SkinPrediction) => {
  if (!prediction) return 0;
  return Math.round((prediction.confidence || 0) * 100);
};

const getRiskLevel = (prediction?: SkinPrediction) => {
  if (!prediction) return "Unavailable";
  if (prediction.risk_level) return prediction.risk_level;
  return prediction.is_malignant ? "High" : "Low";
};

const getRiskColor = (riskLevel: string) => {
  if (riskLevel.toLowerCase() === "high") return "#EF4444";
  if (riskLevel.toLowerCase() === "medium") return "#F59E0B";
  if (riskLevel.toLowerCase() === "low") return "#22C55E";
  return "#94A3B8";
};

const AnalysisCard = ({ route }: any) => {
  const [showGradCam, setShowGradCam] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<
    "SkinAnalysis" | "History" | null
  >(null);
  const navigation = useNavigation<any>();
  const selectedImage = route?.params?.image as string | undefined;
  const symptoms = route?.params?.symptoms?.trim();
  const prediction = route?.params?.prediction as SkinPrediction | undefined;
  const confidence = getConfidencePercent(prediction);
  const riskLevel = getRiskLevel(prediction);
  const riskColor = getRiskColor(riskLevel);
  const topProbabilities = prediction?.all_probabilities?.slice(0, 5) || [];
  const description = prediction
    ? CLASS_DESCRIPTIONS[prediction.predicted_class] ||
      "The AI model matched the image to this lesion class based on visual patterns learned from HAM10000."
    : "No prediction data was received. Please run a new analysis when the AI backend is available.";

  const promptBeforeLeaving = (destination: "SkinAnalysis" | "History") => {
    setPendingRoute(destination);
    setSaveModalVisible(true);
  };

  const continueToPendingRoute = () => {
    setSaveModalVisible(false);

    if (pendingRoute) {
      navigation.navigate(pendingRoute);
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
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={styles.modelCard}
        >
          <View style={styles.imageWrapper}>
            <Image
              source={selectedImage ? { uri: selectedImage } : require("../assets/sd1.webp")}
              style={styles.image}
            />
            {showGradCam && (
              <Image
                source={require("../assets/heatmap.png")}
                style={styles.heatmapOverlay}
              />
            )}
          </View>

          <View style={styles.modelInfo}>
            <View style={styles.row}>
              <Brain size={18} color="#00E0FF" />
              <Text style={styles.modelTitle}>HAM10000 AI Model</Text>
            </View>

            <Text style={styles.modelText}>Architecture: EfficientNet-B0</Text>
            <Text style={styles.modelText}>Classes: 7 lesion categories</Text>
            <Text style={styles.modelText}>
              Inference: {prediction ? `${prediction.inference_time_ms} ms` : "Unavailable"}
            </Text>
            <Text style={styles.modelText}>Use: Screening support, not diagnosis</Text>

            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => setShowGradCam(!showGradCam)}
            >
              <Eye size={16} color="#00E0FF" />
              <Text style={styles.toggleText}>
                {showGradCam ? "Show Original" : "Preview Heatmap"}
              </Text>
            </TouchableOpacity>
          </View>
        </MotiView>

        <MotiView
          from={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 200 }}
          style={styles.resultCard}
        >
          <ConfidenceCircle value={confidence} />

          <View style={styles.resultText}>
            <View style={[styles.riskPill, { borderColor: riskColor }]}>
              <ShieldAlert size={14} color={riskColor} />
              <Text style={[styles.risk, { color: riskColor }]}>{riskLevel} Risk</Text>
            </View>
            <Text style={styles.title}>
              {prediction?.full_name || "Analysis unavailable"}
            </Text>
            <Text style={styles.subtitle}>
              {prediction
                ? `Primary classification with ${prediction.confidence_pct} confidence`
                : "The AI response was not available for this result."}
            </Text>
          </View>
        </MotiView>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Probability Scores</Text>
          {topProbabilities.length > 0 ? (
            topProbabilities.map((item) => (
              <ProgressBar
                key={item.class_key}
                label={item.full_name}
                value={Math.round(item.probability * 1000) / 10}
              />
            ))
          ) : (
            <Text style={styles.detailText}>No probability scores were returned.</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Stethoscope size={18} color="#D8E5FF" />
            <Text style={styles.sectionTitleInline}>Clinical Summary</Text>
          </View>

          <Text style={styles.detailHeading}>Predicted condition</Text>
          <Text style={styles.detailText}>{description}</Text>

          <Text style={styles.detailHeading}>Recommended next step</Text>
          <Text style={styles.detailText}>
            {prediction?.recommendation ||
              prediction?.malignant_warning ||
              "Please run a new analysis or consult a qualified clinician if you are concerned about this lesion."}
          </Text>

          {symptoms ? (
            <View style={styles.symptomsSummary}>
              <Text style={styles.detailHeading}>Your notes</Text>
              <Text style={styles.detailText}>{symptoms}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.advisory}>
          <View style={styles.row}>
            <Info size={18} color="#00E0FF" />
            <Text style={styles.advisoryTitle}>Clinical Advisory</Text>
          </View>
          <Text style={styles.advisoryText}>
            XDerma provides AI screening support only. It is not a medical diagnosis and should not replace an in-person dermatology evaluation.
          </Text>
        </View>

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
    marginRight: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0F172A",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  heatmapOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 0.72,
  },
  modelInfo: {
    flex: 1,
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
    color: "#AEB8C7",
    fontSize: 12,
    marginTop: 2,
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
  resultText: {
    flex: 1,
  },
  riskPill: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  risk: {
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#AEB8C7",
    fontSize: 12,
    marginTop: 4,
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
  sectionTitleInline: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 6,
  },
  detailHeading: {
    color: "#D8E5FF",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
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
    backgroundColor: "#102235",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 224, 255, 0.22)",
  },
  advisoryTitle: {
    color: "#00E0FF",
    marginLeft: 6,
    fontWeight: "600",
  },
  advisoryText: {
    color: "#AEB8C7",
    marginTop: 8,
    lineHeight: 20,
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
    fontWeight: "600",
  },
});

export default AnalysisCard;
