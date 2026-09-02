import { supabase } from "../utils/supabase";

export type NotificationSource = "ai" | "specialist" | "app";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  date: string;
  source: NotificationSource;
  unread?: boolean;
  created_at: string;
};

const getCurrentUserId = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
};

const getDateBucket = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recent";
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const dateStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const diffDays = Math.round(
    (todayStart.getTime() - dateStart.getTime()) / 86400000
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

const getDisplayTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatNotificationTime = (value: string) => {
  const bucket = getDateBucket(value);
  return `${bucket} at ${getDisplayTime(value)}`;
};

const isRecentNotification = (value?: string | null) => {
  if (!value) return false;

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= 7 * 24 * 60 * 60 * 1000;
};

type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  source: NotificationSource;
  unread?: boolean;
  created_at: string;
};

const sortByCreatedAtDesc = (a: NotificationRecord, b: NotificationRecord) =>
  new Date(b.created_at).getTime() - new Date(a.created_at).getTime();

export async function getNotifications(): Promise<NotificationItem[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const [historyResult, specialistResult, conversationResult] = await Promise.all([
    supabase
      .from("analysis_history")
      .select(
        "id, created_at, predicted_class, full_name, risk_level, possible_condition"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("specialist_consultation_messages")
      .select("id, created_at, direction, message")
      .eq("patient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("ai_conversations")
      .select("id, title, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  if (historyResult.error) {
    throw new Error(
      historyResult.error.message || "Unable to load skin analysis notifications."
    );
  }

  if (specialistResult.error) {
    throw new Error(
      specialistResult.error.message ||
        "Unable to load specialist consultation notifications."
    );
  }

  if (conversationResult.error) {
    throw new Error(
      conversationResult.error.message || "Unable to load AI notifications."
    );
  }

  const appNotifications = (historyResult.data ?? []).map((item) => {
    const createdAt = item.created_at ?? new Date().toISOString();
    const title = item.full_name || item.predicted_class || "Skin analysis complete";
    const message = item.possible_condition
      ? `Your latest scan indicates ${item.possible_condition}.`
      : "Your latest skin analysis is ready to review.";

    return {
      id: `analysis-${String(item.id)}`,
      title,
      message,
      source: "app" as const,
      unread: isRecentNotification(createdAt),
      created_at: createdAt,
    };
  });

  const specialistNotifications = (specialistResult.data ?? []).map((item) => {
    const createdAt = item.created_at ?? new Date().toISOString();
    const isPatientMessage = item.direction === "patient_to_specialist";

    return {
      id: `specialist-${String(item.id)}`,
      title: isPatientMessage
        ? "Consultation message sent"
        : "Specialist reply received",
      message: item.message || "New consultation activity is available.",
      source: "specialist" as const,
      unread: !isPatientMessage && isRecentNotification(createdAt),
      created_at: createdAt,
    };
  });

  const aiNotifications = (conversationResult.data ?? []).map((item) => {
    const createdAt = item.updated_at ?? item.created_at ?? new Date().toISOString();

    return {
      id: `ai-${String(item.id)}`,
      title: item.title || "AI chat updated",
      message: "Your latest AI conversation has new activity.",
      source: "ai" as const,
      unread: isRecentNotification(createdAt),
      created_at: createdAt,
    };
  });

  const baseNotifications: NotificationRecord[] = [
    ...appNotifications,
    ...specialistNotifications,
    ...aiNotifications,
  ].sort(sortByCreatedAtDesc);

  return baseNotifications.map((item) => ({
    ...item,
    date: getDateBucket(item.created_at),
    time: formatNotificationTime(item.created_at),
  }));
}
