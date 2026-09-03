import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  ActivityIndicator,
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
  CheckCircle,
  Trash2,
  MessageCircle,
} from "lucide-react-native";
import ConfidenceCircle from "./ConfidenceCircle";
import ProgressBar from "./ProgressBar";
import SaveDetectionModal from "./SaveDetectionModal";
import { useNavigation } from "@react-navigation/native";
import { ClassProbability, SkinPrediction } from "../services/skinAnalysisApi";
import {
  AnalysisHistoryRow,
  deleteAnalysis,
  saveAnalysis,
} from "../services/historyService";

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

const CLASS_POSSIBLE_CONDITIONS: Record<string, string> = {
  akiec:
    "actinic keratosis or another sun-damage related lesion",
  bcc:
    "basal cell carcinoma or another slow-growing non-melanoma skin cancer",
  bkl:
    "benign keratosis, seborrheic keratosis, or another non-cancerous keratin growth",
  df:
    "dermatofibroma or another firm benign skin nodule",
  mel:
    "melanoma or another atypical pigmented lesion",
  nv:
    "melanocytic nevus, commonly called a mole",
  vasc:
    "vascular lesion such as angioma, angiokeratoma, or another blood-vessel related lesion",
};

const symptomIncludes = (symptoms: string, terms: string[]) =>
  terms.some((term) => symptoms.includes(term));

const buildPossibleConditionText = (
  prediction?: SkinPrediction,
  symptomNotes?: string
) => {
  if (!prediction) {
    return "A possible condition cannot be estimated because no AI classification was returned.";
  }

  const notes = symptomNotes?.toLowerCase() || "";
  const modelCondition =
    CLASS_POSSIBLE_CONDITIONS[prediction.predicted_class] || prediction.full_name;
  const symptomClues: string[] = [];
  const alternatives: string[] = [];

  if (notes) {
    if (
      symptomIncludes(notes, [
        "itch",
        "itchy",
        "itching",
        "scratch",
        "scaly",
        "scale",
        "flaky",
        "dry",
        "peel",
      ])
    ) {
      symptomClues.push("itching or scaling");
      alternatives.push("eczema, dermatitis, psoriasis, or a superficial fungal rash");
    }

    if (
      symptomIncludes(notes, [
        "ring",
        "circle",
        "circular",
        "round",
        "worm",
        "fungal",
        "spreading edge",
      ])
    ) {
      symptomClues.push("a ring-shaped or spreading border");
      alternatives.push("tinea corporis, commonly called ringworm");
    }

    if (
      symptomIncludes(notes, [
        "bleed",
        "bleeding",
        "blood",
        "crust",
        "crusting",
        "ulcer",
        "sore",
        "non healing",
        "non-healing",
      ])
    ) {
      symptomClues.push("bleeding, crusting, ulceration, or poor healing");
      alternatives.push("an irritated lesion or a skin cancer that needs prompt clinical review");
    }

    if (
      symptomIncludes(notes, [
        "pain",
        "painful",
        "tender",
        "burn",
        "burning",
        "swollen",
        "swelling",
        "pus",
        "warm",
      ])
    ) {
      symptomClues.push("pain, tenderness, swelling, warmth, or drainage");
      alternatives.push("inflammation or infection around the lesion");
    }

    if (
      symptomIncludes(notes, [
        "growing",
        "growth",
        "larger",
        "changing",
        "change",
        "dark",
        "black",
        "irregular",
        "asymmetric",
      ])
    ) {
      symptomClues.push("growth, color change, or irregular shape");
      alternatives.push("an atypical or malignant lesion requiring dermatologist assessment");
    }
  }

  const uniqueAlternatives = Array.from(new Set(alternatives));
  const uniqueClues = Array.from(new Set(symptomClues));

  if (!notes) {
    return `Based on the AI image classification, this could be ${modelCondition}. Add symptom notes such as itching, pain, bleeding, growth, or color change for a more contextual explanation.`;
  }

  if (uniqueAlternatives.length === 0) {
    return `Based on the AI image classification and your notes, this could be ${modelCondition}. The symptoms provided do not strongly point to a separate inflammatory, infectious, or fungal pattern, so a clinician should correlate this with an in-person skin exam.`;
  }

  return `Based on the AI image classification, this could be ${modelCondition}. Because you also described ${uniqueClues.join(
    ", "
  )}, dermatology knowledge suggests considering ${uniqueAlternatives.join(
    "; "
  )}. This is a screening interpretation, not a diagnosis.`;
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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "The analysis could not be saved. Please try again.";
};

