import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

/**
 * Supabase Auth "Send SMS" Hook — Dual Channel (SMS + WhatsApp)
 *
 * Flow:
 *   1. User calls supabase.auth.signInWithOtp({ phone })
 *   2. Supabase generates OTP internally
 *   3. Supabase calls this hook instead of its built-in SMS provider
 *   4. We deliver the OTP via the configured channel:
 *      - "sms"      → SMSLogin.co (Indian bulk SMS gateway) — works immediately
 *      - "whatsapp"  → AiSensy WhatsApp API — needs approved Meta template
 *      - "auto"      → Try WhatsApp first, fall back to SMS
 *   5. User enters OTP → supabase.auth.verifyOtp() → session created
 *
 * Required env vars:
 *   SEND_SMS_HOOK_SECRET  — Webhook secret from Supabase Dashboard
 *   OTP_CHANNEL           — "sms" | "whatsapp" | "auto" (default: "sms")
 *
 * For SMS (SMSLogin.co):
 *   SMSLOGIN_API_KEY      — API key from SMSLogin.co
 *   SMSLOGIN_USERNAME     — Account username
 *   SMSLOGIN_SENDER_ID    — DLT-registered sender ID (e.g. "MYHLTP")
 *   SMSLOGIN_TEMPLATE_ID  — DLT template ID for OTP message
 *
 * For WhatsApp (AiSensy):
 *   AISENSY_API_KEY        — Campaign API Key from app.aisensy.com
 *   AISENSY_CAMPAIGN_NAME  — Campaign name linked to approved auth template
 */

const JSON_HEADERS = { "Content-Type": "application/json" };

// ─── SMS via SMSLogin.co ────────────────────────────────────────────
async function sendViaSMS(phone: string, otp: string, maskedPhone: string): Promise<Response> {
  const apiKey = Deno.env.get("SMSLOGIN_API_KEY");
  const username = Deno.env.get("SMSLOGIN_USERNAME");
  const senderId = Deno.env.get("SMSLOGIN_SENDER_ID") || "MYHLTP";
  const templateId = Deno.env.get("SMSLOGIN_TEMPLATE_ID") || "1707175326692338253";

  if (!apiKey || !username) {
    console.error("SMSLogin credentials not configured");
    return new Response(
      JSON.stringify({
        error: { http_code: 500, message: "SMS credentials not configured" },
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  // Strip leading "91" country code if present — SMSLogin expects 10-digit Indian number
  const mobileNumber = phone.startsWith("91") ? phone.slice(2) : phone;

  const message = `Dear User, Your OTP for login to My health passport app is ${otp}. Please do not share this OTP.`;

  const params = new URLSearchParams({
    username,
    apikey: apiKey,
    senderid: senderId,
    mobile: mobileNumber,
    message,
    templateid: templateId,
  });

  const url = `https://smslogin.co/v3/api.php?${params.toString()}`;

  console.log(`[SMS] Sending OTP to ${maskedPhone} via SMSLogin.co`);

  const smsResponse = await fetch(url);
  const smsResult = await smsResponse.text();

  console.log(`[SMS] SMSLogin response: ${smsResult}`);

  // SMSLogin returns plain text — "sent" or error message
  // A successful response typically contains a transaction/message ID
  if (smsResponse.ok) {
    console.log(`[SMS] OTP sent successfully to ${maskedPhone}`);
    return new Response(JSON.stringify({}), { headers: JSON_HEADERS });
  }

  console.error(`[SMS] Failed: ${smsResult}`);
  return new Response(
    JSON.stringify({
      error: { http_code: 500, message: `SMS delivery failed: ${smsResult}` },
    }),
    { status: 500, headers: JSON_HEADERS }
  );
}

// ─── WhatsApp via AiSensy ───────────────────────────────────────────
async function sendViaWhatsApp(phone: string, otp: string, maskedPhone: string): Promise<Response> {
  const aiSensyApiKey = Deno.env.get("AISENSY_API_KEY");
  const campaignName = Deno.env.get("AISENSY_CAMPAIGN_NAME") || "mhp_otp_login";

  if (!aiSensyApiKey) {
    console.error("AISENSY_API_KEY not configured");
    return new Response(
      JSON.stringify({
        error: { http_code: 500, message: "WhatsApp API key not configured" },
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  console.log(`[WhatsApp] Sending OTP to ${maskedPhone} via AiSensy`);

  const aiSensyResponse = await fetch(
    "https://backend.aisensy.com/campaign/t1/api/v2",
    {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        apiKey: aiSensyApiKey,
        campaignName: campaignName,
        destination: phone,
        userName: "MY HEALTH PASSPORT",
        templateParams: [otp],
      }),
    }
  );

  const aiSensyData = await aiSensyResponse.json();

  if (!aiSensyResponse.ok) {
    console.error("[WhatsApp] AiSensy API error:", JSON.stringify(aiSensyData));
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: `WhatsApp delivery failed: ${
            aiSensyData.message || aiSensyData.msg || "Unknown error"
          }`,
        },
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  console.log(`[WhatsApp] OTP sent successfully to ${maskedPhone}`);
  return new Response(JSON.stringify({}), { headers: JSON_HEADERS });
}

// ─── Main Handler ───────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200 });
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  // --- Verify webhook signature ---
  const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET");
  if (!hookSecret) {
    console.error("SEND_SMS_HOOK_SECRET not configured");
    return new Response(
      JSON.stringify({
        error: { http_code: 500, message: "SMS hook secret not configured" },
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }

  // Supabase stores as "v1,whsec_xxx" — standardwebhooks expects "whsec_xxx"
  const secret = hookSecret.startsWith("v1,")
    ? hookSecret.slice(3)
    : hookSecret;

  let user: { id: string; phone: string };
  let sms: { otp: string };

  try {
    const wh = new Webhook(secret);
    const data = wh.verify(payload, headers) as {
      user: { id: string; phone: string };
      sms: { otp: string };
    };
    user = data.user;
    sms = data.sms;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response(
      JSON.stringify({
        error: { http_code: 403, message: "Webhook signature verification failed" },
      }),
      { status: 403, headers: JSON_HEADERS }
    );
  }

  // --- Extract phone and OTP ---
  const phone = user.phone.replace("+", ""); // Remove "+" prefix
  const otp = sms.otp;
  const maskedPhone = phone.slice(0, 4) + "****" + phone.slice(-2);

  // --- Route to configured channel ---
  const channel = (Deno.env.get("OTP_CHANNEL") || "sms").toLowerCase();

  console.log(`OTP request for ${maskedPhone} — channel: ${channel}`);

  try {
    if (channel === "whatsapp") {
      return await sendViaWhatsApp(phone, otp, maskedPhone);
    }

    if (channel === "auto") {
      // Try WhatsApp first, fall back to SMS
      try {
        const waResponse = await sendViaWhatsApp(phone, otp, maskedPhone);
        if (waResponse.ok) return waResponse;
        console.warn("[auto] WhatsApp failed, falling back to SMS");
      } catch (waErr) {
        console.warn("[auto] WhatsApp error, falling back to SMS:", waErr);
      }
      return await sendViaSMS(phone, otp, maskedPhone);
    }

    // Default: "sms"
    return await sendViaSMS(phone, otp, maskedPhone);
  } catch (err) {
    console.error("OTP delivery failed:", err);
    return new Response(
      JSON.stringify({
        error: { http_code: 500, message: `OTP delivery failed: ${err.message}` },
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});
