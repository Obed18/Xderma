import { supabase } from "../utils/supabase";

export type AnalysisHistoryRow = {
    id: string | number;
    created_at?: string | null;
    image_url?: string | null;
    predicted_class?: string | null;
    full_name?: string | null;
    confidence?: number | null;
    confidence_pct?: number | string | null;
    risk_level?: string | null;
    is_malignant?: boolean | null;
    inference_time_ms?: number | null;
    description?: string | null;
    possible_condition?: string | null;
    recommendation?: string | null;
    symptoms?: string | null;
    probabilities?: unknown;
    gradcam_url?: string | null;
};

export type SaveAnalysisInput = Omit<
    Partial<AnalysisHistoryRow>,
    "id" | "created_at"
> & {
    predicted_class: string;
    full_name: string;
};

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

    return "The analysis could not be saved. Please try again.";
};

export async function saveAnalysis(data: SaveAnalysisInput) {
    const {
        data: userData
    } = await supabase.auth.getUser();

    const user = userData.user;

    if (!user) throw new Error("User not logged in");

    const { error } = await supabase
        .from("analysis_history")
        .insert({
            user_id: user.id,
            image_url: data.image_url ?? null,
            predicted_class: data.predicted_class,
            full_name: data.full_name,
            confidence: data.confidence ?? null,
            confidence_pct: data.confidence_pct ?? null,
            risk_level: data.risk_level ?? null,
            is_malignant: data.is_malignant ?? null,
            inference_time_ms: data.inference_time_ms ?? null,
            description: data.description ?? null,
            possible_condition: data.possible_condition ?? null,
            recommendation: data.recommendation ?? null,
            symptoms: data.symptoms ?? null,
            probabilities: data.probabilities ?? null,
            gradcam_url: data.gradcam_url ?? null,
        });

    if (error) throw new Error(getSupabaseErrorMessage(error));
}

export async function getHistory(): Promise<AnalysisHistoryRow[]> {
    const {
        data: userData
    } = await supabase.auth.getUser();

    const user = userData.user;

    if (!user) return [];

    const { data, error } = await supabase
        .from("analysis_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
            ascending: false,
        });

    if (error) throw new Error(getSupabaseErrorMessage(error));

    return (data ?? []) as AnalysisHistoryRow[];
}
