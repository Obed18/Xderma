import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View, Image,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import {
  ArrowUpRight,
  Bot,
  Check,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react-native";

type ChatType = "ai" | "specialist";

interface XDermaChatLandingProps {
  onSelectChat?: (type: ChatType) => void;
}

const BG = "#0A0D0C";
const SURFACE = "#111614";
const SURFACE_ELEVATED = "#1A1E1C";

const WHITE = "#F4F7F4";
const TEXT = "#E8ECE9";
const TEXT_SECONDARY = "#89938D";
const TEXT_TERTIARY = "#626C66";

// Single restrained accent - desaturated, sophisticated teal
const ACCENT = "#6B9B7E";
const VERIFICATION_BLUE = "#1DA1F2";

const BORDER = "#202723";
const BORDER_SUBTLE = "#1A1E1C";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);



const VerifiedBadge = ({
  active = false,
}: {
  active?: boolean;
}) => (
  <View
    style={[
      styles.verifiedBadge,
      active && styles.verifiedBadgeActive,
    ]}
  >
    <Check
      size={8}
      strokeWidth={4}
      color={active ? WHITE : TEXT_SECONDARY}
    />
  </View>
);
const Avatar = ({
  type,
  size = 48,
}: {
  type: ChatType;
  size?: number;
}) => {
  const isAI = type === "ai";

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: SURFACE_ELEVATED,
          overflow: "hidden",
        },
      ]}
    >
      <Image
        source={
          isAI
            ? require("../assets/xderma-icon.png")
            : require("../assets/specialist.png")
        }
        style={{
          width: size,
          height: size,
        }}
        resizeMode="cover"
      />

      <View
        style={[
          styles.onlineIndicator,
          {
            width: size * 0.21,
            height: size * 0.21,
            borderRadius: size * 0.105,
            borderColor: BG,
            backgroundColor: ACCENT,
          },
        ]}
      />
    </View>
  );
};

