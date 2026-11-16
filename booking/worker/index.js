// Cloudflare Worker: расписание, оплата в Stripe, автоблокировка слотов, письмо фотографу.
//   GET  /api/config   -> дни, тарифы, занятые слоты
//   POST /api/checkout -> держит слот(ы) 30 мин и возвращает ссылку на оплату Stripe
//   POST /api/webhook  -> Stripe сообщает про оплату/истечение: слот закрывается/освобождается, уходит письмо
import { CONFIG } from "./config.js";

const HOLD_SECONDS = 31 * 60;          // Stripe требует, чтобы сессия жила минимум 30 минут
const SESSION_SECONDS = 30 * 60 + 30;

const pad = n => String(n).padStart(2, "0");
const toMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const fromMin = n => pad(Math.floor(n / 60)) + ":" + pad(n % 60);
const STEP = () => CONFIG.slotMinutes + CONFIG.bufferMinutes;
const slotKey = (date, time) => `slot:${date} ${time}`;

// Подходит ли время начала: попадает в сетку и съёмка укладывается в рабочий день
function startOk(day, time, minutes) {
  const m = toMin(time), off = m - toMin(day.start);
  return off >= 0 && off % STEP() === 0 && m + minutes <= toMin(day.end);
}
// Ячейки сетки, которые занимает съёмка: 30 мин = 1 ячейка, 60 мин = 2 ячейки
function cellKeys(date, time, minutes) {
  const n = Math.ceil(minutes / STEP());
  return Array.from({ length: n }, (_, i) => slotKey(date, fromMin(toMin(time) + i * STEP())));
}

// «сейчас» в часовом поясе съёмок в формате "YYYY-MM-DD HH:MM"
function nowLocal() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: CONFIG.timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

function corsHeaders(env) {
  return {
    "access-control-allow-origin": env.ALLOWED_ORIGIN || "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type"
  };
}
const json = (env, obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...corsHeaders(env) } });

async function takenSlots(env) {
  const out = [];
  let cursor;
  do {
    const r = await env.SLOTS.list({ prefix: "slot:", cursor });
    for (const k of r.keys) out.push(k.name.slice(5));
    cursor = r.list_complete ? undefined : r.cursor;
  } while (cursor);
  return out;
}

function stripeForm(obj, prefix = "", out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v && typeof v === "object") stripeForm(v, key, out);
    else if (v !== undefined && v !== null && v !== "") out.append(key, String(v));
  }
  return out;
}

const cleanInsta = s => {
  s = String(s || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(s) ? s : null;
};
const cleanPhone = s => {
  s = String(s || "").trim();
  const digits = s.replace(/\D/g, "");
  return /^[+\d][\d\s().-]{5,24}$/.test(s) && digits.length >= 7 && digits.length <= 15 ? s : null;
};

async function handleCheckout(request, env) {
  let b;
  try { b = await request.json(); } catch { return json(env, { error: "bad_request" }, 400); }
  const { date, time } = b;
  const pkg = CONFIG.packages.find(p => p.minutes === Number(b.minutes));
  if (!pkg) return json(env, { error: "bad_package" }, 400);
  const day = CONFIG.days.find(d => d.date === date);
  if (!day || typeof time !== "string" || !startOk(day, time, pkg.minutes)) return json(env, { error: "bad_slot" }, 400);
  if (`${date} ${time}` <= nowLocal()) return json(env, { error: "past" }, 400);

  const name = String(b.name || "").trim().slice(0, 80);
  const instagram = cleanInsta(b.instagram);
  const phone = cleanPhone(b.phone);
  const people = Number(b.people);
  if (!name) return json(env, { error: "bad_name" }, 400);
  if (!instagram) return json(env, { error: "bad_instagram" }, 400);
  if (!phone) return json(env, { error: "bad_phone" }, 400);
  if (!Number.isInteger(people) || people < 1 || people > CONFIG.maxPeople) return json(env, { error: "bad_people" }, 400);
  const wishes = String(b.wishes || "").trim().slice(0, 400);
  const lang = ["ru", "en", "fr"].includes(b.lang) ? b.lang : "auto";

  // Сразу держим все ячейки, пока человек платит
  const keys = cellKeys(date, time, pkg.minutes);
  for (const k of keys) if (await env.SLOTS.get(k)) return json(env, { error: "taken" }, 409);
  const hold = session => JSON.stringify({ status: "held", session, at: Date.now() });
  for (const k of keys) await env.SLOTS.put(k, hold(undefined), { expirationTtl: HOLD_SECONDS });

  const meta = {
    slot: `${date} ${time}`, minutes: pkg.minutes, people, price: pkg.price, deposit: pkg.deposit,
    name, instagram: "@" + instagram, phone, wishes: wishes || "-"
  };
  const site = (env.SITE_URL || "").replace(/\/$/, "");
  const body = stripeForm({
    mode: "payment",
    payment_method_types: ["card"],   // включает Apple Pay и Google Pay
    line_items: [{
      quantity: 1,
      price_data: { currency: "eur", unit_amount: pkg.deposit * 100,
        product_data: { name: `Booking deposit — ${pkg.minutes}-min photoshoot ${date} ${time}` } }
    }],
    metadata: meta,
    custom_text: { submit: { message: `Booking deposit (arrhes): reserves your time slot and is credited against the price of the shoot. Non-refundable if you cancel. No 14-day withdrawal right for a shoot on a fixed date (art. L221-28, 12° French Consumer Code). Terms: ${site}/cgv.html` } },
    payment_intent_data: { description: `Предоплата за бронь: фотосессия ${pkg.minutes} мин, ${date} ${time} — ${name} @${instagram}`, metadata: meta },
    client_reference_id: `${date}_${time.replace(":", "")}`,
    locale: lang,
    expires_at: Math.floor(Date.now() / 1000) + SESSION_SECONDS,
    success_url: `${site}/?paid=1&slot=${encodeURIComponent(`${date} ${time}`)}`,
    cancel_url: `${site}/`
  });

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "content-type": "application/x-www-form-urlencoded" },
    body
  });
  const session = await res.json();
  if (!res.ok) {
    for (const k of keys) await env.SLOTS.delete(k);
    console.error("stripe error", JSON.stringify(session));
    return json(env, { error: "stripe" }, 502);
  }
  for (const k of keys) await env.SLOTS.put(k, hold(session.id), { expirationTtl: HOLD_SECONDS });
  return json(env, { url: session.url });
}

