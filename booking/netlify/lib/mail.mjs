// Письмо клиенту после оплаты: красивое HTML-письмо в стиле страницы, ссылка «в Google Календарь»
// и файл .ics для Apple Календаря / Outlook. Язык берётся из выбора клиента на странице.

const MONTHS = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]
};

const T = {
  ru: {
    subject: "Вы записаны на фотосессию — {when}", title: "Спасибо, вы записаны!",
    hello: "{name}, предоплата получена, время за вами. Ниже всё, что нужно знать.",
    when: "Когда", dur: "Длительность", people: "Участников", place: "Место", wishes: "Ваши пожелания", min: "мин",
    cal: "Добавить в Google Календарь", icsNote: "Для Apple Календаря и Outlook файл приложен к письму.",
    meet: "Где встречаемся", termsTitle: "Что важно знать",
    photosTitle: "Фотографии",
    ph1: "Готовые фотографии вы получите через 2 рабочих дня после съёмки.",
    ph2: "Все фотографии придут одной ссылкой, удобной для скачивания, с ретушью кожи и цветокоррекцией.",
    payTitle: "Оплата",
    pay1: "Предоплата {dep} € невозвратна, если вы отменяете съёмку.",
    pay2: "Остаток {rest} € оплачивается на съёмке.",
    weatherTitle: "Погода и перенос",
    w1: "Если погода не позволяет провести съёмку, она переносится на другой день по договорённости между вами и фотографом, при наличии свободного времени.",
    w2: "Если вам не подходит ни одно время, предоплата возвращается.",
    w3: "Перенос по форс-мажору (по вашей просьбе) возможен не позднее чем за 24 часа до съёмки. Это именно перенос, а не отмена: предоплата сохраняется за новым временем.",
    terms: "Полные условия", guide: "Гайд по съёмке", contactTitle: "Связаться со мной",
    ig: "Instagram", port: "Фотопортфолио", mail: "Почта", wa: "WhatsApp", phone: "Телефон",
    event: "Фотосессия на Marché de Noël (Ницца)", evDesc: "Остаток {rest} € оплачивается на съёмке.",
    footer: "Katherine Grape · фотограф в Ницце"
  },
  en: {
    subject: "You're booked for the photoshoot — {when}", title: "Thank you, you're booked!",
    hello: "{name}, your deposit is received and your time is reserved. Here is everything you need to know.",
    when: "When", dur: "Duration", people: "People", place: "Place", wishes: "Your wishes", min: "min",
    cal: "Add to Google Calendar", icsNote: "For Apple Calendar and Outlook, the calendar file is attached to this email.",
    meet: "Where we meet", termsTitle: "Good to know",
    photosTitle: "Photos",
    ph1: "You'll receive the finished photos within 2 working days after the shoot.",
    ph2: "All photos come in a single link that is easy to download, with skin retouching and color correction.",
    payTitle: "Payment",
    pay1: "The {dep} € deposit is non-refundable if you cancel the shoot.",
    pay2: "The remaining {rest} € is paid at the shoot.",
    weatherTitle: "Weather and rescheduling",
    w1: "If the weather doesn't allow the shoot, it will be moved to another day by agreement between you and the photographer, subject to availability.",
    w2: "If none of the options suits you, the deposit is refunded.",
    w3: "In case of force majeure, you can reschedule the shoot no later than 24 hours before it starts. This is a rescheduling, not a cancellation: your deposit carries over to the new time.",
    terms: "Full terms", guide: "Shoot guide", contactTitle: "Contact me",
    ig: "Instagram", port: "Photo portfolio", mail: "Email", wa: "WhatsApp", phone: "Phone",
    event: "Photoshoot at the Marché de Noël (Nice)", evDesc: "The remaining {rest} € is paid at the shoot.",
    footer: "Katherine Grape · photographer in Nice"
  },
  fr: {
    subject: "Votre séance photo est réservée — {when}", title: "Merci, c'est réservé !",
    hello: "{name}, vos arrhes sont reçues et votre créneau est réservé. Voici tout ce qu'il faut savoir.",
    when: "Quand", dur: "Durée", people: "Personnes", place: "Lieu", wishes: "Vos souhaits", min: "min",
    cal: "Ajouter à Google Agenda", icsNote: "Pour Apple Calendrier et Outlook, le fichier agenda est joint à cet e-mail.",
    meet: "Point de rendez-vous", termsTitle: "À savoir",
    photosTitle: "Photos",
    ph1: "Vous recevrez les photos finalisées sous 2 jours ouvrés après la séance.",
    ph2: "Toutes les photos vous sont transmises par un lien unique, facile à télécharger, avec retouche de la peau et colorimétrie.",
    payTitle: "Paiement",
    pay1: "Les arrhes de {dep} € ne sont pas remboursables si vous annulez la séance.",
    pay2: "Le solde de {rest} € est à régler sur place, le jour de la séance.",
    weatherTitle: "Météo et report",
    w1: "Si la météo ne permet pas de réaliser la séance, elle est reportée à un autre jour, d'un commun accord entre vous et la photographe, selon les disponibilités.",
    w2: "Si aucun créneau ne vous convient, les arrhes sont remboursées.",
    w3: "En cas de force majeure, vous pouvez reporter la séance au plus tard 24 heures avant son début. Il s'agit d'un report et non d'une annulation : vos arrhes restent valables pour le nouveau créneau.",
    terms: "Conditions complètes", guide: "Guide de la séance", contactTitle: "Me contacter",
    ig: "Instagram", port: "Portfolio photo", mail: "E-mail", wa: "WhatsApp", phone: "Téléphone",
    event: "Séance photo au Marché de Noël (Nice)", evDesc: "Le solde de {rest} € est à régler sur place.",
    footer: "Katherine Grape · photographe à Nice"
  }
};

