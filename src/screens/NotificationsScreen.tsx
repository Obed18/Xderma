import React, { useMemo } from "react";
import {
  FlatList,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView } from "moti";
import {
  Bell,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileHeart,
  FlaskConical,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  ScanFace,
  Info,
} from "lucide-react-native";

type NotificationType =
  | "analysis"
  | "report"
  | "reminder"
  | "security"
  | "insight"
  | "doctor"
  | "system";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  date: "Today" | "Yesterday" | "Tuesday";
  type: NotificationType;
  unread?: boolean;
};

const notifications: NotificationItem[] = [
  {
    id: "1",
    title: "Skin analysis completed",
    message: "Your latest skin analysis is ready to review.",
    time: "Today at 9:12 AM",
    date: "Today",
    type: "analysis",
    unread: true,
  },
  {
    id: "2",
    title: "Your skin report is ready",
    message: "XDerma has generated your detailed screening report.",
    time: "Today at 8:45 AM",
    date: "Today",
    type: "report",
    unread: true,
  },
  {
    id: "3",
    title: "Analysis reminder",
    message: "It's been 30 days since your last skin check.",
    time: "Yesterday at 4:30 PM",
    date: "Yesterday",
    type: "reminder",
  },
  {
    id: "4",
    title: "New skin insight available",
    message: "We've identified a new insight from your recent scans.",
    time: "Yesterday at 11:20 AM",
    date: "Yesterday",
    type: "insight",
    unread: true,
  },
  {
    id: "5",
    title: "Your screening history was updated",
    message: "Your latest analysis has been added to your health history.",
    time: "Tuesday at 3:05 PM",
    date: "Tuesday",
    type: "report",
  },
  {
    id: "6",
    title: "Secure sign-in detected",
    message: "A new sign-in to your XDerma account was detected.",
    time: "Tuesday at 10:18 AM",
    date: "Tuesday",
    type: "security",
  },
  {
    id: "7",
    title: "Dermatology consultation reminder",
    message: "Your upcoming consultation is scheduled for tomorrow.",
    time: "Monday at 6:40 PM",
    date: "Tuesday",
    type: "doctor",
  },
];

const getIcon = (type: NotificationType) => {
  switch (type) {
    case "analysis":
      return ScanFace;

    case "report":
      return FileHeart;

    case "reminder":
      return Clock3;

    case "security":
      return ShieldCheck;

    case "insight":
      return Sparkles;

    case "doctor":
      return Stethoscope;

    case "system":
      return Info;

    default:
      return Bell;
  }
};

const getIconColor = (type: NotificationType) => {
  switch (type) {
    case "analysis":
      return "#8B9CFF";

    case "report":
      return "#62D6B2";

    case "reminder":
      return "#F6C85F";

    case "security":
      return "#6DD5FA";

    case "insight":
      return "#C084FC";

    case "doctor":
      return "#7DD3FC";

    default:
      return "#94A3B8";
  }
};

const getIconBackground = (type: NotificationType) => {
  switch (type) {
    case "analysis":
      return "rgba(139, 156, 255, 0.13)";

    case "report":
      return "rgba(98, 214, 178, 0.12)";

    case "reminder":
      return "rgba(246, 200, 95, 0.11)";

    case "security":
      return "rgba(109, 213, 250, 0.11)";

    case "insight":
      return "rgba(192, 132, 252, 0.12)";

    case "doctor":
      return "rgba(125, 211, 252, 0.11)";

    default:
      return "rgba(148, 163, 184, 0.10)";
  }
};

const NotificationRow = ({
  item,
  index,
  compact,
}: {
  item: NotificationItem;
  index: number;
  compact: boolean;
}) => {
  const Icon = getIcon(item.type);
  const iconColor = getIconColor(item.type);
  const iconBackground = getIconBackground(item.type);

  return (
    <MotiView
      from={{
        opacity: 0,
        translateY: 14,
      }}
      animate={{
        opacity: 1,
        translateY: 0,
      }}
      transition={{
        type: "timing",
        duration: 420,
        delay: index * 65,
      }}
    >
      <Pressable
        onPress={() => {
          // Navigate to the relevant notification destination here.
        }}
        style={({ pressed }) => [
          styles.notificationRow,
          compact && styles.notificationRowCompact,
          pressed && styles.notificationPressed,
        ]}
      >
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            compact && styles.iconContainerCompact,
            { backgroundColor: iconBackground },
          ]}
        >
          <Icon
            size={compact ? 18 : 20}
            color={iconColor}
            strokeWidth={2}
          />

          {item.unread && <View style={styles.iconUnreadDot} />}
        </View>

        {/* Content */}
        <View style={styles.notificationContent}>
          <View style={styles.titleRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.notificationTitle,
                item.unread && styles.unreadTitle,
              ]}
            >
              {item.title}
            </Text>

            {item.unread && <View style={styles.unreadIndicator} />}
          </View>

          <Text
            numberOfLines={2}
            style={styles.notificationMessage}
          >
            {item.message}
          </Text>

          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>

        {/* Chevron */}
        <ChevronRight
          size={17}
          color="rgba(255,255,255,0.22)"
          strokeWidth={2}
        />
      </Pressable>
    </MotiView>
  );
};