// ---------- письмо фотографу (Resend) ----------
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function sendEmail(env, bk) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_EMAIL) { console.warn("email not configured, skipping"); return; }
  const end = fromMin(toMin(bk.time) + bk.minutes);
  const rows = [
    ["Когда", `${bk.date}, ${bk.time}–${end} (${bk.minutes} мин)`],
    ["Количество человек", bk.people],
    ["Имя", bk.name],
    ["Instagram", bk.instagram],
    ["Телефон", bk.phone],
    ["Email клиента", bk.email || "—"],
    ["Пожелания", bk.wishes && bk.wishes !== "-" ? bk.wishes : "—"],
    ["Стоимость", `${bk.price} € (предоплата ${bk.deposit} € получена, остаток ${bk.price - bk.deposit} € на съёмке)`]
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<h2>🎄 Новая запись: ${esc(bk.date)} ${esc(bk.time)}</h2><table cellpadding="6" style="border-collapse:collapse">` +
    rows.map(([k, v]) => `<tr><td style="color:#666">${esc(k)}</td><td><b>${esc(v)}</b></td></tr>`).join("") + `</table>`;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM || "Photo booking <onboarding@resend.dev>",
      to: [env.NOTIFY_EMAIL],
      reply_to: bk.email || undefined,
      subject: `Новая запись: ${bk.date} ${bk.time} — ${bk.name} (${bk.instagram})`,
      text, html
    })
  });
  if (!res.ok) throw new Error("resend " + res.status + " " + await res.text());
}

// ---------- проверка подписи Stripe ----------
async function verifyStripe(raw, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map(p => p.split("=")));
  const t = parts.t, sigs = header.split(",").filter(p => p.startsWith("v1=")).map(p => p.slice(3));
  if (!t || !sigs.length) return false;
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${t}.${raw}`)));
  const hex = [...mac].map(b => b.toString(16).padStart(2, "0")).join("");
  return sigs.some(s => s.length === hex.length && [...s].reduce((a, c, i) => a | (c.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
}

async function handleWebhook(request, env) {
  const raw = await request.text();
  if (!(await verifyStripe(raw, request.headers.get("stripe-signature"), env.STRIPE_WEBHOOK_SECRET)))
    return new Response("bad signature", { status: 400 });
  const event = JSON.parse(raw);
  const s = event.data && event.data.object;
  const m = s && s.metadata;
  if (!m || !m.slot) return new Response("ok");
  const [date, time] = m.slot.split(" ");
  const minutes = Number(m.minutes) || CONFIG.slotMinutes;
  const keys = cellKeys(date, time, minutes);

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    if (s.payment_status === "paid") {
      const main = await env.SLOTS.get(keys[0], "json");
      if (main && main.status === "booked" && main.session === s.id && main.emailed) return new Response("ok"); // повтор события
      const record = {
        status: "booked", session: s.id, date, time, minutes, people: Number(m.people) || 1,
        price: Number(m.price), deposit: Number(m.deposit), name: m.name, instagram: m.instagram, phone: m.phone,
        wishes: m.wishes, email: s.customer_details && s.customer_details.email,
        emailed: false, at: Date.now()
      };
      // Закрываем все ячейки навсегда
      for (const [i, k] of keys.entries()) await env.SLOTS.put(k, JSON.stringify(i === 0 ? record : { status: "booked", session: s.id, part: true }));
      try {
        await sendEmail(env, record);
        record.emailed = true;
        await env.SLOTS.put(keys[0], JSON.stringify(record));
      } catch (e) {
        console.error("email failed", e);
        return new Response("email failed", { status: 500 }); // Stripe повторит; бронь уже сохранена
      }
    }
  } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
    for (const k of keys) {
      const cur = await env.SLOTS.get(k, "json");
      if (cur && cur.status === "held" && cur.session === s.id) await env.SLOTS.delete(k);
    }
  }
  return new Response("ok");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(env) });
    try {
      if (url.pathname === "/api/config" && request.method === "GET")
        return json(env, { ...CONFIG, taken: await takenSlots(env), now: nowLocal() });
      if (url.pathname === "/api/checkout" && request.method === "POST") return await handleCheckout(request, env);
      if (url.pathname === "/api/webhook" && request.method === "POST") return await handleWebhook(request, env);
    } catch (e) {
      console.error(e);
      return json(env, { error: "server" }, 500);
    }
    return new Response("Not found", { status: 404 });
  }
};
