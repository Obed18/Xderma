import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    ImageSourcePropType,
    ListRenderItem,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

type Severity = "Mild" | "Moderate" | "Severe";

type HistoryItem = {
    id: string;
    image: ImageSourcePropType;
    condition: string;
    confidence: string;
    date: string;
    severity: Severity;
};

const data: HistoryItem[] = [
    {
        id: "1",
        image: require("../assets/sd1.webp"),
        condition: "Acne",
        confidence: "92%",
        date: "Apr 28, 2026",
        severity: "Mild",
    },
    {
        id: "2",
        image: require("../assets/sd2.webp"),
        condition: "Eczema",
        confidence: "87%",
        date: "Apr 25, 2026",
        severity: "Moderate",
    },
    {
        id: "3",
        image: require("../assets/sd3.jpg"),
        condition: "Eczema",
        confidence: "81%",
        date: "Apr 13, 2026",
        severity: "Moderate",
    },
];

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

export default function HistoryScreen() {
    const [activeFilter, setActiveFilter] = useState("All");

    const renderItem: ListRenderItem<HistoryItem> = ({ item }) => (
        <TouchableOpacity style={styles.card}>
        <Image source={item.image} style={styles.image} />

        <View style={styles.cardContent}>
            <Text style={styles.condition}>{item.condition}</Text>

            <Text style={styles.confidence}>
            Confidence: {item.confidence}
            </Text>

            <Text style={styles.date}>{item.date}</Text>
        </View>

        <View style={getBadgeStyle(item.severity)}>
            <Text style={styles.badgeText}>{item.severity}</Text>
        </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
        {/* HEADER */}
        <BlurView intensity={50} style={styles.header}>
            <View>
            <Text style={styles.title}>Detection History</Text>
            <Text style={styles.subtitle}>
                Track your skin insights
            </Text>
            </View>

            <View style={styles.headerIcons}>
                <Ionicons name="search" size={22} color="#fff" />
                <Ionicons name="options-outline" size={22} color="#fff" />
            </View>
        </BlurView>
        <View style={styles.mainHistory}>
        {/* SUMMARY */}
        <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Overview</Text>

            <View style={styles.summaryRow}>
            <View>
                <Text style={styles.summaryValue}>24</Text>
                <Text style={styles.summaryLabel}>Scans</Text>
            </View>

            <View>
                <Text style={styles.summaryValue}>Acne</Text>
                <Text style={styles.summaryLabel}>Most Common</Text>
            </View>

            <View>
                <Text style={styles.summaryValue}>Apr 28</Text>
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
                    activeFilter === item && { color: "#000" },
                ]}
                >
                {item}
                </Text>
            </TouchableOpacity>
            ))}
        </View>

        {/* LIST */}
        <FlatList
            data={data}
            keyExtractor={(item) => item.id}
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
        backgroundColor: "#0F172A",
        borderTopRightRadius: 24,
        borderTopLeftRadius: 24,
        marginBottom: 30,
    },

    header: {
        padding: 16,
        paddingTop: 60,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
        borderTopRightRadius: 24,
        borderTopLeftRadius: 24,
    },

    title: {
        color: "#fff",
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
    },

    summaryCard: {
        backgroundColor: "#111827",
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        borderColor: "#5b8bf3",
        borderWidth: 1,
    },

    summaryTitle: {
        color: "#9CA3AF",
        marginBottom: 10,
    },

    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    summaryValue: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },

    summaryLabel: {
        color: "#6B7280",
        fontSize: 12,
    },

    filters: {
        flexDirection: "row",
        marginBottom: 12,
    },

    filterBtn: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        backgroundColor: "#1F2937",
        borderRadius: 20,
        marginRight: 8,
    },

    activeFilter: {
        backgroundColor: "#0A9DED",
    },

    filterText: {
        color: "#9CA3AF",
    },

    card: {
        flexDirection: "row",
        backgroundColor: "#1e2432",
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

    cardContent: {
        flex: 1,
        marginLeft: 12,
    },

    condition: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },

    confidence: {
        color: "#9CA3AF",
        fontSize: 12,
    },

    date: {
        color: "#6B7280",
        fontSize: 11,
    },

    badgeText: {
        color: "#fff",
        fontSize: 10,
    },
});
