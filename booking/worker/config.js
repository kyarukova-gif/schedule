// ============================================================
//  НАСТРОЙКИ ФОТОДНЕЙ — единственное место, где менять даты и цены
// ============================================================
export const CONFIG = {
  // Тарифы. deposit — невозвратная предоплата, остальное оплачивается на съёмке.
  packages: [
    { minutes: 30, price: 100, deposit: 20 },   // 1–3 человека
    { minutes: 60, price: 190, deposit: 20 }    // компании
  ],
  maxPeople: 15,            // максимум человек в одной записи
  recommendedMaxFor30: 3,   // с 4 человек страница советует взять час

  slotMinutes: 30,          // базовый слот
  bufferMinutes: 5,         // перерыв между съёмками (шаг сетки = 30 + 5 = 35 мин)
  timezone: "Europe/Paris", // часовой пояс места съёмок
  instagram: "grapeprofoto", // без @

  // ЗАМЕНИ ДАТЫ НА СВОИ. date — YYYY-MM-DD, start/end — часы работы.
  days: [
    { date: "2026-12-12", start: "13:00", end: "18:00", place: "Marché de Noël, Nice" },
    { date: "2026-12-13", start: "13:00", end: "18:00", place: "Marché de Noël, Nice" },
    { date: "2026-12-19", start: "13:00", end: "18:00", place: "Marché de Noël, Nice" }
  ]
};
