import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

dotenv.config();

const required = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "APP_URL",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const app = express();
app.use(express.json({ limit: "32kb" }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL)
  .split(",")
  .map((x) => x.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow server-to-server / health checks with no Origin header.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin not allowed by CORS"));
    },
    methods: ["POST", "GET"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const PORT = Number(process.env.PORT || 3000);
const RATE_LIMIT_MS = 60_000;
const lastSentByUid = new Map();

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[ch]));
}

function normalizeName(value) {
  const name = String(value || "").trim().replace(/\s+/g, " ");
  return name.slice(0, 80) || "there";
}

function buildVerificationEmail({ name, link }) {
  const safeName = escapeHtml(name);
  const safeLink = escapeHtml(link);

  return {
    subject: "Verify your Campus Connect email",
    html: `<!doctype html>
<html>
  <body style="margin:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#18233a;">
    <div style="max-width:620px;margin:40px auto;padding:0 16px;">
      <div style="background:#060a12;border-radius:22px 22px 0 0;padding:28px 30px;color:#fff;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.7;">University of Peradeniya</div>
        <div style="font-size:30px;font-weight:700;margin-top:8px;">Campus Connect</div>
        <div style="font-size:13px;color:#c9a227;margin-top:5px;">One campus. Every event.</div>
      </div>

      <div style="background:#ffffff;padding:34px 30px;border:1px solid #e3e7ef;border-top:0;border-radius:0 0 22px 22px;">
        <p style="font-size:16px;">Hello ${safeName},</p>

        <h1 style="font-size:25px;line-height:1.2;margin:18px 0 12px;">
          Verify your email address
        </h1>

        <p style="font-size:15px;line-height:1.7;color:#5b6472;">
          Thanks for creating your Campus Connect account. Please verify your
          email address to finish setting up your account.
        </p>

        <p style="margin:28px 0;">
          <a href="${safeLink}"
             style="display:inline-block;background:#1b2740;color:#ffffff;text-decoration:none;
                    padding:13px 22px;border-radius:999px;font-weight:700;font-size:14px;">
            Verify my email
          </a>
        </p>

        <p style="font-size:12px;line-height:1.6;color:#7a8495;">
          If the button does not work, copy and paste this link into your browser:
        </p>

        <p style="font-size:11px;line-height:1.6;word-break:break-all;color:#536071;">
          ${safeLink}
        </p>

        <hr style="border:0;border-top:1px solid #e8ebf0;margin:28px 0;">

        <p style="font-size:12px;line-height:1.6;color:#7a8495;margin:0;">
          If you did not create a Campus Connect account, you can safely ignore this email.
        </p>
      </div>

      <p style="font-size:11px;text-align:center;color:#8b94a3;margin:18px 0;">
        Campus Connect · University of Peradeniya
      </p>
    </div>
  </body>
</html>`,
    text: `Hello ${name},

Verify your Campus Connect email address:

${link}

If you did not create a Campus Connect account, you can ignore this email.

Campus Connect · University of Peradeniya`,
  };
}

async function sendWithResend({ to, subject, html, text }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.message || "Email provider rejected the message.");
    error.providerData = data;
    throw error;
  }

  return data;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "campusconnect-email" });
});

app.post("/api/send-verification", async (req, res) => {
  try {
    const authorization = req.headers.authorization || "";
    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        code: "verification/unauthorized",
        message: "Missing Firebase authentication token.",
      });
    }

    const idToken = authorization.slice("Bearer ".length).trim();
    const decoded = await getAuth().verifyIdToken(idToken);

    if (!decoded.email || decoded.email_verified) {
      return res.status(400).json({
        code: "verification/already-verified",
        message: "This account is already verified.",
      });
    }

    const now = Date.now();
    const lastSent = lastSentByUid.get(decoded.uid) || 0;
    if (now - lastSent < RATE_LIMIT_MS) {
      return res.status(429).json({
        code: "verification/rate-limited",
        message: "Please wait before requesting another verification email.",
      });
    }

    // Firebase Admin SDK generates the real verification action link.
    // The link remains a Firebase Auth link, while Resend handles delivery.
    const actionCodeSettings = {
      url: process.env.APP_URL,
      handleCodeInApp: false,
    };

    const link = await getAuth().generateEmailVerificationLink(
      decoded.email,
      actionCodeSettings
    );

    const email = buildVerificationEmail({
      name: normalizeName(req.body?.displayName),
      link,
    });

    const providerResult = await sendWithResend({
      to: decoded.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    lastSentByUid.set(decoded.uid, now);

    return res.json({
      ok: true,
      id: providerResult?.id || null,
    });
  } catch (error) {
    console.error("Verification email error:", error);

    if (error?.code === "auth/id-token-expired") {
      return res.status(401).json({
        code: "verification/token-expired",
        message: "Your session expired. Please sign in again.",
      });
    }

    if (error?.code === "auth/id-token-revoked") {
      return res.status(401).json({
        code: "verification/token-revoked",
        message: "Your session is no longer valid. Please sign in again.",
      });
    }

    return res.status(500).json({
      code: "verification/send-failed",
      message: "The verification email could not be sent.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Campus Connect email service listening on port ${PORT}`);
});
