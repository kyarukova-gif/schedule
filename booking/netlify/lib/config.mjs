// ============================================================
//  НАСТРОЙКИ ФОТОДНЕЙ — единственное место, где менять даты и цены
// ============================================================
export const CONFIG = {
  // Тарифы. deposit — невозвратная предоплата, остальное оплачивается на съёмке.
  packages: [
    { minutes: 30, price: 90,  deposit: 20 },   // 1–3 человека
    { minutes: 60, price: 170, deposit: 20 }    // компании
  ],
  maxPeople: 15,            // максимум человек в одной записи
  recommendedMaxFor30: 3,   // с 4 человек страница советует взять час

  slotMinutes: 30,          // базовый слот
  bufferMinutes: 5,         // перерыв между съёмками (шаг сетки = 30 + 5 = 35 мин)
  timezone: "Europe/Paris", // часовой пояс места съёмок
  instagram: "yarukovka", // основной Instagram, без @
  instagramPortfolio: "grapeprofoto", // фотопортфолио, без @

  // Для письма клиенту после оплаты
  contact: { email: "k.yarukova@gmail.com", whatsapp: "33634181505", phone: "" },   // whatsapp — только цифры с кодом страны, например 33612345678
  meetingPoint: { ru: "Под каруселью на Marché de Noël", en: "Under the carousel at the Marché de Noël", fr: "Sous le carrousel du Marché de Noël" },
  website: "https://katherinegrape.com",   // сайт фотографа (ссылка в подписи письма)
  guideUrl: { ru: "/media/guide-ru.pdf", en: "/media/guide-en.pdf", fr: "/media/guide-fr.pdf" },   // гайд по съёмке, по языку клиента (папка media)
  senderName: "Katherine Grape",

  // Фотодни. date — YYYY-MM-DD, start/end — часы работы .
  days: [
    { date: "2026-12-01", start: "12:00", end: "16:00", place: "Marché de Noël, Nice" },
    { date: "2026-12-11", start: "12:00", end: "16:00", place: "Marché de Noël, Nice" },
    { date: "2026-12-19", start: "12:00", end: "16:00", place: "Marché de Noël, Nice" },
    { date: "2026-12-21", start: "12:00", end: "16:00", place: "Marché de Noël, Nice" }
  ]
};
