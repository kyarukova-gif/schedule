// Netlify Function: все запросы /api/* (расписание, оплата, вебхук Stripe)
import { getStore } from "@netlify/blobs";
import nodemailer from "nodemailer";
import worker from "../lib/core.mjs";
import { CONFIG } from "../lib/config.mjs";
import { kvFromBlobs } from "../lib/kv.mjs";

const get = k => globalThis.Netlify?.env?.get(k) ?? process.env[k];

export default async (request) => {
  const env = {
    SLOTS: kvFromBlobs(getStore("slots")),
    STRIPE_SECRET_KEY: get("STRIPE_SECRET_KEY"),
    STRIPE_WEBHOOK_SECRET: get("STRIPE_WEBHOOK_SECRET"),
    RESEND_API_KEY: get("RESEND_API_KEY"),
    NOTIFY_EMAIL: get("NOTIFY_EMAIL"),
    MAIL_FROM: get("MAIL_FROM"),
    ALLOW_MAIL_RESEND: get("ALLOW_MAIL_RESEND"),
    SITE_URL: get("URL")            // адрес сайта Netlify подставляет сам
  };
  // Письмо клиенту отправляется с Gmail-адреса фотографа (пароль приложения Google)
  const gUser = get("GMAIL_USER"), gPass = (get("GMAIL_APP_PASSWORD") || "").replace(/\s/g, "");
  if (gUser && gPass) {
    env.sendClientMail = async m => {
      const tr = nodemailer.createTransport({ service: "gmail", auth: { user: gUser, pass: gPass } });
      await tr.sendMail({
        from: `"${CONFIG.senderName}" <${gUser}>`, to: m.to, replyTo: gUser, subject: m.subject, text: m.text, html: m.html,
        attachments: [{ filename: "photoshoot.ics", content: m.ics, contentType: "text/calendar; charset=utf-8; method=PUBLISH" }]
      });
    };
  }
  return worker.fetch(request, env);
};

export const config = { path: "/api/*" };