const pad = n => String(n).padStart(2, "0");
const toMin = s => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
const fromMin = n => pad(Math.floor(n / 60) % 24) + ":" + pad(n % 60);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const fmt = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

// Местное время (часовой пояс съёмок) -> UTC
function tzOffset(utcMs, tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit"
  }).formatToParts(new Date(utcMs)).map(x => [x.type, x.value]));
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utcMs;
}
export function zonedToUtc(date, time, tz) {
  const [y, m, d] = date.split("-").map(Number), [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  return new Date(guess - tzOffset(guess, tz));
}
const stamp = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");   // 20261211T113500Z
const icsText = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

export function buildClientMail(rec, { config, siteUrl }) {
  const lang = T[rec.lang] ? rec.lang : "ru";
  const t = T[lang];
  const [y, mo, d] = rec.date.split("-").map(Number);
  const start = rec.time, end = fromMin(toMin(rec.time) + rec.minutes);
  const whenLong = `${d} ${MONTHS[lang][mo - 1]} ${y}, ${start}–${end}`;
  const whenShort = `${d} ${MONTHS[lang][mo - 1]}, ${start}`;
  const rest = (rec.price ?? 0) - (rec.deposit ?? 0);
  const v = { name: rec.name, rest, dep: rec.deposit, when: whenShort };
  const day = (config.days || []).find(x => x.date === rec.date);
  const place = (day && day.place) || "Marché de Noël, Nice";
  const meeting = config.meetingPoint && config.meetingPoint[lang] ? config.meetingPoint[lang] : "";
  const contact = config.contact || {};
  const ig = rec.instagramOwner || config.instagram;
  const site = (siteUrl || "").replace(/\/$/, "");
  const g0 = typeof config.guideUrl === "string" ? config.guideUrl : ((config.guideUrl && (config.guideUrl[lang] || config.guideUrl.ru)) || "");
  const guide = g0 ? (g0.startsWith("/") ? site + g0 : g0) : "";

  // календарь
  const dtStart = zonedToUtc(rec.date, start, config.timezone), dtEnd = new Date(dtStart.getTime() + rec.minutes * 60000);
  const location = meeting ? `${meeting} — ${place}` : place;
  const details = [fmt(t.evDesc, v), config.instagram ? "Instagram: @" + config.instagram : "", contact.email || ""].filter(Boolean).join("\n");
  const gcal = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(t.event)}&dates=${stamp(dtStart)}/${stamp(dtEnd)}` +
    `&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Katherine Grape//Marche de Noel Nice//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "BEGIN:VEVENT", `UID:${rec.session || rec.date + rec.time}@marche-de-noel-photo`, `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(dtStart)}`, `DTEND:${stamp(dtEnd)}`, `SUMMARY:${icsText(t.event)}`, `LOCATION:${icsText(location)}`,
    `DESCRIPTION:${icsText(details)}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n") + "\r\n";

  // оформление в стиле страницы
  const C = { night: "#0d261d", night2: "#17402f", cream: "#fbf4e2", ink: "#1d2a24", mute: "#6d746f", gold: "#e0b25a", red: "#c8423a", line: "#e8dcc0" };
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif", serif = "Georgia,'Times New Roman',serif";
  const btn = (href, label, solid = true) =>
    `<a href="${esc(href)}" style="display:inline-block;margin:4px 4px 4px 0;padding:13px 18px;border-radius:12px;font:600 15px ${font};text-decoration:none;` +
    (solid ? `background:${C.red};color:#ffffff;` : `background:#ffffff;color:${C.night};border:2px solid ${C.line};`) + `">${esc(label)}</a>`;
  const row = (k, val) => `<tr><td style="padding:7px 0;color:${C.mute};font:14px ${font};width:38%;vertical-align:top">${esc(k)}</td><td style="padding:7px 0;color:${C.ink};font:600 15px ${font};vertical-align:top">${val}</td></tr>`;
  const h = txt => `<div style="margin:26px 0 8px;font:600 12px ${font};letter-spacing:.12em;text-transform:uppercase;color:${C.mute}">${esc(txt)}</div>`;
  const sub = txt => `<div style="margin:14px 0 4px;font:700 14px ${font};color:${C.night}">${esc(txt)}</div>`;
  const li = txt => `<tr><td style="vertical-align:top;padding:4px 10px 4px 0;color:${C.gold};font:16px ${font}">✦</td><td style="padding:4px 0;color:${C.ink};font:15px/1.5 ${font}">${txt}</td></tr>`;

  const waDigits = String(contact.whatsapp || "").replace(/\D/g, "");
  const contactBtns = [
    btn("https://instagram.com/" + ig, t.ig + " @" + ig, false),
    config.instagramPortfolio ? btn("https://instagram.com/" + config.instagramPortfolio, t.port + " @" + config.instagramPortfolio, false) : "",
    contact.email ? btn("mailto:" + contact.email, t.mail, false) : "",
    waDigits ? btn("https://wa.me/" + waDigits, t.wa, false) : ""
  ].join("");

  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${C.night}">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.night}"><tr><td align="center" style="padding:20px 10px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td align="center" style="padding:26px 16px 22px;background:${C.night2};border-radius:18px 18px 0 0">
  <div style="font:12px ${font};letter-spacing:.24em;text-transform:uppercase;color:${C.gold}">✦ &nbsp;Marché de Noël&nbsp; ✦</div>
  <div style="margin-top:6px;font:italic 600 34px/1.1 ${serif};color:${C.cream}">${esc(t.title)}</div>
  <div style="margin-top:8px;font:600 13px ${font};letter-spacing:.3em;text-transform:uppercase;color:#f3e7c3">Nice</div>
</td></tr>
<tr><td style="padding:24px 22px 26px;background:${C.cream};border-radius:0 0 18px 18px">
  <p style="margin:0 0 18px;font:16px/1.5 ${font};color:${C.ink}">${esc(fmt(t.hello, v))}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px dashed ${C.line};border-bottom:1px dashed ${C.line}">
    ${row(t.when, esc(whenLong))}${row(t.dur, `${rec.minutes} ${esc(t.min)}`)}${row(t.people, esc(rec.people))}${row(t.place, esc(place))}
    ${rec.wishes && rec.wishes !== "-" ? row(t.wishes, esc(rec.wishes)) : ""}
  </table>
  <div style="margin-top:16px">${btn(gcal, t.cal)}</div>
  <div style="margin-top:4px;font:12px/1.4 ${font};color:${C.mute}">${esc(t.icsNote)}</div>
  ${meeting ? h(t.meet) + `<div style="font:15px/1.5 ${font};color:${C.ink}">${esc(meeting)}</div>` : ""}
  ${h(t.termsTitle)}
  ${sub(t.photosTitle)}<table role="presentation" cellpadding="0" cellspacing="0">${li(esc(t.ph1))}${li(esc(t.ph2))}</table>
  ${sub(t.payTitle)}<table role="presentation" cellpadding="0" cellspacing="0">${li(esc(fmt(t.pay1, v)))}${li(esc(fmt(t.pay2, v)))}</table>
  ${sub(t.weatherTitle)}<table role="presentation" cellpadding="0" cellspacing="0">${li(esc(t.w1))}${li(esc(t.w2))}${li(esc(t.w3))}</table>
  <div style="margin-top:10px"><a href="${esc(site + "/cgv.html")}" style="font:14px ${font};color:${C.night}">${esc(t.terms)} →</a></div>
  ${guide ? `<div style="margin-top:18px">${btn(guide, t.guide)}</div>` : ""}
  ${h(t.contactTitle)}
  <div>${contactBtns}</div>
  ${contact.phone ? `<div style="margin-top:8px;font:14px ${font};color:${C.ink}">${esc(t.phone)}: ${esc(contact.phone)}</div>` : ""}
</td></tr>
<tr><td align="center" style="padding:16px 10px;font:13px/1.6 ${font};color:#f1e3bd">
  ${config.website ? `<a href="${esc(config.website)}" style="color:#f3e7c3;text-decoration:underline">${esc(t.footer)}</a><br><a href="${esc(config.website)}" style="color:${C.gold};text-decoration:none">${esc(config.website.replace(/^https?:\/\//, ""))}</a>` : esc(t.footer)}
</td></tr>
</table></td></tr></table></body></html>`;

  const text = [t.title, "", fmt(t.hello, v), "", `${t.when}: ${whenLong}`, `${t.dur}: ${rec.minutes} ${t.min}`, `${t.people}: ${rec.people}`, `${t.place}: ${place}`,
    meeting ? `${t.meet}: ${meeting}` : "", "", `${t.cal}: ${gcal}`, "", t.termsTitle + ":", "", t.photosTitle + ":", "- " + t.ph1, "- " + t.ph2, "", t.payTitle + ":", "- " + fmt(t.pay1, v), "- " + fmt(t.pay2, v),
    "", t.weatherTitle + ":", "- " + t.w1, "- " + t.w2, "- " + t.w3, "",
    `${t.terms}: ${site}/cgv.html`, guide ? `${t.guide}: ${guide}` : "", "", t.contactTitle + ":", `Instagram: https://instagram.com/${ig}`, config.instagramPortfolio ? `${t.port}: https://instagram.com/${config.instagramPortfolio}` : "",
    contact.email ? `${t.mail}: ${contact.email}` : "", waDigits ? `WhatsApp: https://wa.me/${waDigits}` : "", config.website ? `${t.footer}: ${config.website}` : ""].filter(x => x !== "").join("\n");

  return { to: rec.email, subject: fmt(t.subject, v), html, text, ics, gcal };
}
