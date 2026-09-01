/// <reference path="../deno-types.d.ts" />

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

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

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return jsonResponse(
        { success: false, message: "Email is required" },
        400
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const code = generateCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabaseAdmin
      .from("account_verification_codes")
      .update({ verified: true })
      .eq("email", normalizedEmail)
      .eq("verified", false);

    const { error: insertError } = await supabaseAdmin
      .from("account_verification_codes")
      .insert({
        email: normalizedEmail,
        code_hash: codeHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      throw insertError;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "XDerma <noreply@xderma.addiesafriquefoundation.org>",
        to: [normalizedEmail],
        subject: "Your XDerma Account Verification Code",
        html: `
  <div style="
    margin: 0;
    padding: 40px 20px;
    background-color: #f7f9fb;
    font-family: Arial, Helvetica, sans-serif;
    color: #17202a;
  ">
    <div style="
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e5e9ed;
    ">
      <div style="
        padding: 30px 36px;
        border-bottom: 1px solid #edf0f2;
        text-align: center;
      ">
        <img
          src="https://xderma.addiesafriquefoundation.org/logo/xderma.png"
          alt="XDerma"
          width="58"
          height="58"
          style="
            display: block;
            width: 58px;
            height: 58px;
            object-fit: contain;
            margin: 0 auto;
          "
        />
      </div>
      <div style="padding: 40px 36px;">
        <p style="
          margin: 0 0 10px 0;
          font-size: 12px;
          font-weight: 600;
          color: #0A9DED;
          letter-spacing: 1px;
          text-transform: uppercase;
        ">
          Account Verification
        </p>
        <h1 style="
          margin: 0 0 16px 0;
          font-size: 27px;
          line-height: 1.3;
          font-weight: 600;
          color: #17202a;
          letter-spacing: -0.4px;
        ">
          Verify your account
        </h1>
        <p style="
          margin: 0 0 28px 0;
          font-size: 15px;
          line-height: 1.7;
          color: #5f6b75;
        ">
          Welcome to XDerma. Use the verification code below to finish creating
          your account.
        </p>
        <div style="
          padding: 22px 20px;
          margin: 0 0 26px 0;
          text-align: center;
          background-color: #f8fafb;
          border: 1px solid #e4e9ed;
        ">
          <div style="
            margin-bottom: 9px;
            font-size: 11px;
            font-weight: 600;
            color: #7b8790;
            text-transform: uppercase;
            letter-spacing: 1.4px;
          ">
            Verification Code
          </div>
          <div style="
            font-size: 32px;
            line-height: 1.2;
            font-weight: 600;
            letter-spacing: 8px;
            color: #0A9DED;
            padding-left: 8px;
          ">
            ${code}
          </div>
        </div>
        <p style="
          margin: 0 0 24px 0;
          font-size: 13px;
          line-height: 1.6;
          color: #6c7780;
        ">
          This code will expire in <strong style="color: #17202a;">10 minutes</strong>.
          Please do not share it with anyone.
        </p>
        <p style="
          margin: 0;
          font-size: 14px;
          line-height: 1.7;
          color: #68747d;
        ">
          If you didn't create an XDerma account, you can safely ignore this email.
        </p>
        <p style="
          margin: 32px 0 0 0;
          padding-top: 24px;
          border-top: 1px solid #edf0f2;
          font-size: 14px;
          line-height: 1.6;
          color: #5f6b75;
        ">
          Regards,<br>
          <strong style="color: #17202a;">The XDerma Team</strong>
        </p>
      </div>
      <div style="
        padding: 22px 36px;
        border-top: 1px solid #edf0f2;
        text-align: center;
      ">
        <p style="
          margin: 0 0 6px 0;
          font-size: 11px;
          color: #8a959d;
        ">
          This is an automated security email from XDerma.
        </p>
        <p style="
          margin: 0;
          font-size: 11px;
          color: #a2abb2;
        ">
          &copy; ${new Date().getFullYear()} XDerma. All rights reserved.
        </p>
      </div>
    </div>
  </div>
`,
      }),
    });

    if (!emailResponse.ok) {
      const emailError = await emailResponse.text();
      console.error("Email error:", emailError);
      throw new Error("Failed to send email");
    }

    return jsonResponse({
      success: true,
      message: "A verification code has been sent to your email.",
    });
  } catch (error) {
    console.error(error);

    return jsonResponse(
      { success: false, message: "Unable to process account verification request" },
      500
    );
  }
});
