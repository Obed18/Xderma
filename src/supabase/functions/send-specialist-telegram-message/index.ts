/// <reference path="../deno-types.d.ts" />

import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get(
  "SUPABASE_SERVICE_ROLE_KEY",
);

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is not configured");
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Supabase environment variables are missing");
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

const telegramApi = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(
  chatId: number | string,
  text: string,
) {
  const response = await fetch(`${telegramApi}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    console.error("Telegram sendMessage error:", result);

    throw new Error(
      result.description || "Failed to send Telegram message",
    );
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Method not allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const body = await req.json();

    const message =
      typeof body.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "message is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    let patientLabel = "XDerma patient";

    if (authHeader?.startsWith("Bearer ")) {
      const jwt = authHeader.replace("Bearer ", "");
      const { data } = await supabase.auth.getUser(jwt);
      const user = data.user;

      if (user) {
        const metadata = user.user_metadata as {
          full_name?: string;
          name?: string;
          first_name?: string;
          last_name?: string;
        };

        patientLabel =
          metadata.full_name ||
          metadata.name ||
          [metadata.first_name, metadata.last_name]
            .filter(Boolean)
            .join(" ") ||
          user.email ||
          patientLabel;
      }
    }

    const { data: specialist, error: specialistError } =
      await supabase
        .from("specialist_telegram_connections")
        .select("*")
        .eq("status", "connected")
        .not("telegram_chat_id", "is", null)
        .order("connected_at", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

    if (specialistError) {
      console.error(
        "Specialist lookup error:",
        specialistError,
      );

      throw specialistError;
    }

    if (!specialist?.telegram_chat_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No specialist is available right now.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const telegramMessage = await sendTelegramMessage(
      specialist.telegram_chat_id,
      [
        "New XDerma specialist chat message",
        "",
        `From: ${patientLabel}`,
        "",
        message,
      ].join("\n"),
    );

    return new Response(
      JSON.stringify({
        success: true,
        specialist_connection_id: specialist.id,
        telegram_message_id:
          telegramMessage.result?.message_id ?? null,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "Send specialist Telegram message error:",
      error,
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to send message to specialist.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