const ChatOption = ({
  type,
  onPress,
  index,
}: {
  type: ChatType;
  onPress: () => void;
  index: number;
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  const isAI = type === "ai";

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 550,
        delay: 250 + index * 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(translateY, {
        toValue: 0,
        delay: 250 + index * 100,
        damping: 16,
        stiffness: 120,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.975,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 5,
    }).start();
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.optionCard,
        isAI && {
          ...styles.optionCardActive,
          backgroundColor: SURFACE_ELEVATED,
          borderColor: BORDER,
        },
        !isAI && {
          borderColor: BORDER,
          backgroundColor: SURFACE,
        },
        {
          opacity,
          transform: [
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      <View style={styles.optionTop}>
        <Avatar type={type} size={48} />

        <View style={styles.optionIdentity}>
          <View style={styles.nameRow}>
            <Text style={styles.optionTitle}>
              {isAI
                ? "XDerma AI"
                : "XDerma Specialists"}
            </Text>

            <VerifiedBadge active={true} />
          </View>

          <Text style={styles.optionSubtitle}>
            {isAI
              ? "Instant AI-powered skin guidance"
              : "Connect with a verified skin specialist"}
          </Text>
        </View>

        <View
          style={[
            styles.arrowButton,
            isAI
              ? styles.arrowButtonActive
              : styles.arrowButtonSpecialist,
          ]}
        >
          <ArrowUpRight
            size={18}
            color={isAI ? ACCENT : TEXT_SECONDARY}
            strokeWidth={2.1}
          />
        </View>
      </View>

      <View style={styles.optionBottom}>
        <View style={styles.featureItem}>
          {isAI ? (
            <ShieldCheck
              size={13}
              color={TEXT_SECONDARY}
              strokeWidth={2}
            />
          ) : (
            <ShieldCheck
              size={13}
              color={TEXT_SECONDARY}
              strokeWidth={2}
            />
          )}

          <Text style={styles.featureText}>
            {isAI
              ? "Available anytime"
              : "Human expertise"}
          </Text>
        </View>

        <View style={styles.featureItem}>
          <MessageCircle
            size={13}
            color={TEXT_TERTIARY}
            strokeWidth={1.8}
          />

          <Text style={styles.featureText}>
            {isAI
              ? "Personalized guidance"
              : "Private consultation"}
          </Text>
        </View>
      </View>
    </AnimatedPressable>
  );
};


export default function XDermaChatLanding({
  onSelectChat,
}: XDermaChatLandingProps) {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();

  const heroOpacity = useRef(
    new Animated.Value(0)
  ).current;

  const heroY = useRef(
    new Animated.Value(20)
  ).current;

  const [activePreview, setActivePreview] =
    useState<ChatType>("ai");

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(heroY, {
        toValue: 0,
        damping: 18,
        stiffness: 110,
        useNativeDriver: true,
      }),
    ]).start();

    const interval = setInterval(() => {
      setActivePreview((current) =>
        current === "ai"
          ? "specialist"
          : "ai"
      );
    }, 4200);

    return () => clearInterval(interval);
  }, []);

  const handleSelect = (type: ChatType) => {
    onSelectChat?.(type);
    if (type === "ai") {
      navigation.navigate("AiChat" as never);
    } else {
      navigation.navigate("SpecialistChat" as never);
    }
  };

  const horizontalPadding =
    width < 360 ? 18 : width < 500 ? 22 : 28;

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={BG}
      />
        <Animated.View
          style={[
            styles.topHeader,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroY }],
            },
          ]}
        >
          <View style={styles.logoMark}>
      <Image
              source={require("../assets/xderma-icon.png")}
              style={styles.logoChat}
              resizeMode="contain"
              />
          </View>

          <View style={styles.privatePill}>
            <LockKeyhole
              size={11}
              color={TEXT_TERTIARY}
              strokeWidth={2}
            />

            <Text style={styles.privateText}>
              PRIVATE
            </Text>
          </View>
        </Animated.View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.container,
          {
            paddingHorizontal: horizontalPadding,
          },
        ]}
      >


        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroY }],
            },
          ]}
        >

          <Text
            style={[
              styles.heroTitle,
              width < 370 && styles.heroTitleSmall,
            ]}
          >
            Talk to the right{"\n"}
            <Text style={styles.heroAccent}>
              skin expert.
            </Text>
          </Text>

          <Text style={styles.heroDescription}>
            Get thoughtful guidance about your skin in a
            private space designed around you.
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.trustLine,
            {
              opacity: heroOpacity,
            },
          ]}
        >
          <ShieldCheck
            size={16}
            color={ACCENT}
            strokeWidth={1.9}
          />

          <Text style={styles.trustText}>
            Private conversations · Verified professionals
          </Text>
        </Animated.View>

        <View style={styles.choiceSection}>
          <View style={styles.choiceHeader}>
            <View>
              <Text style={styles.sectionTitle}>
                Who would you like to speak to?
              </Text>
            </View>

            <View style={styles.peopleIcon}>
              <UsersRound
                size={16}
                color={TEXT_SECONDARY}
                strokeWidth={1.7}
              />
            </View>
          </View>

          <ChatOption
            type="ai"
            index={0}
            onPress={() => handleSelect("ai")}
          />

          <ChatOption
            type="specialist"
            index={1}
            onPress={() =>
              handleSelect("specialist")
            }
          />
        </View>
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#b1dcf7",
  },

  container: {
    flexGrow: 1,
    paddingTop: 18,
    paddingBottom: 20,
    backgroundColor: BG,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
  },


  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 34,
    backgroundColor: "#b1dcf7",
    padding: 16,
    paddingTop: 60,
  },

  logoMark: {
    width: 31,
    height: 31,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: 60,
    height: 60,
  },
  logoChat:  {
    width: 34,
    height: 34,
  },


  privatePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 30,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },

  privateText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    color: TEXT_TERTIARY,
  },


  hero: {
    marginBottom: 22,
    marginTop: 20,
  },

  heroEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 11,
  },

  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },

  heroEyebrowText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: ACCENT,
  },

  heroTitle: {
    fontSize: 38,
    lineHeight: 41,
    letterSpacing: -1.7,
    fontWeight: "800",
    color: WHITE,
  },

  heroTitleSmall: {
    fontSize: 34,
    lineHeight: 37,
  },

  heroAccent: {
    color: WHITE,
  },

  heroDescription: {
    maxWidth: 450,
    marginTop: 13,
    fontSize: 14,
    lineHeight: 21,
    color: TEXT_SECONDARY,
    fontWeight: "400",
  },


  trustLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
    paddingLeft: 2,
  },

  trustText: {
    fontSize: 10.5,
    fontWeight: "600",
    color: TEXT_SECONDARY,
  },

  previewWrapper: {
    padding: 15,
    borderRadius: 23,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 32,
  },

  avatar: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  onlineIndicator: {
    position: "absolute",
    right: 0,
    bottom: 0,
    backgroundColor: ACCENT,
    borderWidth: 2,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  verifiedBadge: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: SURFACE_ELEVATED,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },

  verifiedBadgeActive: {
    backgroundColor: VERIFICATION_BLUE,
    borderColor: VERIFICATION_BLUE,
  },

  previewStatus: {
    fontSize: 9.5,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },

  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
  },

  livePillGreen: {
    backgroundColor: "#122419",
  },

  livePillPurple: {
    backgroundColor: "#1B1A2B",
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  liveText: {
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  previewMessages: {
    marginTop: 16,
    paddingLeft: 44,
    minHeight: 66,
  },

  messageBubble: {
    alignSelf: "flex-start",
    maxWidth: "90%",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    borderTopLeftRadius: 5,
  },

  aiBubble: {
    backgroundColor: "#18271D",
  },

  specialistBubble: {
    backgroundColor: "#1D1C2C",
  },

  messageText: {
    fontSize: 11.5,
    lineHeight: 17,
    color: "#C8D0CA",
    fontWeight: "500",
  },

  typingBubble: {
    alignSelf: "flex-start",
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    borderTopLeftRadius: 5,
  },

  aiTypingBubble: {
    backgroundColor: "#15221A",
  },

  specialistTypingBubble: {
    backgroundColor: "#1A1928",
  },

  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#738079",
  },

  choiceSection: {
    marginBottom: 20,
  },

  choiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
  },

  sectionKicker: {
    fontSize: 8.5,
    letterSpacing: 1.35,
    fontWeight: "800",
    color: TEXT_TERTIARY,
    marginBottom: 5,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: TEXT,
  },

  peopleIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER_SUBTLE,
  },

  optionCard: {
    position: "relative",
    padding: 16,
    borderRadius: 21,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 11,
  },

  optionCardActive: {
    backgroundColor: SURFACE_ELEVATED,
    borderColor: BORDER,
  },

  recommendedBadge: {
    position: "absolute",
    top: -9,
    right: 16,

    flexDirection: "row",
    alignItems: "center",
    gap: 4,

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 20,
    backgroundColor: ACCENT,
  },

  recommendedText: {
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: BG,
  },

  optionTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  optionIdentity: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  optionTitle: {
    fontSize: 13.5,
    fontWeight: "700",
    color: TEXT,
  },

  optionSubtitle: {
    fontSize: 10.5,
    lineHeight: 15,
    color: TEXT_SECONDARY,
    marginTop: 3,
  },

  arrowButton: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  arrowButtonActive: {
    backgroundColor: SURFACE_ELEVATED,
    borderWidth: 1,
    borderColor: BORDER,
  },

  arrowButtonSpecialist: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
  },

  optionBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#1C221F",
  },

  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginRight: 15,
  },

  featureText: {
    fontSize: 9,
    fontWeight: "600",
    color: TEXT_TERTIARY,
  },

  bottomTrust: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 3,
    marginTop: 2,
  },

  bottomTrustIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    marginRight: 9,
  },

  bottomTrustText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 15,
    color: TEXT_TERTIARY,
  },

  bottomSpacing: {
    height: 28,
  },
});