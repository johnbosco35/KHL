import { env, isProd } from "../config/env.js";

type Mail = { to: string; subject: string; html: string; text: string };

/** Sends via Resend when RESEND_API_KEY is set; otherwise logs the message (development). */
export async function sendMail(mail: Mail): Promise<void> {
  if (!env.RESEND_API_KEY) {
    if (!isProd) console.log(`\n[mail] To: ${mail.to}\nSubject: ${mail.subject}\n${mail.text}\n`);
    else console.warn("[mail] RESEND_API_KEY is not set — email not sent:", mail.subject);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, ...mail }),
  });
  if (!res.ok) console.error("[mail] Resend error:", res.status, await res.text());
}

export function passwordResetMail(to: string, name: string, url: string): Mail {
  return {
    to,
    subject: "Reset your KH Luxury password",
    text: `Hello ${name},\n\nUse this link to choose a new password (valid for 1 hour):\n${url}\n\nIf you did not ask for this, you can ignore this email.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Use the link below to choose a new password. It is valid for 1 hour.</p><p><a href="${url}">Reset my password</a></p><p>If you did not ask for this, you can ignore this email.</p>`,
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
