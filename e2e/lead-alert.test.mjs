// Unit test for the team-alert function (supabase/functions/website-lead/handler.ts) with a fake network.
// Run: node --experimental-strip-types e2e/lead-alert.test.mjs
import { handle } from '../supabase/functions/website-lead/handler.ts';

let pass = 0, fail = 0;
const check = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); console.log(`::error::FAIL ${m}`); } };

const ID = 'AbCdEfGhIjKlMnOpQrSt';
const doc = {
  fields: {
    source: { stringValue: 'website-quote' }, name: { stringValue: 'Ravi <b>K</b>' }, phone: { stringValue: '9876543210' },
    businessType: { stringValue: 'Shop' }, need: { stringValue: 'Online shop' }, message: { stringValue: 'Saree shop in Jayanagar' },
    utm: { mapValue: { fields: { source: { stringValue: 'facebook' }, campaign: { stringValue: 'web-nov' }, fbclid: { booleanValue: true } } } },
    createdAt: { timestampValue: '2026-11-13T04:30:00Z' },
  },
};
const calls = [];
const fakeFetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  if (String(url).includes('/documents/leads/')) {
    return String(url).includes(ID) ? new Response(JSON.stringify(doc), { status: 200 }) : new Response('{}', { status: 403 });
  }
  return new Response('{"id":"x"}', { status: 200 });
};
const env = { RESEND_API_KEY: 're_test', LEAD_ALERT_EMAIL: 'team@example.com, owner@example.com', CALLMEBOT_PHONE: '+919000000000', CALLMEBOT_APIKEY: '123', FIREBASE_API_KEY: 'k' };
const post = (body, origin = 'https://bigpayrolls.com') => new Request('https://fn/website-lead', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });

check((await handle(new Request('https://fn', { method: 'OPTIONS', headers: { origin: 'https://bigpayrolls.com' } }), env, fakeFetch)).status === 204, 'CORS preflight answered');
check((await handle(post({ id: 'bad id!' }), env, fakeFetch)).status === 400, 'rejects a malformed id');
check((await handle(post({ id: 'ZZZZZZZZZZZZZZZZZZZZ' }), env, fakeFetch)).status === 404, 'unknown or old enquiry: no alert sent');
check(!calls.some((c) => c.url.includes('resend')), 'nothing emailed for an unknown enquiry');

const res = await handle(post({ id: ID }), env, fakeFetch);
const out = await res.json();
check(res.status === 200 && out.email === true && out.whatsapp === true, `alert sent by email and WhatsApp (${JSON.stringify(out)})`);
check(res.headers.get('access-control-allow-origin') === 'https://bigpayrolls.com', 'CORS allows bigpayrolls.com');
const mail = calls.find((c) => c.url === 'https://api.resend.com/emails');
const m = JSON.parse(mail.init.body);
check(m.to.length === 2 && m.to[1] === 'owner@example.com', 'emails every address in LEAD_ALERT_EMAIL');
check(m.subject === 'New enquiry: Ravi <b>K</b> – Online shop (Shop)', `subject (${m.subject})`);
check(m.html.includes('Ravi &lt;b&gt;K&lt;/b&gt;') && !m.html.includes('<b>K</b>'), 'customer text is escaped in the email');
check(m.html.includes('tel:+919876543210') && m.html.includes('https://wa.me/919876543210'), 'email has Call and WhatsApp buttons');
check(m.text.includes('source facebook · campaign web-nov · Meta click'), 'email shows where the lead came from');
check(m.text.includes('13 Nov, 10:00 am') || m.text.includes('13 Nov, 10:00 AM'), `time shown in IST (${m.text.match(/Time: .*/)?.[0]})`);
const wa = calls.find((c) => c.url.startsWith('https://api.callmebot.com/'));
check(wa && decodeURIComponent(wa.url).includes('Ravi <b>K</b>, +91 9876543210'), 'WhatsApp text has name and number');
const again = await (await handle(post({ id: ID }), env, fakeFetch)).json();
check(again.duplicate === true, 'same enquiry is not alerted twice');
const off = await (await handle(post({ id: 'AbCdEfGhIjKlMnOpQrS2'.replace('2', 't').replace('S', 'X') }), {}, async (u) => (String(u).includes('/leads/') ? new Response(JSON.stringify(doc)) : new Response('', { status: 500 })))).json();
check(off.ok === true && off.email === false && off.whatsapp === false, 'without keys it still answers (alerts just off)');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
