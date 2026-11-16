// Сборка гайда по съёмке в PDF на трёх языках.
// Запуск (нужен playwright): node tools/guide/build.mjs  → media/guide-ru.pdf, guide-en.pdf, guide-fr.pdf
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, "../../media");
const { chromium } = createRequire(import.meta.url)("playwright");
const img = f => "data:image/jpeg;base64," + fs.readFileSync(path.join(here, "img", f)).toString("base64");

// порядок фото сверху вниз на каждой странице
const PHOTOS = [["p-001.jpg", "p-002.jpg", "p-000.jpg"], ["p-004.jpg", "p-005.jpg", "p-003.jpg"]];

// блоки: h — заголовок раздела, b — жирный абзац, p — текст, l — список
const TEXT = {
  ru: {
    title: "Инструкция по подготовке к новогодней съёмке на marche",
    pages: [[
      { h: "РАССЛАБИТЬСЯ И ПОЛУЧИТЬ УДОВОЛЬСТВИЕ" },
      { p: "Вы приходите, выдыхаете — и дальше мы вместе создаём красивые кадры.\nМоя задача — свет, ракурсы, атмосфера.\nВаша — просто быть собой, позволить себе почувствовать момент и… красиво жить в кадре." },
      { h: "КАК ПОДГОТОВИТЬСЯ К СЪЁМКЕ" },
      { b: "Не пить алкоголь и не есть солёное вечером перед съёмкой" },
      { p: "Да-да, это моё любимое правило. Алкоголь + солёное = отёчность, усталость, помятость.\nА нам нужна свежесть, энергия и радость бытия)) Так что ещё классно будет выспаться)" },
      { b: "Макияж" },
      { p: "Делайте привычный макияж, но на полтона сильнее, чем обычно:" },
      { l: ["ровный тон,", "чуть выделенные глаза или брови,", "аккуратная прическа."] },
      { p: "Камера любит чуть более «собранный» образ.\nНо перебарщивать не нужно — вам должно нравиться ваше отражение, а не ощущение, будто вас зовут на красную дорожку." }
    ], [
      { h: "КАК ПРОХОДИТ СЪЁМКА:" },
      { p: "За время съёмки мы спокойно пройдём основные локации рынка и создадим до 100 кадров в разных настроениях:" },
      { l: ["с глинтвейном или чашкой горячего напитка,", "у домиков, ёлок, гирлянд,", "на карусели или у качелей,", "с воздушной ватой,", "просто в прогулке и движении, без позирования через силу."] },
      { p: "Мы делаем маленькую рождественскую прогулку, наполненную ощущением праздника." },
      { h: "ОДЕЖДА И ЧТО ВЗЯТЬ С СОБОЙ" },
      { p: "Рождественская атмосфера — это прежде всего новогодние и зимние аксессуары:" },
      { l: ["шарфы, варежки, беретики, шапки,", "уютные свитера, пальто,", "всё, что создаёт ощущение тепла и праздника."] },
      { p: "Если вы приходите семьёй или парой, можно подобрать Family Look или просто гармоничные элементы, чтобы кадры смотрелись цельно." },
      { b: "Если у вас есть ваша продукция\nБерите её!" },
      { p: "Свечи, маленькие подарки, аксессуары, ваш бренд — мы аккуратно встроим это в съёмку, если это часть вашей задачи." }
    ]]
  },
  en: {
    title: "Preparing for your Christmas shoot at the marché",
    pages: [[
      { h: "RELAX AND ENJOY IT" },
      { p: "You arrive, you breathe out — and from there we create beautiful shots together.\nMy job is light, angles and atmosphere.\nYours is simply to be yourself, let yourself feel the moment and… live beautifully in the frame." },
      { h: "HOW TO PREPARE FOR THE SHOOT" },
      { b: "No alcohol and no salty food the evening before the shoot" },
      { p: "Yes, yes, this is my favorite rule. Alcohol + salt = puffiness, tiredness, a crumpled look.\nAnd we want freshness, energy and the joy of being)) So a good night's sleep will be great too)" },
      { b: "Makeup" },
      { p: "Do your usual makeup, but half a tone stronger than usual:" },
      { l: ["an even skin tone,", "slightly defined eyes or brows,", "a neat hairstyle."] },
      { p: "The camera likes a slightly more “put-together” look.\nBut don't overdo it — you should like your reflection, not feel as if you're being called to the red carpet." }
    ], [
      { h: "HOW THE SHOOT GOES:" },
      { p: "During the shoot we will calmly walk through the main spots of the market and create up to 100 shots in different moods:" },
      { l: ["with mulled wine or a cup of a hot drink,", "by the little houses, fir trees and garlands,", "on the carousel or by the swings,", "with cotton candy,", "simply walking and moving, without forced posing."] },
      { p: "We take a little Christmas stroll, full of the feeling of celebration." },
      { h: "WHAT TO WEAR AND WHAT TO BRING" },
      { p: "The Christmas atmosphere is, above all, festive and winter accessories:" },
      { l: ["scarves, mittens, berets, hats,", "cozy sweaters, coats,", "anything that creates a feeling of warmth and celebration."] },
      { p: "If you come as a family or a couple, you can coordinate a Family Look or just harmonious elements so the shots look cohesive." },
      { b: "If you have your own products\nBring them!" },
      { p: "Candles, small gifts, accessories, your brand — we will neatly work it into the shoot if it is part of your goal." }
    ]]
  },
  fr: {
    title: "Se préparer à la séance photo de Noël au marché",
    pages: [[
      { h: "SE DÉTENDRE ET EN PROFITER" },
      { p: "Vous arrivez, vous respirez — et ensuite nous créons ensemble de belles images.\nMon rôle : la lumière, les angles, l'atmosphère.\nLe vôtre : simplement être vous-même, vous laisser porter par le moment et… vivre joliment dans le cadre." },
      { h: "COMMENT SE PRÉPARER À LA SÉANCE" },
      { b: "Pas d'alcool ni d'aliments salés la veille au soir" },
      { p: "Eh oui, c'est ma règle préférée. Alcool + sel = visage gonflé, fatigue, traits tirés.\nEt nous voulons de la fraîcheur, de l'énergie et de la joie de vivre)) Une bonne nuit de sommeil sera donc parfaite aussi)" },
      { b: "Maquillage" },
      { p: "Faites votre maquillage habituel, mais un demi-ton plus marqué que d'habitude :" },
      { l: ["un teint uniforme,", "des yeux ou des sourcils légèrement soulignés,", "une coiffure soignée."] },
      { p: "L'appareil photo aime une allure un peu plus « apprêtée ».\nMais n'en faites pas trop — vous devez aimer votre reflet, pas avoir l'impression qu'on vous attend sur un tapis rouge." }
    ], [
      { h: "COMMENT SE DÉROULE LA SÉANCE :" },
      { p: "Pendant la séance, nous parcourons tranquillement les principaux lieux du marché et créons jusqu'à 100 images dans différentes ambiances :" },
      { l: ["avec un vin chaud ou une tasse de boisson chaude,", "près des chalets, des sapins, des guirlandes,", "sur le carrousel ou près des balançoires,", "avec de la barbe à papa,", "simplement en balade et en mouvement, sans poser à contrecœur."] },
      { p: "Nous faisons une petite promenade de Noël, pleine d'esprit de fête." },
      { h: "TENUE ET CE QU'IL FAUT APPORTER" },
      { p: "L'ambiance de Noël, ce sont avant tout des accessoires de fête et d'hiver :" },
      { l: ["écharpes, moufles, bérets, bonnets,", "pulls douillets, manteaux,", "tout ce qui crée une sensation de chaleur et de fête."] },
      { p: "Si vous venez en famille ou en couple, vous pouvez choisir un Family Look ou simplement des éléments assortis pour que les images forment un ensemble." },
      { b: "Si vous avez vos propres produits\nApportez-les !" },
      { p: "Bougies, petits cadeaux, accessoires, votre marque — nous les intégrerons avec soin à la séance si cela fait partie de votre projet." }
    ]]
  }
};

