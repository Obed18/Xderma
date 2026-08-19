import { supabase } from "../utils/supabase";

export type PersistedChatMessage = {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
};

export type PersistedConversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  messages: PersistedChatMessage[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const getSupabaseErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const supabaseError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };
    const parts = [
      supabaseError.message,
      supabaseError.details,
      supabaseError.hint,
      supabaseError.code ? `Code: ${supabaseError.code}` : undefined,
    ].filter(Boolean);

    if (parts.length > 0) return parts.join("\n");
  }

  return "The chat history could not be saved. Please try again.";
};

const getCurrentUserId = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return data.user?.id ?? null;
};

const toTimestamp = (timestamp: string, index: number) => {
  const parsed = Date.parse(timestamp);
  if (!Number.isNaN(parsed)) {
    return new Date(parsed).toISOString();
  }

  return new Date(Date.now() + index).toISOString();
};

export async function getAiChatConversations(): Promise<
  PersistedConversation[]
> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("ai_conversations")
    .select("id, title, created_at, updated_at, user_id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (conversationsError) {
    throw new Error(getSupabaseErrorMessage(conversationsError));
  }

  const conversationIds = (conversations ?? []).map(
    (conversation) => conversation.id
  );

  if (conversationIds.length === 0) {
    return [];
  }

  const { data: messages, error: messagesError } = await supabase
    .from("ai_messages")
    .select("id, conversation_id, sender, text, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: true });

  if (messagesError) {
    throw new Error(getSupabaseErrorMessage(messagesError));
  }

  return (conversations ?? []).map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    created_at: conversation.created_at,
    updated_at: conversation.updated_at,
    user_id: conversation.user_id,
    messages: (messages ?? [])
      .filter((message) => message.conversation_id === conversation.id)
      .map((message) => ({
        id: message.id,
        sender: message.sender,
        text: message.text,
        timestamp: message.created_at,
      })),
  })) as PersistedConversation[];
}

export async function saveAiChatConversation(
  conversation: PersistedConversation
): Promise<PersistedConversation | null> {
  const userId = await getCurrentUserId();

  if (!userId || conversation.messages.length === 0) {
    return null;
  }

  const now = new Date().toISOString();
  const conversationPayload = {
    title: conversation.title,
    user_id: userId,
    updated_at: now,
  };

  const conversationQuery = UUID_PATTERN.test(conversation.id)
    ? supabase
        .from("ai_conversations")
        .upsert(
          {
            id: conversation.id,
            created_at: conversation.created_at,
            ...conversationPayload,
          },
          { onConflict: "id" }
        )
        .select("id, title, created_at, updated_at, user_id")
        .single()
    : supabase
        .from("ai_conversations")
        .insert(conversationPayload)
        .select("id, title, created_at, updated_at, user_id")
        .single();

  const { data: savedConversation, error: conversationError } =
    await conversationQuery;

  if (conversationError) {
    throw new Error(getSupabaseErrorMessage(conversationError));
  }

  const conversationId = savedConversation.id;

  const { error: deleteError } = await supabase
    .from("ai_messages")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (deleteError) {
    throw new Error(getSupabaseErrorMessage(deleteError));
  }

  const { error: insertError } = await supabase.from("ai_messages").insert(
    conversation.messages.map((message, index) => ({
      conversation_id: conversationId,
      user_id: userId,
      sender: message.sender,
      text: message.text,
      created_at: toTimestamp(message.timestamp, index),
    }))
  );

  if (insertError) {
    throw new Error(getSupabaseErrorMessage(insertError));
  }

  return {
    id: savedConversation.id,
    title: savedConversation.title,
    created_at: savedConversation.created_at,
    updated_at: savedConversation.updated_at,
    user_id: savedConversation.user_id,
    messages: conversation.messages,
  };
}
