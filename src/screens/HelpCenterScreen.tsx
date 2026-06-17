import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Shield,
  Cpu,
  CreditCard,
  Settings,
  HelpCircle,
} from "lucide-react-native";

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const faqs = [
  {
    question: "Why is my scan inaccurate?",
    answer:
      "Ensure proper lighting and clear skin visibility for best AI accuracy.",
  },
  {
    question: "Does XDerma store my photos?",
    answer:
      "Your privacy is our priority. Images are processed securely and not stored without consent.",
  },
  {
    question: "How long does analysis take?",
    answer: "AI results are typically generated within a few seconds.",
  },
];

const categories = [
  { title: "Getting Started", icon: HelpCircle },
  { title: "AI & Detection", icon: Cpu },
  { title: "Privacy & Data", icon: Shield },
  { title: "Billing", icon: CreditCard },
  { title: "Troubleshooting", icon: Settings },
];

const HelpCenterScreen = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    LayoutAnimation.easeInEaseOut();
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.header}
      >
        <Text style={styles.title}>Help Center</Text>
        <Text style={styles.subtitle}>
          Everything you need to use XDerma effectively
        </Text>

        {/* SEARCH */}
        <View style={styles.searchBox}>
          <Search color="#aaa" size={18} />
          <TextInput
            placeholder="Search help..."
            placeholderTextColor="#aaa"
            style={styles.input}
          />
        </View>
      </MotiView>

      {/* QUICK HELP */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {["AI Scan", "Photo Tips", "Results", "Safety"].map((item, i) => (
          <MotiView
            key={i}
            from={{ opacity: 0, translateX: 30 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: i * 100 }}
          >
            <BlurView intensity={30} style={styles.quickCard}>
              <Text style={styles.cardText}>{item}</Text>
            </BlurView>
          </MotiView>
        ))}
      </ScrollView>

      {/* CATEGORIES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        {categories.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <TouchableOpacity key={i} style={styles.category}>
              <Icon color="#6C63FF" />
              <Text style={styles.categoryText}>{cat.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* FAQ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FAQs</Text>
        {faqs.map((faq, index) => (
          <TouchableOpacity
            key={index}
            style={styles.faq}
            onPress={() => toggleFAQ(index)}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQ}>{faq.question}</Text>
              {activeIndex === index ? (
                <ChevronUp color="#fff" />
              ) : (
                <ChevronDown color="#fff" />
              )}
            </View>
            {activeIndex === index && (
              <Text style={styles.faqA}>{faq.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default HelpCenterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
  subtitle: {
    color: "#aaa",
    marginTop: 5,
    marginBottom: 15,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    padding: 12,
    borderRadius: 12,
  },
  input: {
    marginLeft: 10,
    color: "#fff",
    flex: 1,
  },
  quickCard: {
    padding: 15,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cardText: {
    color: "#fff",
  },
  section: {
    marginTop: 25,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 10,
  },
  category: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryText: {
    color: "#fff",
    marginLeft: 10,
  },
  faq: {
    backgroundColor: "#1E293B",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  faqQ: {
    color: "#fff",
    fontWeight: "600",
  },
  faqA: {
    color: "#aaa",
    marginTop: 10,
  },
});