export default function NotificationsScreen() {
  const { width } = useWindowDimensions();

  const isSmallScreen = width < 360;
  const isTablet = width >= 600;

  const contentWidth = isTablet
    ? Math.min(width - 48, 680)
    : width - 32;

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};

    notifications.forEach((notification) => {
      if (!groups[notification.date]) {
        groups[notification.date] = [];
      }

      groups[notification.date].push(notification);
    });

    return Object.entries(groups);
  }, []);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  return (
    <View style={styles.screen}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#080B14"
      />

      {/* Ambient background glow */}
      <MotiView
        from={{
          opacity: 0.25,
          scale: 0.85,
        }}
        animate={{
          opacity: 0.42,
          scale: 1,
        }}
        transition={{
          type: "timing",
          duration: 1600,
        }}
        style={styles.backgroundGlow}
      />

      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.container,
            {
              width: contentWidth,
            },
          ]}
        >
          {/* Header */}
          <MotiView
            from={{
              opacity: 0,
              translateY: -12,
            }}
            animate={{
              opacity: 1,
              translateY: 0,
            }}
            transition={{
              type: "timing",
              duration: 450,
            }}
            style={styles.header}
          >
            <View>
              <Text
                style={[
                  styles.heading,
                  isSmallScreen && styles.headingSmall,
                ]}
              >
                Notifications
              </Text>

              <Text style={styles.subtitle}>
                Stay up to date with your skin health
              </Text>
            </View>

            <View style={styles.bellWrapper}>
              <Bell
                size={21}
                color="#D9DEFF"
                strokeWidth={2}
              />

              {unreadCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </MotiView>

          {/* Notification Card */}
          <MotiView
            from={{
              opacity: 0,
              translateY: 25,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              translateY: 0,
              scale: 1,
            }}
            transition={{
              type: "timing",
              duration: 550,
              delay: 120,
            }}
            style={styles.cardWrapper}
          >
            <View style={styles.notificationCard}>
              {/* subtle card highlight */}
              <View style={styles.cardHighlight} />

              <FlatList
                data={groupedNotifications}
                keyExtractor={([date]) => date}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                renderItem={({ item: [date, items], index }) => (
                  <View>
                    {/* Date heading */}
                    <View
                      style={[
                        styles.dateHeader,
                        index > 0 && styles.dateHeaderSpacing,
                      ]}
                    >
                      <View style={styles.dateLine} />

                      <Text style={styles.dateText}>
                        {date}
                      </Text>

                      <View style={styles.dateLine} />
                    </View>

                    {items.map((notification, notificationIndex) => (
                      <React.Fragment key={notification.id}>
                        <NotificationRow
                          item={notification}
                          index={index + notificationIndex}
                          compact={isSmallScreen}
                        />

                        {notificationIndex < items.length - 1 && (
                          <View style={styles.divider} />
                        )}
                      </React.Fragment>
                    ))}
                  </View>
                )}
              />
            </View>
          </MotiView>

          {/* Bottom trust indicator */}
          <MotiView
            from={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            transition={{
              delay: 900,
              duration: 500,
            }}
            style={styles.securityFooter}
          >
            <ShieldCheck
              size={14}
              color="#64748B"
              strokeWidth={2}
            />

            <Text style={styles.securityText}>
              Your XDerma notifications are private and secure
            </Text>
          </MotiView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#080B14",
  },

  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    alignSelf: "center",
    paddingTop: 10,
  },

  backgroundGlow: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: "#5967D9",
    opacity: 0.18,
    top: -190,
    right: -120,
    transform: [
      {
        rotate: "25deg",
      },
    ],
  },


  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 20,
  },

  heading: {
    color: "#F8FAFC",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    letterSpacing: -0.8,
  },

  headingSmall: {
    fontSize: 26,
    lineHeight: 32,
  },

  subtitle: {
    color: "#788298",
    fontSize: 13,
    marginTop: 5,
    letterSpacing: 0.1,
  },

  bellWrapper: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },

  headerBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: "#8B9CFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#080B14",
  },

  headerBadgeText: {
    color: "#080B14",
    fontSize: 9,
    fontWeight: "800",
  },


  cardWrapper: {
    flex: 1,
    minHeight: 0,
  },

  notificationCard: {
    flex: 1,
    overflow: "hidden",
    borderRadius: 25,
    backgroundColor: "#111622",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 10,
  },

  cardHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.13)",
  },

  listContent: {
    paddingTop: 9,
    paddingBottom: 10,
  },


  dateHeader: {
    height: 34,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  dateHeaderSpacing: {
    marginTop: 5,
  },

  dateText: {
    color: "#A8B0C0",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  dateLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.055)",
  },


  notificationRow: {
    minHeight: 78,
    paddingHorizontal: 17,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  notificationRowCompact: {
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },

  notificationPressed: {
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  iconContainer: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    position: "relative",
  },

  iconContainerCompact: {
    width: 39,
    height: 39,
    borderRadius: 13,
    marginRight: 10,
  },

  iconUnreadDot: {
    position: "absolute",
    top: 1,
    right: 1,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#8B9CFF",
    borderWidth: 1.5,
    borderColor: "#111622",
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 8,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  notificationTitle: {
    flexShrink: 1,
    color: "#D7DBE5",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },

  unreadTitle: {
    color: "#F5F7FA",
    fontWeight: "700",
  },

  unreadIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#8B9CFF",
    marginLeft: 6,
  },

  notificationMessage: {
    color: "#858EA1",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },

  notificationTime: {
    color: "#535D70",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.055)",
    marginLeft: 72,
    marginRight: 17,
  },

  securityFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
  },

  securityText: {
    color: "#535D70",
    fontSize: 10,
  },
});