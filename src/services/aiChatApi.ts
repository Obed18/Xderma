export type AiChatHistoryMessage = {
  sender: "ai" | "user";
  text: string;
};

export type AiChatScanContext = {
  condition?: string;
  shortName?: string;
  confidence?: string;
  priority?: string;
};

export type AiChatRequest = {
  message: string;
  conversationId?: string;
  messages?: AiChatHistoryMessage[];
  latestScan?: AiChatScanContext;
};

export type AiChatResponse = {
  message: string;
  model: string;
  provider: string;
  conversation_id?: string | null;
};

export class AiChatApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AiChatApiError";
    this.status = status;
  }
}

const DEFAULT_API_URL = "http://127.0.0.1:8000";
const API_URL = (
  process.env.EXPO_PUBLIC_XDERMA_AI_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");
const API_KEY = process.env.EXPO_PUBLIC_XDERMA_AI_API_KEY;
const DEFAULT_TIMEOUT_MS = 45000;

const requestWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = DEFAULT_TIMEOUT_MS
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      throw new AiChatApiError(
        "XDerma AI took too long to respond. Please try again."
      );
    }

    throw new AiChatApiError(
      "Could not connect to XDerma AI. Make sure the backend is running and reachable from this device."
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export const sendAiChatMessage = async ({
  message,
  conversationId,
  messages = [],
  latestScan,
}: AiChatRequest): Promise<AiChatResponse> => {
  const response = await requestWithTimeout(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(API_KEY ? { "X-API-Key": API_KEY } : {}),
    },
    body: JSON.stringify({
      message,
      conversation_id: conversationId,
      messages,
      latest_scan: latestScan,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : "XDerma AI could not answer right now.";

    throw new AiChatApiError(detail, response.status);
  }

  return payload as AiChatResponse;
};

export const aiChatApiConfig = {
  apiUrl: API_URL,
  timeoutMs: DEFAULT_TIMEOUT_MS,
  hasApiKey: Boolean(API_KEY),
};
