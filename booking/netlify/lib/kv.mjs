// Небольшая обёртка: хранилище Netlify Blobs с тем же интерфейсом, что у Cloudflare KV
// (get / put с временем жизни / delete / list). Просроченные записи считаются удалёнными.
export function kvFromBlobs(store, now = () => Date.now()) {
  const kv = {
    async get(key, type) {
      const raw = await store.get(key, { type: "text" });
      if (raw == null) return null;
      const rec = JSON.parse(raw);
      if (rec.exp && rec.exp <= now()) { await store.delete(key); return null; }
      return type === "json" ? JSON.parse(rec.v) : rec.v;
    },
    async put(key, value, opts = {}) {
      const exp = opts.expirationTtl ? now() + opts.expirationTtl * 1000 : 0;
      await store.set(key, JSON.stringify({ v: value, exp }));
    },
    async delete(key) { await store.delete(key); },
    async list({ prefix = "" } = {}) {
      const { blobs } = await store.list({ prefix });
      const keys = [];
      for (const b of blobs) if ((await kv.get(b.key)) !== null) keys.push({ name: b.key });
      return { keys, list_complete: true };
    }
  };
  return kv;
}
