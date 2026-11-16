import worker from "./index.js";
import { createHmac } from "node:crypto";
import assert from "node:assert";

const store = new Map();
const KV = {
  async get(k, type){ const v=store.get(k); if(v==null) return null; return type==="json"?JSON.parse(v):v; },
  async put(k,v){ store.set(k,v); }, async delete(k){ store.delete(k); },
  async list({prefix}){ return {keys:[...store.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})), list_complete:true}; }
};
const env = { SLOTS:KV, STRIPE_SECRET_KEY:"sk_test", STRIPE_WEBHOOK_SECRET:"whsec_x", SITE_URL:"https://x.io/booking",
              RESEND_API_KEY:"re_x", NOTIFY_EMAIL:"owner@example.com" };
const stripeCalls=[], mails=[]; let mailFail=false, n=0;
globalThis.fetch = async (url, opt) => {
  if (String(url).includes("resend")) { if(mailFail) return new Response("no",{status:500}); mails.push(JSON.parse(opt.body)); return new Response("{}",{status:200}); }
  stripeCalls.push(opt.body.toString());
  return new Response(JSON.stringify({id:"cs_"+(++n),url:"https://checkout.stripe.com/c/"+n}),{status:200});
};
const call = (path, method, body, headers={}) => worker.fetch(new Request("https://w.dev"+path,{method,body:body&&(typeof body==="string"?body:JSON.stringify(body)),headers}),env);
const base = {date:"2026-12-11",time:"14:45",minutes:30,people:2,name:"Anna",instagram:"@anna.photo",phone:"+33 6 12 34 56 78",lang:"fr",wishes:"Хочу в красном платье <3"};
const taken = async () => (await (await call("/api/config","GET")).json()).taken;
const sign = raw => { const t=Math.floor(Date.now()/1000); return {"stripe-signature":`t=${t},v1=${createHmac("sha256","whsec_x").update(`${t}.${raw}`).digest("hex")}`}; };
const hook = (type, id, slot, extra={}) => { const raw=JSON.stringify({type,data:{object:{id,payment_status:"paid",customer_details:{email:"a@b.co"},
  metadata:{slot,minutes:"30",people:"2",price:"100",deposit:"20",name:"Anna",instagram:"@anna.photo",phone:"+33 6",wishes:"Хочу в красном платье <3",...extra}}}});
  return call("/api/webhook","POST",raw,sign(raw)); };

// --- валидация ---
for (const [patch, why] of [[{instagram:""},"insta"],[{phone:"abc"},"phone"],[{time:"14:30"},"не по сетке"],[{date:"2026-12-25"},"дата"],
  [{people:0},"people 0"],[{people:99},"people 99"],[{minutes:45},"пакет"],[{minutes:60,time:"17:05"},"час не влезает"]])
  assert.equal((await call("/api/checkout","POST",{...base,...patch})).status,400,why);

// --- 30 мин: держим, письмо только после оплаты ---
let r = await call("/api/checkout","POST",base); assert.equal(r.status,200);
const dec = s => decodeURIComponent(s.replace(/\+/g," ")); const f = dec(stripeCalls[0]);
assert.ok(f.includes("unit_amount]=2000") && f.includes("[people]=2") && f.includes("locale=fr") && f.includes("Хочу в красном"));
assert.equal(mails.length,0);
assert.equal((await call("/api/checkout","POST",{...base,name:"Bob"})).status,409);
assert.equal((await call("/api/webhook","POST","{}",{"stripe-signature":"t=1,v1=bad"})).status,400);
assert.equal((await hook("checkout.session.completed","cs_1","2026-12-11 14:45")).status,200);
assert.equal(JSON.parse(store.get("slot:2026-12-11 14:45")).status,"booked");
assert.equal(mails.length,1);
const mail = mails[0]; assert.deepEqual(mail.to,["owner@example.com"]); assert.equal(mail.reply_to,"a@b.co");
for (const s of ["14:45–15:15","Количество человек: 2","@anna.photo","+33 6","красном платье <3","предоплата 20 €"]) assert.ok(mail.text.includes(s), s);
assert.ok(mail.html.includes("&lt;3"));                      // HTML экранирован
await hook("checkout.session.completed","cs_1","2026-12-11 14:45"); assert.equal(mails.length,1,"дубль события не шлёт второе письмо");

// --- 60 мин блокирует две ячейки ---
r = await call("/api/checkout","POST",{...base,time:"13:00",minutes:60,people:6}); assert.equal(r.status,200);
assert.ok(dec(stripeCalls[1]).includes("unit_amount]=2000") && dec(stripeCalls[1]).includes("60-min photoshoot"));
let t = await taken(); assert.ok(t.includes("2026-12-11 13:00") && t.includes("2026-12-11 13:35"));
assert.equal((await call("/api/checkout","POST",{...base,time:"13:35"})).status,409,"вторая ячейка часа занята");
assert.equal((await call("/api/checkout","POST",{...base,time:"14:10"})).status,200,"следующая после часа свободна");
// 60 мин, начало 13:35 -> пересекается с 14:10 (держится) -> 409
assert.equal((await call("/api/checkout","POST",{...base,time:"13:35",minutes:60})).status,409);
// не оплатил -> освободились обе
const exp = JSON.stringify({type:"checkout.session.expired",data:{object:{id:"cs_2",metadata:{slot:"2026-12-11 13:00",minutes:"60"}}}});
await call("/api/webhook","POST",exp,sign(exp));
t = await taken(); assert.ok(!t.includes("2026-12-11 13:00") && !t.includes("2026-12-11 13:35"));
assert.ok(t.includes("2026-12-11 14:45"),"оплаченная бронь не тронута");

// --- сбой почты: Stripe повторит, письмо уйдёт ---
mailFail=true; assert.equal((await hook("checkout.session.completed","cs_9","2026-12-19 13:00")).status,500);
assert.equal(JSON.parse(store.get("slot:2026-12-19 13:00")).status,"booked","слот закрыт, даже если письмо не ушло");
mailFail=false; assert.equal((await hook("checkout.session.completed","cs_9","2026-12-19 13:00")).status,200); assert.equal(mails.length,2);
console.log("ALL OK");
