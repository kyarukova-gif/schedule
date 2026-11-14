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

Слоты хранятся в Cloudflare KV. Брони (имя, Instagram, телефон) лежат там же и в Stripe.