const parsePercent = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace("%", "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatConfidencePct = (
  confidencePct?: number | string | null,
  confidence?: number | null
) => {
  const parsedPercent = parsePercent(confidencePct);

  if (parsedPercent !== null) {
    return `${Math.round(parsedPercent * 100) / 100}%`;
  }

  if (typeof confidence === "number") {
    return `${Math.round(confidence * 10000) / 100}%`;
  }

  return "0%";
};

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getHistoryProbabilities = (
  probabilities: AnalysisHistoryRow["probabilities"]
): ClassProbability[] => {
  if (!Array.isArray(probabilities)) return [];

  return probabilities.filter((item): item is ClassProbability => {
    if (!item || typeof item !== "object") return false;

    const probability = item as Partial<ClassProbability>;
    return (
      typeof probability.class_key === "string" &&
      typeof probability.full_name === "string" &&
      typeof probability.probability === "number"
    );
  });
};

const buildPredictionFromHistory = (
  item?: AnalysisHistoryRow
): SkinPrediction | undefined => {
  if (!item?.predicted_class || !item.full_name) return undefined;

  const confidence = toNumber(item.confidence);

  return {
    filename: "",
    predicted_class: item.predicted_class,
    full_name: item.full_name,
    confidence,
    confidence_pct: formatConfidencePct(item.confidence_pct, item.confidence),
    risk_level: item.risk_level ?? undefined,
    is_malignant: Boolean(item.is_malignant),
    malignant_warning: item.recommendation ?? "",
    recommendation: item.recommendation ?? undefined,
    all_probabilities: getHistoryProbabilities(item.probabilities),
    gradcam_data_url: item.gradcam_url ?? null,
    inference_time_ms: toNumber(item.inference_time_ms),
  };
};

