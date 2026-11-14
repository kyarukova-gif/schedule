import worker from "./index.js";
import { createHmac } from "node:crypto";
import assert from "node:assert";

const store = new Map();
const KV = {
  async get(k, type){ const v=store.get(k); if(v==null) return null; return type==="json"?JSON.parse(v):v; },
  async put(k,v){ store.set(k,v); }, async delete(k){ store.delete(k); },
  async list({prefix}){ return {keys:[...store.keys()].filter(k=>k.startsWith(prefix)).map(name=>({name})), list_complete:true}; }
};
const env = { SLOTS:KV, STRIPE_SECRET_KEY:"sk_test", STRIPE_WEBHOOK_SECRET:"whsec_x", SITE_URL:"https://x.io/booking" };
let stripeCalls=[];
globalThis.fetch = async (url, opt) => { stripeCalls.push(opt.body.toString());
  return new Response(JSON.stringify({id:"cs_"+stripeCalls.length,url:"https://checkout.stripe.com/c/"+stripeCalls.length}),{status:200}); };

const call = (path, method, body, headers={}) => worker.fetch(new Request("https://w.dev"+path,{method,body:body&&(typeof body==="string"?body:JSON.stringify(body)),headers}),env);
const person = {date:"2026-12-12",time:"14:45",name:"Anna",instagram:"@anna.photo",phone:"+49 170 1234567",lang:"ru"};
const webhook = (type, sessionId, paid=true) => {
  const raw = JSON.stringify({type,data:{object:{id:sessionId,payment_status:paid?"paid":"unpaid",metadata:{slot:"2026-12-12 14:45",name:"Anna",instagram:"@anna.photo",phone:"+49 170 1234567"},customer_details:{email:"a@b.co"}}}});
  const t=Math.floor(Date.now()/1000), sig=createHmac("sha256","whsec_x").update(`${t}.${raw}`).digest("hex");
  return call("/api/webhook","POST",raw,{"stripe-signature":`t=${t},v1=${sig}`});
};

// валидация
assert.equal((await call("/api/checkout","POST",{...person,instagram:""})).status,400);
assert.equal((await call("/api/checkout","POST",{...person,phone:"abc"})).status,400);
assert.equal((await call("/api/checkout","POST",{...person,time:"14:30"})).status,400);
assert.equal((await call("/api/checkout","POST",{...person,date:"2026-12-25"})).status,400);

// 1. слот держится
let r = await call("/api/checkout","POST",{...person,lang:"fr",moods:["bold","hack","light"],mac:true}); assert.equal(r.status,200);
assert.match((await r.json()).url,/checkout.stripe.com/);
assert.match(stripeCalls[0],/unit_amount%5D=2000|unit_amount\]=2000/);
assert.ok(stripeCalls[0].includes("anna.photo") && !stripeCalls[0].includes("%40%40"));
assert.ok(/mood%5D=bold%2Clight|mood\]=bold,light/.test(stripeCalls[0]),stripeCalls[0]); assert.ok(/mac_cards%5D=yes/.test(stripeCalls[0])); assert.ok(/locale=fr/.test(stripeCalls[0]));
// 2. второй человек на тот же слот -> 409
assert.equal((await call("/api/checkout","POST",{...person,name:"Bob"})).status,409);
assert.ok((await (await call("/api/config","GET")).json()).taken.includes("2026-12-12 14:45"));
// 3. без подписи вебхук не принимается
assert.equal((await call("/api/webhook","POST","{}",{"stripe-signature":"t=1,v1=bad"})).status,400);
// 4. оплата -> слот закрыт навсегда
assert.equal((await webhook("checkout.session.completed","cs_1")).status,200);
assert.equal(JSON.parse(store.get("slot:2026-12-12 14:45")).status,"booked");
// 5. другой слот: не оплатил -> expired освобождает
r = await call("/api/checkout","POST",{...person,time:"15:20"}); assert.equal(r.status,200);
const raw2=(type)=>{ const raw=JSON.stringify({type,data:{object:{id:"cs_2",metadata:{slot:"2026-12-12 15:20"}}}}); const t=Math.floor(Date.now()/1000);
  return call("/api/webhook","POST",raw,{"stripe-signature":`t=${t},v1=${createHmac("sha256","whsec_x").update(`${t}.${raw}`).digest("hex")}`}); };
await raw2("checkout.session.expired");
assert.equal(store.has("slot:2026-12-12 15:20"),false);
// 6. expired не должен снимать чужую оплаченную бронь
await raw2("checkout.session.expired"); assert.equal(store.has("slot:2026-12-12 14:45"),true);
console.log("ALL OK");
