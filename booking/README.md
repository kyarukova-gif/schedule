# Запись на фотосессию (Marché de Noël, Ницца)

Страница на телефон (RU / EN / FR): число человек, 30 или 60 минут, день и время, имя, Instagram, телефон, пожелания, оплата предоплаты 20 € через Stripe.
Слот держится 30 минут, пока человек платит, и закрывается сам после оплаты. После каждой оплаты тебе приходит письмо.
Всё работает на одном сайте Netlify: и страница, и сервер.

## Что где менять
- `netlify/lib/config.mjs` — даты, часы (сейчас 12:00–16:00), цены, Instagram.
- `config.js` — список фото для карусели (`photos`). Сами фото лежат в `photos/`.
- `cgv.html` — условия и mentions légales.
- `index.html` — страница записи.

## Запуск по этапам (всё в браузере, команды не нужны)
**1. Resend (письма тебе) — необязательно.** Без него слоты блокируются так же, а все данные клиента видны в платеже в Stripe. Если хочешь письма: resend.com → зарегистрироваться → API Keys → Create → скопировать ключ (`re_...`).
**2. Netlify (сайт и сервер).** Add new site → Import an existing project → GitHub → репозиторий `schedule` → ветка `claude/charming-davinci-53ag6d` (или `main`, когда ветка будет влита) → Base directory: `booking` → Deploy.
**3. Stripe (оплата).**
  - Developers → API keys → Secret key → скопировать (`sk_live_...`; для пробы `sk_test_...` в тестовом режиме).
  - Developers → Webhooks → Add endpoint → адрес `https://ВАШ-САЙТ.netlify.app/api/webhook` → события `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed` → скопировать Signing secret (`whsec_...`).
**4. Ключи в Netlify.** Site configuration → Environment variables → добавить:
  - `STRIPE_SECRET_KEY` — ключ из шага 3
  - `STRIPE_WEBHOOK_SECRET` — whsec из шага 3
  - `RESEND_API_KEY` и `NOTIFY_EMAIL` (твоя почта) — только если делала шаг 1
  Затем Deploys → Trigger deploy → Deploy site.
**5. Проба.** В Stripe включить тестовый режим (ключи `sk_test_`, отдельный webhook), записаться на пробный слот картой `4242 4242 4242 4242`. Должны прийти письмо тебе и закрытый слот на странице. После этого заменить ключи на боевые и повторить пункт 4.
**6. Instagram.** Адрес сайта Netlify вставить в «Ссылку в профиле».

## Как это работает
- Слот и его удержание хранятся в Netlify Blobs. Оплаченная бронь остаётся навсегда, неоплаченная освобождается через 30 минут.
- Час занимает две ячейки сетки: следующая съёмка начинается на 10 минут позже, а не на 5.
- Данные клиента (имя, Instagram, телефон, число человек, пожелания) видны в платеже в Stripe (Metadata) и приходят в письме.

## Проверка кода
`node netlify/test.mjs` — проверка логики записи (слоты, час, оплата, письмо, повторы Stripe).
