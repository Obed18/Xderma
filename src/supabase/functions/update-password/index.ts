/// <reference path="../deno-types.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

async function hashCode(code: string) {
  const data = new TextEncoder().encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code, password } = await req.json();

    if (!email || typeof email !== "string") {
      return jsonResponse({ success: false, message: "Email is required" }, 400);
    }

    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return jsonResponse(
        { success: false, message: "Enter a valid 6-digit code" },
        400
      );
    }

    if (!password || typeof password !== "string" || password.length < 8) {
      return jsonResponse(
        { success: false, message: "Password must be at least 8 characters" },
        400
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const codeHash = await hashCode(code);
    const now = new Date().toISOString();

    const { data: matchingCodes, error: codeError } = await supabaseAdmin
      .from("password_reset_codes")
      .select("email")
      .eq("email", normalizedEmail)
      .eq("code_hash", codeHash)
      .eq("verified", false)
      .gt("expires_at", now)
      .limit(1);

    if (codeError) {
      throw codeError;
    }

    if (!matchingCodes?.length) {
      return jsonResponse(
        { success: false, message: "Invalid or expired verification code" },
        400
      );
    }

    const { data: usersData, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (usersError) {
      throw usersError;
    }

    const user = usersData.users.find(
      (authUser) => authUser.email?.toLowerCase() === normalizedEmail
    );

    if (!user) {
      return jsonResponse(
        { success: false, message: "Unable to update password" },
        400
      );
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password,
      });

    if (updateError) {
      throw updateError;
    }

    await supabaseAdmin
      .from("password_reset_codes")
      .update({ verified: true })
      .eq("email", normalizedEmail)
      .eq("code_hash", codeHash)
      .eq("verified", false);

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      { success: false, message: "Unable to update password" },
      500
    );
  }
});
