# Запись на фотосессию (автоблокировка слотов)

Страница для телефона (RU / EN / FR): день → время → имя, Instagram, телефон → оплата 20 € в Stripe.
Слот держится 30 минут, пока человек платит, и закрывается сам после оплаты. Если не оплатил, слот освобождается.
Instagram и телефон клиента видны в платеже в Stripe (Metadata).

## Файлы
- `index.html` — страница записи.
- `config.js` — только адрес сервера (`apiUrl`).
- `worker/config.js` — **даты, часы, цены, Instagram** (меняешь тут).
- `worker/index.js` — сервер (Cloudflare Worker, бесплатный тариф).
- `worker/test.mjs` — проверка логики: `node worker/test.mjs`.

## Запуск
1. **Cloudflare**: бесплатный аккаунт на cloudflare.com. В папке `worker/`:
   ```
   npx wrangler login
   npx wrangler kv namespace create SLOTS      # вставь id в wrangler.toml
   npx wrangler secret put STRIPE_SECRET_KEY    # sk_live_... из Stripe → Developers → API keys
   npx wrangler deploy                          # напечатает адрес https://photo-booking.<имя>.workers.dev
   ```
2. **Stripe webhook**: Developers → Webhooks → Add endpoint.
   - URL: `https://photo-booking.<имя>.workers.dev/api/webhook`
   - События: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`.
   - Скопируй Signing secret `whsec_...` и выполни `npx wrangler secret put STRIPE_WEBHOOK_SECRET`.
3. **Адреса**: в `wrangler.toml` пропиши `SITE_URL` и `ALLOWED_ORIGIN` (где лежит страница), в `booking/config.js` пропиши `apiUrl`. Затем снова `npx wrangler deploy`.
4. **Страница**: GitHub Pages (ветка main, корень). Эту ссылку вставь в Instagram.
5. Проверь одним тестовым платежом: сначала с ключами `sk_test_` и картой `4242 4242 4242 4242`, потом переключи на боевые.

## Письма о записях
После каждой **оплаченной** брони тебе приходит письмо: дата и время, длительность, количество человек, имя, Instagram, телефон, email клиента, выбранное состояние, МАК-карты, пожелания.
Отправка через Resend (бесплатно, 100 писем в день):
1. Зарегистрируйся на resend.com, создай API key.
2. `npx wrangler secret put RESEND_API_KEY`
3. В `wrangler.toml` впиши свою почту в `NOTIFY_EMAIL`, затем `npx wrangler deploy`.

Пока у Resend не подключён свой домен, он отправляет только на почту, с которой ты зарегистрировалась. Для тебя этого достаточно. Если письмо не ушло, Stripe повторит попытку сам. Бронь при этом уже сохранена.

## Тарифы
В `worker/config.js` в `packages`: 30 мин за 100 € и 60 мин за 190 €, предоплата у обоих 20 €. С 4 человек страница советует взять час. Час занимает две ячейки сетки, поэтому после него следующая съёмка начинается на 10 минут позже, а не на 5.

Слоты хранятся в Cloudflare KV. Брони (имя, Instagram, телефон) лежат там же и в Stripe.
