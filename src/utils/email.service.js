import dns from "dns";
import nodemailer from "nodemailer";
import { ENV } from "../config/env.config.js";
import { buildPasswordResetEmail } from "../emails/password-reset.email.js";

// Évite les échecs DNS intermittents (IPv6 / résolution lente sous Windows).
dns.setDefaultResultOrder("ipv4first");

let transporter = null;

const RETRYABLE_CODES = new Set(["ENOTFOUND", "EAI_AGAIN", "ETIMEDOUT", "ECONNRESET", "ESOCKET"]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createSmtpTransport() {
  const auth = {
    user: ENV.SMTP_USER,
    pass: ENV.SMTP_PASSWORD,
  };

  const common = {
    auth,
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 20_000,
    tls: { minVersion: "TLSv1.2" },
  };

  if (ENV.SMTP_HOST?.includes("gmail.com") || ENV.SMTP_USER?.includes("@gmail.com")) {
    return nodemailer.createTransport({
      service: "gmail",
      ...common,
    });
  }

  return nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    requireTLS: ENV.SMTP_PORT === 587,
    ...common,
  });
}

function getTransporter() {
  if (transporter) return transporter;

  if (!ENV.SMTP_HOST || !ENV.SMTP_USER || !ENV.SMTP_PASSWORD) {
    return null;
  }

  transporter = createSmtpTransport();
  return transporter;
}

export function isEmailConfigured() {
  return Boolean(ENV.SMTP_HOST && ENV.SMTP_USER && ENV.SMTP_PASSWORD);
}

function formatFromAddress() {
  const from = (ENV.SMTP_FROM || "Itobe").trim();
  if (from.includes("@")) return from;
  return `"${from}" <${ENV.SMTP_USER}>`;
}

async function withRetries(fn, { attempts = 3, delayMs = 1500 } = {}) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const code = error?.code || "";
      const retryable = RETRYABLE_CODES.has(code) || /timeout|ENOTFOUND|EAI_AGAIN/i.test(error.message);

      if (!retryable || attempt === attempts) {
        throw error;
      }

      console.warn(`[EMAIL] Tentative ${attempt}/${attempts} échouée (${error.message}). Nouvel essai…`);
      await sleep(delayMs * attempt);
    }
  }

  throw lastError;
}

export async function verifySmtpConnection() {
  if (!isEmailConfigured()) {
    console.warn("[EMAIL] SMTP non configuré — envoi d'e-mails désactivé.");
    return false;
  }

  const transport = getTransporter();
  try {
    await withRetries(() => transport.verify());
    console.log(`[EMAIL] SMTP prêt (${ENV.SMTP_HOST || "gmail"} → ${ENV.SMTP_USER})`);
    return true;
  } catch (error) {
    console.error("[EMAIL] Connexion SMTP impossible:", error.message);
    return false;
  }
}

export async function sendEmail({ to, subject, html, text }) {
  const transport = getTransporter();
  if (!transport) {
    throw new Error("Configuration SMTP manquante.");
  }

  await withRetries(() =>
    transport.sendMail({
      from: formatFromAddress(),
      to,
      subject,
      html,
      text,
    }),
  );
}

export async function sendPasswordResetEmail({ to, prenom, resetUrl }) {
  const { subject, html, text } = buildPasswordResetEmail({ prenom, resetUrl });
  await sendEmail({ to, subject, html, text });
}
