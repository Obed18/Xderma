/// <reference path="../deno-types.d.ts" />

import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generateConnectionCode(): string {
  const bytes = crypto.getRandomValues(
    new Uint8Array(16),
  );

  const randomPart = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return `xd_${randomPart}`;
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
    const telegramBotUsername =
      Deno.env.get("TELEGRAM_BOT_USERNAME");

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!telegramBotUsername) {
      throw new Error(
        "TELEGRAM_BOT_USERNAME is not configured.",
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Supabase server configuration is missing.",
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    const body = await req.json();

    const specialistName =
      typeof body.specialist_name === "string"
        ? body.specialist_name.trim()
        : "";

    if (!specialistName) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "specialist_name is required.",
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

    /*
     * Generate a secure one-time connection code.
     */

    const connectionCode =
      generateConnectionCode();

    /*
     * Link expires after 24 hours.
     */

    const expiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    /*
     * Save specialist connection.
     */

    const { data: connection, error } =
      await supabase
        .from("specialist_telegram_connections")
        .insert({
          specialist_name: specialistName,
          connection_code: connectionCode,
          status: "pending",
          expires_at: expiresAt,
        })
        .select()
        .single();

    if (error) {
      console.error(
        "Failed to create specialist connection:",
        error,
      );

      throw new Error(
        error.message ||
          "Failed to create specialist connection.",
      );
    }

    /*
     * Telegram deep link.
     */

    const telegramLink =
      `https://t.me/${telegramBotUsername}?start=${encodeURIComponent(
        connectionCode,
      )}`;

    return new Response(
      JSON.stringify({
        success: true,

        specialist: {
          id: connection.id,
          name: connection.specialist_name,
          status: connection.status,
        },

        connection,

        bot_username: telegramBotUsername,

        connection_code: connectionCode,

        telegram_link: telegramLink,

        expires_at: expiresAt,
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
      "Create specialist Telegram link error:",
      error,
    );

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create specialist Telegram link.",
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
