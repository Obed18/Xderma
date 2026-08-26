const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

if (!TELEGRAM_BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN is not configured");
}

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL is not configured");
}

const telegramApi = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-webhook`;

async function callTelegram(method: string, body?: Record<string, unknown>) {
  const response = await fetch(`${telegramApi}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result.description || `Telegram ${method} request failed`,
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
    const body = await req.json().catch(() => ({}));
    const action =
      typeof body.action === "string" ? body.action : "set";

    if (action === "info") {
      const info = await callTelegram("getWebhookInfo");

      return new Response(
        JSON.stringify({
          success: true,
          webhook_url: webhookUrl,
          telegram: info.result,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (action === "delete") {
      const deleted = await callTelegram("deleteWebhook", {
        drop_pending_updates: false,
      });

      return new Response(
        JSON.stringify({
          success: true,
          action: "delete",
          telegram: deleted.result,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const configured = await callTelegram("setWebhook", {
      url: webhookUrl,
      drop_pending_updates: false,
      allowed_updates: ["message", "edited_message"],
    });

    const info = await callTelegram("getWebhookInfo");

    return new Response(
      JSON.stringify({
        success: true,
        action: "set",
        webhook_url: webhookUrl,
        telegram: configured.result,
        webhook_info: info.result,
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
    console.error("Configure Telegram webhook error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to configure Telegram webhook.",
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
