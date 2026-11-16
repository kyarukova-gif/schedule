// Netlify Function: все запросы /api/* (расписание, оплата, вебхук Stripe)
import { getStore } from "@netlify/blobs";
import worker from "../lib/core.mjs";
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
    SITE_URL: get("URL")            // адрес сайта Netlify подставляет сам
  };
  return worker.fetch(request, env);
};

export const config = { path: "/api/*" };