const esc = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const block = b => b.h ? `<h2><i></i>${esc(b.h)}</h2>`
  : b.b ? `<p class="b">${esc(b.b).replace(/\n/g, "<br>")}</p>`
  : b.l ? `<ul>${b.l.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`
  : `<p>${esc(b.p).replace(/\n/g, "<br>")}</p>`;

function html(lang) {
  const T = TEXT[lang];
  const pages = T.pages.map((blocks, i) => `
  <section class="page">
    <div class="strip"></div>
    <div class="text"><h1>${esc(T.title)}</h1>${blocks.map(block).join("")}</div>
    <div class="photos">${PHOTOS[i].map(f => `<img src="${img(f)}" alt="">`).join("")}</div>
  </section>`).join("");
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>${esc(T.title)}</title><style>
  @page{size:A4;margin:0}
  *{box-sizing:border-box}
  body{margin:0;font-family:"Noto Sans","Open Sans","Inter","DejaVu Sans",Arial,sans-serif;color:#222;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{position:relative;width:210mm;height:297mm;overflow:hidden;page-break-after:always;background:#fff}
  .strip{position:absolute;left:0;top:0;bottom:0;width:8mm;background:#ece9e7}
  .text{position:absolute;left:20mm;top:22mm;width:108mm}
  h1{margin:0 0 9mm;text-align:center;color:#4b2a7a;font-size:17pt;line-height:1.25;font-weight:700}
  h2{display:flex;gap:4mm;align-items:flex-start;margin:7mm 0 4mm;font-size:10.5pt;line-height:1.3;font-weight:700;letter-spacing:.01em}
  h2 i{flex:none;width:6mm;height:6mm;background:#d9d3cf;margin-top:.3mm}
  p{margin:0 0 3.2mm;font-size:10pt;line-height:1.5}
  p.b{font-weight:700;margin-top:4mm}
  ul{margin:0 0 3.2mm;padding:0 0 0 4.5mm;font-size:10pt;line-height:1.5;list-style:none}
  li{position:relative;margin:0}
  li::before{content:"—";position:absolute;left:-4.5mm}
  .photos{position:absolute;right:13mm;top:16mm;width:58mm;display:flex;flex-direction:column;gap:5mm}
  .photos img{display:block;width:58mm;height:86mm;object-fit:cover}
  </style></head><body>${pages}</body></html>`;
}

const browser = await chromium.launch();
for (const lang of Object.keys(TEXT)) {
  const page = await browser.newPage();
  await page.setContent(html(lang), { waitUntil: "load" });
  await page.pdf({ path: path.join(out, `guide-${lang}.pdf`), format: "A4", printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  console.log("готово:", `guide-${lang}.pdf`);
  await page.close();
}
await browser.close();
