/* Выезжающая карточка «Запись на рождественскую съёмку» для сайта фотографа.
   Подключение (одна строка перед </body> на странице сайта):
   <script src="https://marchenoel2026.netlify.app/popup.js" defer></script>
   Текст, оформление и частота показа меняются здесь, на сайте записи; на сайте фотографа ничего менять потом не нужно.
   Отключить маленькую кнопку после закрытия: добавить в тег script атрибут data-pill="off". */
(function () {
  "use strict";
  var script = document.currentScript;
  var origin = "";
  try { origin = new URL(script.src).origin; } catch (e) { return; }
  var BOOKING = origin + "/";
  var PHOTO = origin + "/media/christmas-02.jpg";
  var DELAY = 3000;                          // через сколько мс выехать
  var HIDE_DAYS = 3;                         // после закрытия снова выезжать не раньше чем через столько дней
  var KEY = "mdn_booking_popup_closed";
  var PILL = !(script.dataset && script.dataset.pill === "off");

  function recentlyClosed() {
    try { var t = Number(localStorage.getItem(KEY) || 0); return t && Date.now() - t < HIDE_DAYS * 864e5; } catch (e) { return false; }
  }
  function markClosed() { try { localStorage.setItem(KEY, String(Date.now())); } catch (e) {} }

  // язык: по адресу (/ru, /en, /fr) или атрибуту html lang; по умолчанию французский
  function lang() {
    var p = (location.pathname || "").toLowerCase();
    if (/^\/ru(\/|$)/.test(p)) return "ru";
    if (/^\/en(\/|$)/.test(p)) return "en";
    if (/^\/fr(\/|$)/.test(p)) return "fr";
    var l = (document.documentElement.lang || "").slice(0, 2).toLowerCase();
    return { ru: "ru", en: "en", fr: "fr" }[l] || "fr";
  }
  var T = {
    ru: { kicker: "Экспресс-фотосессии", title: "Рождественская съёмка в Ницце", text: "Полчаса на Marché de Noël — тёплые кадры на память. Фотодни: 1, 11, 19 и 21 декабря.", cta: "Записаться", close: "Закрыть", pill: "Запись на съёмку" },
    en: { kicker: "Express photoshoots", title: "Christmas photoshoot in Nice", text: "Thirty minutes at the Marché de Noël — warm photos to keep. Photo days: December 1, 11, 19 and 21.", cta: "Book now", close: "Close", pill: "Book a shoot" },
    fr: { kicker: "Shootings express", title: "Séance photo de Noël à Nice", text: "Trente minutes au Marché de Noël — de belles photos à garder. Jours de séance : 1er, 11, 19 et 21 décembre.", cta: "Réserver", close: "Fermer", pill: "Réserver une séance" }
  }[lang()];

  var host, root, card, pill, opened = false;

  var CSS =
    ':host,*{box-sizing:border-box}' +
    '.wrap{position:fixed;right:20px;bottom:20px;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;pointer-events:none}' +
    '.wrap>*{pointer-events:auto}' +
    '.card{position:relative;width:340px;max-width:calc(100vw - 24px);border-radius:20px;overflow:hidden;background:#fbf4e2;color:#1d2a24;box-shadow:0 18px 50px rgba(7,24,18,.5);' +
      'transform:translateX(calc(100% + 40px));opacity:0;transition:transform .7s cubic-bezier(.2,1.25,.4,1),opacity .4s ease}' +
    '.card.in{transform:none;opacity:1}' +
    '.card::before{content:"";position:absolute;inset:0;border-radius:20px;padding:2px;pointer-events:none;z-index:3;' +
      'background:linear-gradient(120deg,#e0b25a,#fff3d1,#e0b25a,#c8423a,#e0b25a);background-size:300% 300%;animation:shine 6s linear infinite;' +
      '-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}' +
    '.ph{position:relative;height:150px;background:#17402f url("' + PHOTO + '") center 24%/cover;overflow:hidden}' +
    '.ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,24,18,.05),rgba(7,24,18,.45))}' +
    '.sn{position:absolute;top:-8px;border-radius:50%;background:#fff;opacity:.85;z-index:1;animation:fall linear infinite}' +
    '.body{padding:16px 18px 18px;text-align:center}' +
    '.k{font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#b8892f}' +
    'h2{margin:5px 0 7px;font:italic 600 23px/1.15 Georgia,"Times New Roman",serif;color:#14382b}' +
    'p{margin:0 0 14px;font-size:14px;line-height:1.5}' +
    'a.cta{position:relative;display:block;padding:13px;border-radius:13px;background:linear-gradient(180deg,#d4503f,#b53228);color:#fff;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 8px 20px rgba(200,66,58,.35);animation:pulse 2.4s ease-in-out infinite}' +
    'a.cta:hover{filter:brightness(1.06)}' +
    'a:focus-visible,button:focus-visible{outline:3px solid #e0b25a;outline-offset:2px}' +
    '.x{position:absolute;top:8px;right:8px;z-index:4;width:32px;height:32px;border:0;border-radius:50%;background:rgba(255,255,255,.92);color:#14382b;font-size:19px;line-height:1;cursor:pointer}' +
    '.pill{display:none;align-items:center;gap:8px;margin-left:auto;padding:11px 16px;border:0;border-radius:99px;cursor:pointer;font:700 14px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fbf4e2;background:#14382b;box-shadow:0 8px 24px rgba(7,24,18,.4),0 0 0 2px #e0b25a;' +
      'transform:translateY(16px) scale(.9);opacity:0;transition:transform .5s cubic-bezier(.2,1.25,.4,1),opacity .35s ease}' +
    '.pill.in{display:flex;transform:none;opacity:1}' +
    '.pill.show{display:flex}' +
    '.pill b{font-size:17px;animation:wob 3s ease-in-out infinite}' +
    '@keyframes shine{0%{background-position:0% 50%}100%{background-position:300% 50%}}' +
    '@keyframes fall{0%{transform:translate(0,0)}100%{transform:translate(var(--dx,12px),180px)}}' +
    '@keyframes pulse{0%,100%{box-shadow:0 8px 20px rgba(200,66,58,.35),0 0 0 0 rgba(200,66,58,.45)}60%{box-shadow:0 8px 20px rgba(200,66,58,.35),0 0 0 10px rgba(200,66,58,0)}}' +
    '@keyframes wob{0%,100%{transform:rotate(0)}8%{transform:rotate(-14deg)}16%{transform:rotate(12deg)}24%{transform:rotate(0)}}' +
    '@media (max-width:520px){.wrap{right:12px;left:12px;bottom:12px}.card{width:100%;max-width:none}.ph{height:120px}}' +
    '@media (prefers-reduced-motion:reduce){.card,.pill{transition:opacity .2s ease;transform:none}.card::before,a.cta,.sn,.pill b{animation:none}.sn{display:none}}';

  function build() {
    host = document.createElement("div");
    host.id = "mdn-booking-popup";
    root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;      // изолируем стили от сайта
    var snow = "";
    for (var i = 0; i < 16; i++) {
      var s = 2 + Math.random() * 3.2;
      snow += '<i class="sn" style="left:' + (Math.random() * 100).toFixed(1) + '%;width:' + s.toFixed(1) + 'px;height:' + s.toFixed(1) +
        'px;--dx:' + (Math.random() * 30 - 15).toFixed(0) + 'px;animation-duration:' + (3 + Math.random() * 3.5).toFixed(1) + 's;animation-delay:-' + (Math.random() * 6).toFixed(1) + 's"></i>';
    }
    root.innerHTML = '<style>' + CSS + '</style><div class="wrap">' +
      '<section class="card" role="complementary" aria-label="' + T.title + '">' +
      '<button type="button" class="x" aria-label="' + T.close + '">×</button>' +
      '<div class="ph">' + snow + '</div><div class="body">' +
      '<div class="k">✦ ' + T.kicker + ' ✦</div><h2>' + T.title + '</h2><p>' + T.text + '</p>' +
      '<a class="cta" href="' + BOOKING + '" target="_blank" rel="noopener">' + T.cta + '</a></div></section>' +
      (PILL ? '<button type="button" class="pill" aria-label="' + T.pill + '"><b>🎄</b>' + T.pill + '</button>' : '') + '</div>';
    card = root.querySelector(".card");
    pill = root.querySelector(".pill");
    root.querySelector(".x").addEventListener("click", close);
    root.querySelector("a.cta").addEventListener("click", markClosed);
    if (pill) pill.addEventListener("click", open);
    document.body.appendChild(host);
  }
  function onKey(e) { if (e.key === "Escape") close(); }
  function open() {
    opened = true;
    if (pill) { pill.classList.remove("in"); pill.classList.remove("show"); }
    requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.add("in"); }); });
    document.addEventListener("keydown", onKey);
  }
  function close() {
    opened = false; markClosed();
    card.classList.remove("in");
    document.removeEventListener("keydown", onKey);
    if (pill) setTimeout(function () { pill.classList.add("show"); requestAnimationFrame(function () { requestAnimationFrame(function () { pill.classList.add("in"); }); }); }, 450);
  }

  function start() {
    build();
    if (recentlyClosed()) {                                  // недавно закрывали: только маленькая кнопка
      if (pill) { pill.classList.add("show"); requestAnimationFrame(function () { requestAnimationFrame(function () { pill.classList.add("in"); }); }); }
      return;
    }
    setTimeout(open, DELAY);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
