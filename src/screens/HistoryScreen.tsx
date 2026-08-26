import React, { useCallback, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    ListRenderItem,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { AnalysisHistoryRow, getHistory } from "../services/historyService";

type Severity = "Mild" | "Moderate" | "Severe";

const getMostCommonCondition = (items: AnalysisHistoryRow[]) => {
    const counts = items.reduce<Record<string, number>>((acc, item) => {
        const condition = item.full_name || item.predicted_class;

        if (!condition) return acc;

        acc[condition] = (acc[condition] ?? 0) + 1;
        return acc;
    }, {});

    return (
        Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] ??
        "--"
    );
};

const getBadgeStyle = (severity: Severity): ViewStyle => ({
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor:
        severity === "Mild"
            ? "#22C55E"
            : severity === "Moderate"
            ? "#F59E0B"
            : "#EF4444",
});

const getSeverity = (riskLevel?: string | null): Severity => {
    const normalizedRisk = riskLevel?.toLowerCase();

    if (normalizedRisk === "high") return "Severe";
    if (normalizedRisk === "medium") return "Moderate";
    return "Mild";
};

const formatConfidence = (item: AnalysisHistoryRow) => {
    if (item.confidence_pct !== null && item.confidence_pct !== undefined) {
        const confidence = String(item.confidence_pct);
        return confidence.endsWith("%") ? confidence : `${confidence}%`;
    }

    if (typeof item.confidence === "number") {
        return `${Math.round(item.confidence * 100)}%`;
    }

    return "Unavailable";
};

const formatDate = (createdAt?: string | null) => {
    if (!createdAt) return "Date unavailable";

    return new Date(createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default function HistoryScreen() {
    const [activeFilter, setActiveFilter] = useState("All");
    const [history, setHistory] = useState<AnalysisHistoryRow[]>([]);

    const totalScans = history.length;
    const lastScan = history[0]?.created_at
        ? formatDate(history[0].created_at)
        : "--";
    const mostCommon = getMostCommonCondition(history);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const loadHistory = async () => {
        const result = await getHistory();
        setHistory(result);
    };

    const renderItem: ListRenderItem<AnalysisHistoryRow> = ({ item }) => {
        const severity = getSeverity(item.risk_level);
        const condition = item.full_name || item.predicted_class || "Unknown condition";
        const imageUrl = item.image_url ?? undefined;

        return (
            <TouchableOpacity style={styles.card}>
                {imageUrl ? (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                    />
                ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                        <Ionicons name="image-outline" size={24} color="#9CA3AF" />
                    </View>
                )}

                <View style={styles.cardContent}>
                    <Text style={styles.condition}>{condition}</Text>
                    <Text style={styles.confidence}>
                        Confidence: {formatConfidence(item)}
                    </Text>
                    <Text style={styles.date}>{formatDate(item.created_at)}</Text>
                </View>

                <View style={getBadgeStyle(severity)}>
                    <Text style={styles.badgeText}>{severity}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* HEADER */}
            <BlurView intensity={50} style={styles.header}>
                <View>
                    <Text style={styles.title}>Detection History</Text>
                </View>

                {/* <View style={styles.headerIcons}>
                <Ionicons name="search" size={22} color="#fff" />
                <Ionicons name="options-outline" size={22} color="#fff" />
            </View> */}
            </BlurView>

            <View style={styles.mainHistory}>
                {/* SUMMARY */}
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Overview</Text>

                    <View style={styles.summaryRow}>
                        <View>
                            <Text style={styles.summaryValue}>{totalScans}</Text>
                            <Text style={styles.summaryLabel}>Scans</Text>
                        </View>

                        <View>
                            <Text style={styles.summaryValue}>{mostCommon}</Text>
                            <Text style={styles.summaryLabel}>Most Common</Text>
                        </View>

                        <View>
                            <Text style={styles.summaryValue}>{lastScan}</Text>
                            <Text style={styles.summaryLabel}>Last Scan</Text>
                        </View>
                    </View>
                </View>

                {/* FILTERS */}
                <View style={styles.filters}>
                    {["All", "Acne", "Eczema", "Recent"].map((item) => (
                        <TouchableOpacity
                            key={item}
                            onPress={() => setActiveFilter(item)}
                            style={[
                                styles.filterBtn,
                                activeFilter === item && styles.activeFilter,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    activeFilter === item && { color: "#f8f4f4" },
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* LIST */}
                <FlatList
                    data={history}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 100 }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#b1dcf7",
    },

    header: {
        padding: 16,
        paddingTop: 60,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        backgroundColor: "#b1dcf7",
    },

    title: {
        color: "#000",
        fontSize: 22,
        fontWeight: "bold",
    },

    subtitle: {
        color: "#9CA3AF",
        fontSize: 13,
    },

    headerIcons: {
        flexDirection: "row",
        gap: 12,
    },

    mainHistory: {
        flex: 1,
        paddingHorizontal: 16,
        borderTopLeftRadius: 27,
        borderTopRightRadius: 27,
        backgroundColor: "#fff",
        paddingTop: 16,
    },

    summaryCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },

    summaryTitle: {
        color: "#2c2c2d",
        marginBottom: 10,
    },

    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    summaryValue: {
        color: "#0b0b0b",
        fontSize: 18,
        fontWeight: "bold",
    },

    summaryLabel: {
        color: "#363a41",
        fontSize: 12,
    },

    filters: {
        flexDirection: "row",
        marginBottom: 12,
    },

    filterBtn: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: "#e3e5e7",
        borderRadius: 20,
        marginRight: 8,
    },

    activeFilter: {
        backgroundColor: "#0A9DED",
    },

    filterText: {
        color: "#71767e",
    },

    card: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 10,
        marginBottom: 12,
        alignItems: "center",
    },

    image: {
        width: 60,
        height: 60,
        borderRadius: 12,
    },

    imagePlaceholder: {
        alignItems: "center",
        backgroundColor: "#fff",
        justifyContent: "center",
    },

    cardContent: {
        flex: 1,
        marginLeft: 12,
    },

    condition: {
        color: "#000",
        fontSize: 16,
        fontWeight: "600",
    },

    confidence: {
        color: "#494d53",
        fontSize: 12,
    },

    date: {
        color: "#35383f",
        fontSize: 11,
    },

    badgeText: {
        color: "#2b2a2a",
        fontSize: 10,
    },
});
