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

async function findUserByEmail(email: string) {
  let page = 1;

  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (authUser) => authUser.email?.toLowerCase() === email
    );

    if (user) {
      return user;
    }

    if (data.users.length < 1000) {
      return null;
    }

    page += 1;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    if (!email || typeof email !== "string") {
      return jsonResponse({ success: false, message: "Email is required" }, 400);
    }

    if (!code || typeof code !== "string" || !/^\d{6}$/.test(code)) {
      return jsonResponse(
        { success: false, message: "Enter a valid 6-digit code" },
        400
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const codeHash = await hashCode(code);
    const now = new Date().toISOString();

    const { data: matchingCodes, error: lookupError } = await supabaseAdmin
      .from("account_verification_codes")
      .select("email")
      .eq("email", normalizedEmail)
      .eq("code_hash", codeHash)
      .eq("verified", false)
      .gt("expires_at", now)
      .limit(1);

    if (lookupError) {
      throw lookupError;
    }

    if (!matchingCodes?.length) {
      return jsonResponse(
        { success: false, message: "Invalid or expired verification code" },
        400
      );
    }

    const user = await findUserByEmail(normalizedEmail);

    if (!user) {
      return jsonResponse(
        { success: false, message: "Unable to verify account" },
        400
      );
    }

    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email_confirm: true,
      });

    if (updateError) {
      throw updateError;
    }

    await supabaseAdmin
      .from("account_verification_codes")
      .update({ verified: true })
      .eq("email", normalizedEmail)
      .eq("code_hash", codeHash)
      .eq("verified", false);

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      { success: false, message: "Unable to verify account" },
      500
    );
  }
});
