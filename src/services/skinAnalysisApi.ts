export type ClassProbability = {
  class_key: string;
  full_name: string;
  probability: number;
  percentage: string;
};

export type SkinPrediction = {
  filename: string;
  predicted_class: string;
  full_name: string;
  confidence: number;
  confidence_pct: string;
  risk_level?: "Low" | "Medium" | "High" | string;
  is_malignant: boolean;
  malignant_warning: string;
  recommendation?: string;
  all_probabilities: ClassProbability[];
  inference_time_ms: number;
};

export type UploadableImage = {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
};

export class SkinAnalysisApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SkinAnalysisApiError";
    this.status = status;
  }
}

const DEFAULT_API_URL = "http://127.0.0.1:8000";
const API_URL = (
  process.env.EXPO_PUBLIC_XDERMA_AI_API_URL || DEFAULT_API_URL
).replace(/\/$/, "");
const DEFAULT_TIMEOUT_MS = 45000;

const getFileExtension = (uri: string) => {
  const cleanUri = uri.split("?")[0] || uri;
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() || "jpg";
};

const getMimeType = (image: UploadableImage) => {
  if (image.mimeType) {
    return image.mimeType;
  }

  const extension = getFileExtension(image.uri);

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "bmp") {
    return "image/bmp";
  }

  return "image/jpeg";
};

const getFileName = (image: UploadableImage) => {
  if (image.fileName) {
    return image.fileName;
  }

  return `xderma-upload.${getFileExtension(image.uri)}`;
};

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
      throw new SkinAnalysisApiError(
        "The AI analysis timed out. Please check the backend connection and try again."
      );
    }

    throw new SkinAnalysisApiError(
      "Could not connect to the AI analysis server. Make sure the backend is running and reachable from this device."
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export const analyzeSkinImage = async (
  image: UploadableImage,
  timeoutMs?: number
): Promise<SkinPrediction> => {
  const formData = new FormData();
  const file = {
    uri: image.uri,
    name: getFileName(image),
    type: getMimeType(image),
  } as any;

  formData.append("file", file);

  const response = await requestWithTimeout(
    `${API_URL}/predict`,
    {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    },
    timeoutMs
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      typeof payload?.detail === "string"
        ? payload.detail
        : "The AI server could not process this image.";

    throw new SkinAnalysisApiError(detail, response.status);
  }

  return payload as SkinPrediction;
};

export const skinAnalysisApiConfig = {
  apiUrl: API_URL,
  timeoutMs: DEFAULT_TIMEOUT_MS,
};