const AnalysisCard = ({ route }: any) => {
  const [showGradCam, setShowGradCam] = useState(false);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<
    "SkinAnalysis" | "History" | null
  >(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigation = useNavigation<any>();
  const historyItem = route?.params?.historyItem as
    | AnalysisHistoryRow
    | undefined;
  const isHistoryView = route?.params?.source === "history" && historyItem;
  const selectedImage = (route?.params?.image ||
    historyItem?.image_url) as string | undefined;
  const symptoms = (route?.params?.symptoms ?? historyItem?.symptoms)?.trim();
  const prediction =
    (route?.params?.prediction as SkinPrediction | undefined) ??
    buildPredictionFromHistory(historyItem);
  const gradcamImage = prediction?.gradcam_data_url;
  const confidence = getConfidencePercent(prediction);
  const riskLevel = getRiskLevel(prediction);
  const riskColor = getRiskColor(riskLevel);
  const topProbabilities = prediction?.all_probabilities?.slice(0, 5) || [];
  const description = prediction
    ? historyItem?.description ||
      CLASS_DESCRIPTIONS[prediction.predicted_class] ||
      "The AI model matched the image to this lesion class based on visual patterns learned from HAM10000."
    : "No prediction data was received. Please run a new analysis when the AI backend is available.";
  const possibleCondition =
    historyItem?.possible_condition ||
    buildPossibleConditionText(prediction, symptoms);

  const promptBeforeLeaving = (destination: "SkinAnalysis" | "History") => {
    if (hasSaved) {
      navigation.navigate(destination);
      return;
    }

    setPendingRoute(destination);
    setSaveModalVisible(true);
  };

  const navigateToPendingRoute = () => {
    const destination = pendingRoute;

    setSaveModalVisible(false);
    setPendingRoute(null);

    if (destination) {
      navigation.navigate(destination);
    }
  };

  const saveToHistory = async (options?: { navigateAfterSave?: boolean }) => {
    if (!prediction) {
      Alert.alert(
        "Nothing to save",
        "Run a successful analysis before saving a result to history."
      );
      return;
    }

    if (isSaving) return;

    if (hasSaved) {
      if (options?.navigateAfterSave) {
        navigateToPendingRoute();
      }
      return;
    }

    try {
      setIsSaving(true);

      await saveAnalysis({
        image_url: selectedImage ?? null,
        predicted_class: prediction.predicted_class,
        full_name: prediction.full_name,
        confidence: prediction.confidence,
        confidence_pct: prediction.confidence_pct,
        risk_level: riskLevel,
        is_malignant: prediction.is_malignant,
        inference_time_ms: prediction.inference_time_ms,
        description,
        possible_condition: possibleCondition,
        recommendation:
          prediction.recommendation ?? prediction.malignant_warning,
        symptoms: symptoms || null,
        probabilities: prediction.all_probabilities,
        gradcam_url: prediction.gradcam_data_url ?? null,
      });

      setHasSaved(true);

      if (options?.navigateAfterSave) {
        navigateToPendingRoute();
        return;
      }

      Alert.alert(
        "Saved",
        "This analysis has been saved to your detection history.",
        [
          { text: "Stay", style: "cancel" },
          {
            text: "View History",
            onPress: () => navigation.navigate("History"),
          },
        ]
      );
    } catch (err) {
      console.log("Failed to save analysis history:", err);
      Alert.alert("Save failed", getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const closeSaveModal = () => {
    setSaveModalVisible(false);
    setPendingRoute(null);
  };

  const deleteFromHistory = async () => {
    if (!historyItem?.id || isDeleting) return;

    try {
      setIsDeleting(true);
      await deleteAnalysis(historyItem.id);
      Alert.alert("Deleted", "This analysis has been removed from history.", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.log("Failed to delete analysis history:", err);
      Alert.alert("Delete failed", getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDeleteFromHistory = () => {
    Alert.alert(
      "Delete from history?",
      "This saved analysis will be permanently removed from your history.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteFromHistory,
        },
      ]
    );
  };

  const buildConsultationPrompt = () => {
    const probabilities =
      topProbabilities.length > 0
        ? topProbabilities
            .map(
              (item) =>
                `- ${item.full_name}: ${Math.round(item.probability * 1000) / 10}%`
            )
            .join("\n")
        : "- No probability scores were saved.";

    return [
      "Please consult me on this saved XDerma skin analysis.",
      "",
      `Uploaded image URI: ${selectedImage || "No image saved"}`,
      `Predicted condition: ${prediction?.full_name || "Unavailable"}`,
      `Class key: ${prediction?.predicted_class || "Unavailable"}`,
      `Confidence: ${prediction?.confidence_pct || "Unavailable"}`,
      `Risk level: ${riskLevel}`,
      `Malignant flag: ${
        prediction?.is_malignant === undefined
          ? "Unavailable"
          : prediction.is_malignant
          ? "Yes"
          : "No"
      }`,
      `Inference time: ${
        prediction?.inference_time_ms
          ? `${prediction.inference_time_ms} ms`
          : "Unavailable"
      }`,
      "",
      "Clinical summary:",
      description,
      "",
      "Possible condition:",
      possibleCondition,
      "",
      "Recommendation:",
      prediction?.recommendation ||
        prediction?.malignant_warning ||
        "No recommendation was saved.",
      "",
      "My symptom notes:",
      symptoms || "No symptom notes were saved.",
      "",
      "Probability scores:",
      probabilities,
      "",
      "Please explain what this means, what symptoms I should monitor, and what safe next steps I should take. Do not diagnose me; guide me on whether I should see a dermatologist.",
    ].join("\n");
  };

  const consultXdermaAi = () => {
    navigation.navigate("AiChat", {
      consultation: {
        initialMessage: buildConsultationPrompt(),
        latestScan: {
          condition: prediction?.full_name,
          shortName: prediction?.predicted_class,
          confidence: prediction?.confidence_pct,
          priority: riskLevel,
        },
      },
    });
  };

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
          <View style={styles.imageWrapper}>
            <Image
              source={selectedImage ? { uri: selectedImage } : require("../assets/sd1.webp")}
              style={styles.image}
            />
            {showGradCam && gradcamImage ? (
              <Image
                source={{ uri: gradcamImage }}
                style={styles.heatmapOverlay}
              />
            ) : null}
          </View>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.mainHistory}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={styles.modelCard}
        >

          <View style={styles.modelInfo}>
            <View style={styles.row2}>
            <View style={styles.row}>
              <Brain size={18} color="#0A9DED" />
              <Text style={styles.modelTitle}>XDerma AI</Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleBtn, !gradcamImage && styles.toggleBtnDisabled]}
              disabled={!gradcamImage}
              onPress={() => setShowGradCam(!showGradCam)}
            >
              <Eye size={18} color={gradcamImage ? "#0A9DED" : "#3b4450"} />
              <Text style={[styles.toggleText, !gradcamImage && styles.toggleTextDisabled]}>
                {gradcamImage
                  ? showGradCam
                    ? "Show Original"
                    : "Show Heatmap"
                  : "Heatmap Unavailable"}
              </Text>
            </TouchableOpacity>
            </View>

            {/* <Text style={styles.modelText}>Architecture: EfficientNet-B0</Text>
            <Text style={styles.modelText}>Classes: 7 lesion categories</Text> */}
            <View style={styles.row2}>
            <Text style={styles.modelText}>
              Inference: {prediction ? `${prediction.inference_time_ms} ms` : "Unavailable"}
            </Text>
            <Text style={styles.modelText}>Use: Screening support, not diagnosis</Text>
            </View>

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
            <Stethoscope size={18} color="#0A9DED" />
            <Text style={styles.sectionTitleInline}>Clinical Summary</Text>
          </View>

          <Text style={styles.detailHeading}>Predicted condition</Text>
          <Text style={styles.detailText}>{description}</Text>

          <Text style={styles.detailHeading}>Possible condition</Text>
          <Text style={styles.detailText}>{possibleCondition}</Text>

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
            <Info size={18} color="#0A9DED" />
            <Text style={styles.advisoryTitle}>Clinical Advisory</Text>
          </View>
          <Text style={styles.advisoryText}>
            XDerma provides AI screening support only. It is not a medical diagnosis and should not replace an in-person dermatology evaluation.
          </Text>
        </View>

        {isHistoryView ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.deleteBtn, isDeleting && styles.secondaryBtnDisabled]}
              onPress={confirmDeleteFromHistory}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Trash2 size={18} color="#fff" />
              )}
              <Text style={styles.btnText}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.consultBtn}
              onPress={consultXdermaAi}
            >
              <MessageCircle size={18} color="#fff" />
              <Text style={styles.btnText}>Consult XDerma AI</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => promptBeforeLeaving("SkinAnalysis")}
            >
              <RotateCcw size={18} color="#fff" />
              <Text style={styles.btnText}>New Analysis</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryBtn,
                (!prediction || isSaving || hasSaved) && styles.secondaryBtnDisabled,
              ]}
              onPress={() => saveToHistory()}
              disabled={!prediction || isSaving || hasSaved}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : hasSaved ? (
                <CheckCircle size={18} color="#fff" />
              ) : (
                <FileText size={18} color="#fff" />
              )}
              <Text style={styles.btnText}>
                {isSaving ? "Saving..." : hasSaved ? "Saved" : "Save"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
      </ScrollView>

      <SaveDetectionModal
        visible={saveModalVisible}
        onClose={closeSaveModal}
        onSave={() => saveToHistory({ navigateAfterSave: true })}
        onDontSave={navigateToPendingRoute}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f7",
  },
  contentContainer: {
    paddingBottom: 0.1,
  },
    mainHistory: {
    flex: 1,
    paddingHorizontal: 16,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    backgroundColor: "#ffffff",
    paddingTop: 16,
    paddingBottom: 70,
    marginTop: -20,
    },
  modelCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
  },
  imageWrapper: {
    width: width * 1,
    height: width * 0.7,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  heatmapOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
    opacity: 1,
  },
  modelInfo: {
    flex: 1,
  },
  row2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modelTitle: {
    color: "#0A9DED",
    fontWeight: "600",
    marginLeft: 6,
  },
  modelText: {
    color: "#5f6061",
    fontSize: 12,
    marginTop: 2,
  },
  toggleBtn: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  toggleBtnDisabled: {
    opacity: 0.75,
  },
  toggleText: {
    color: "#0A9DED",
    marginLeft: 5,
    fontWeight: "600",
  },
  toggleTextDisabled: {
    color: "#414c5a",
  },
  resultCard: {
    flexDirection: "row",
    backgroundColor: "#0a9ded30",
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
    color: "#070707",
    fontSize: 18,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#42464d",
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#0A9DED",
    marginBottom: 10,
    fontWeight: "600",
    fontSize: 16,
  },
  sectionTitleInline: {
    color: "#0A9DED",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 6,
  },
  detailHeading: {
    color: "#0A9DED",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  detailText: {
    color: "#36393e",
    fontSize: 13,
    lineHeight: 20,
  },
  symptomsSummary: {
    marginTop: 8,
  },
  advisory: {
    backgroundColor: "#0a9ded3b",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 224, 255, 0.22)",
  },
  advisoryTitle: {
    color: "#0A9DED",
    marginLeft: 6,
    fontWeight: "600",
  },
  advisoryText: {
    color: "#090909",
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
    alignItems: "center",
    marginRight: 8,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#3B4252",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryBtnDisabled: {
    opacity: 0.65,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#DC2626",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  consultBtn: {
    flex: 1,
    backgroundColor: "#0A9DED",
    padding: 14,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "600",
  },
});

export default AnalysisCard;
