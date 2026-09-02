import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageSourcePropType,
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
  MoreVertical,
} from "lucide-react-native";
import {
  getNotifications,
  NotificationItem,
  NotificationSource,
} from "../services/notificationsService";

const NAVY = "#b1dcf7";
const HEADER_TEXT = "#212625";
const SCREEN = "#fff";
const CARD = "#fff";
const TEXT = "#000";
const MUTED = "#414040";
const DIVIDER = "rgba(9, 8, 8, 0.27)";

const sourceImages: Partial<Record<NotificationSource, ImageSourcePropType>> = {
  ai: require("../assets/xderma-icon.png"),
  specialist: require("../assets/specialist.png"),
};

const NotificationMark = ({
  source,
  unread,
  compact,
}: {
  source: NotificationSource;
  unread?: boolean;
  compact: boolean;
}) => {
  const imageSource = sourceImages[source];

  return (
    <View
      style={[
        imageSource ? styles.imageIconBox : styles.iconBox,
        compact && styles.iconBoxCompact,
      ]}
    >
      {imageSource ? (
        <Image source={imageSource} style={styles.avatar} />
      ) : (
        <Bell size={compact ? 17 : 18} color={HEADER_TEXT} strokeWidth={2} />
      )}

      {unread && <View style={styles.iconUnreadDot} />}
    </View>
  );
};

const NotificationRow = ({
  item,
  index,
  compact,
}: {
  item: NotificationItem;
  index: number;
  compact: boolean;
}) => (
  <MotiView
    from={{ opacity: 0, translateY: 10 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{
      type: "timing",
      duration: 320,
      delay: index * 45,
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
      <NotificationMark
        source={item.source}
        unread={item.unread}
        compact={compact}
      />

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

        <Text numberOfLines={2} style={styles.notificationMessage}>
          {item.message}
        </Text>

        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>

      <ChevronRight size={16} color="#ccc" strokeWidth={2} />
    </Pressable>
  </MotiView>
);

export default function NotificationsScreen() {
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 360;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const nextNotifications = await getNotifications();
        if (isMounted) {
          setNotifications(nextNotifications);
        }
      } catch (error) {
        console.error("Failed to load notifications", error);
        if (isMounted) {
          setNotifications([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, NotificationItem[]> = {};

    notifications.forEach((notification) => {
      const bucket = notification.date || "Recent";
      if (!groups[bucket]) {
        groups[bucket] = [];
      }

      groups[bucket].push(notification);
    });

    return Object.entries(groups);
  }, [notifications]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={NAVY} />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleGroup}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.headerSubtitle}>
            Stay up to date with your skin health
          </Text>
        </View>

        <Pressable hitSlop={12} style={styles.headerAction}>
          <MoreVertical size={22} color={HEADER_TEXT} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.surface}>
        <View style={styles.card}>
          {loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#1E90FF" />
              <Text style={styles.loadingText}>Loading notifications…</Text>
            </View>
          ) : groupedNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={28} color="#8A9099" strokeWidth={1.8} />
              <Text style={styles.emptyStateTitle}>No notifications yet</Text>
              <Text style={styles.emptyStateText}>
                Your skin updates, AI chats, and specialist notes will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={groupedNotifications}
              keyExtractor={([date]) => date}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              renderItem={({ item: [date, items], index }) => (
                <View>
                  <Text
                    style={[
                      styles.dateText,
                      index > 0 && styles.dateTextSpacing,
                    ]}
                  >
                    {date}
                  </Text>

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
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: NAVY,
  },

  header: {
    height: 108,
    backgroundColor: NAVY,
    paddingHorizontal: 18,
    paddingTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    zIndex: 10,
  },

  headerLeft: {
    flex: 1,
    minWidth: 0,
  },

  titleGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    color: HEADER_TEXT,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },

  headerSubtitle: {
    color: HEADER_TEXT,
    opacity: 0.72,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },

  headerBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: "#1E90FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  headerBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  headerAction: {
    width: 36,
    height: 38,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  surface: {
    flex: 1,
    backgroundColor: SCREEN,
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    overflow: "hidden",
    paddingTop: 22,
    paddingBottom: 80,
  },

  card: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 20,
    marginHorizontal: 10,
    paddingHorizontal: 2,
  },

  listContent: {
    paddingTop: 8,
    paddingBottom: 10,
  },

  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    gap: 10,
  },

  loadingText: {
    color: MUTED,
    fontSize: 13,
    fontWeight: "600",
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
    gap: 10,
  },

  emptyStateTitle: {
    color: HEADER_TEXT,
    fontSize: 16,
    fontWeight: "700",
  },

  emptyStateText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },

  dateText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    paddingHorizontal: 12,
  },

  dateTextSpacing: {
    marginTop: 18,
  },

  notificationRow: {
    minHeight: 78,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  notificationRowCompact: {
    minHeight: 72,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },

  notificationPressed: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
  },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  imageIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },

  iconBoxCompact: {
    width: 38,
    height: 38,
    borderRadius: 11,
  },

  avatar: {
    width: "100%",
    height: "100%",
  },

  iconUnreadDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1E90FF",
    borderWidth: 1.5,
    borderColor: SCREEN,
  },

  notificationContent: {
    flex: 1,
    minWidth: 0,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
  },

  notificationTitle: {
    flexShrink: 1,
    color: TEXT,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
  },

  unreadTitle: {
    fontWeight: "700",
  },

  unreadIndicator: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#1E90FF",
    marginLeft: 6,
  },

  notificationMessage: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },

  notificationTime: {
    color: MUTED,
    opacity: 0.78,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: DIVIDER,
    marginLeft: 64,
    marginRight: 12,
  },

});
