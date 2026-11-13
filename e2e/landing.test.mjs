// Browser test for the ad landing page (/website-quote) and the short sign-up, on phone screens.
// CI: runs inside `firebase emulators:exec --only firestore --project demo-bp` (enquiries really saved).
// Local without emulators: MOCK_FS=1 fakes Firestore.
import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const MOCK = process.env.MOCK_FS === '1';
const PROJECT = process.env.FS_PROJECT || 'demo-bp';
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const OUT = 'e2e/shots';
mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const check = (c, m) => { if (c) { pass++; console.log('PASS', m); } else { fail++; console.log('FAIL', m); console.log(`::error::FAIL ${m}`); } };

const browser = await chromium.launch();

async function phone(device) {
  const ctx = await browser.newContext({ ...devices[device] });
  const page = await ctx.newPage();
  const seen = { commits: [], alerts: [], bytes: 0 };
  await page.route('**/connect.facebook.net/**', (r) => r.abort()); // keep the queue so we can read it
  await page.route('**/functions/v1/website-lead', async (r) => {
    seen.alerts.push(JSON.parse(r.request().postData() || '{}'));
    await r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"ok":true}' });
  });
  await page.route('**/documents:commit*', async (r) => {
    seen.commits.push(JSON.parse(r.request().postData() || '{}'));
    if (MOCK) return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"writeResults":[{}]}' });
    return r.continue();
  });
  page.on('response', async (res) => { try { seen.bytes += (await res.body()).length; } catch { /* aborted */ } });
  return { ctx, page, seen };
}
const fbqCalls = (page) => page.evaluate(() => (window.fbq?.queue ?? []).map((a) => Array.from(a)));
const field = (commit, k) => commit.writes[0].update.fields[k];

// ---------------------------------------------------------------- 1. ad visitor who allows cookies
{
  const { ctx, page, seen } = await phone('Pixel 5');
  const t0 = Date.now();
  await page.goto(`${BASE}/website-quote/?utm_source=facebook&utm_medium=paid&utm_campaign=web-nov&utm_content=ad1&fbclid=abc`, { waitUntil: 'load' });
  const loadMs = Date.now() - t0;
  check(await page.getByRole('heading', { level: 1 }).innerText().then((t) => t.includes('Business website from ₹6,999') && t.includes('ready in 7 days')), 'headline shows price and 7 days');
  check(await page.getByText('Free discovery call.').isVisible(), 'free discovery call shown');
  check(await page.locator('ol li').filter({ hasText: 'Pay & track' }).count() > 0, '4-step box shown (Tell us → Free call → Quote → Pay & track)');
  check(!(await page.evaluate(() => typeof window.fbq)).includes('function'), 'no Meta Pixel before the visitor allows it');
  check(await page.getByRole('region', { name: 'Cookie choice' }).isVisible(), 'cookie banner asks first');
  await page.screenshot({ path: `${OUT}/lp-01-phone-top.png` });
  await page.screenshot({ path: `${OUT}/lp-02-phone-full.png`, fullPage: true });
  await page.getByRole('button', { name: 'Allow' }).click();
  const afterAllow = await fbqCalls(page);
  check(afterAllow.some((a) => a[0] === 'init' && a[1] === '1677610107402565') && afterAllow.some((a) => a[0] === 'track' && a[1] === 'PageView'), 'after Allow: Pixel 1677610107402565 loads with PageView');

  await page.getByRole('button', { name: 'Get my free quote' }).first().click();
  check(await page.locator('#q-error').innerText().then((t) => t.includes('name')), 'empty form: asks for the name');
  await page.fill('#q-name', 'Test Lead Ravi');
  await page.fill('#q-phone', '12345');
  await page.getByRole('button', { name: 'Get my free quote' }).first().click();
  check(await page.locator('#q-error').innerText().then((t) => t.includes('10-digit')), 'bad number refused');
  await page.fill('#q-phone', '98765 43210');
  await page.locator('#quote label').filter({ hasText: /^Restaurant$/ }).click();
  await page.locator('#quote label').filter({ hasText: /^Online shop$/ }).click();
  await page.fill('#q-msg', 'Biryani place in HSR, want online orders');
  await page.getByRole('button', { name: 'Get my free quote' }).first().click();
  check(await page.locator('#q-error').innerText().then((t) => t.includes('Terms')), 'consent checkbox required');
  check(seen.commits.length === 0, 'nothing saved before the form is valid');
  const before = (await fbqCalls(page)).filter((a) => a[1] === 'Lead').length;
  check(before === 0, 'no Lead event before submitting');
  await page.getByRole('checkbox').check();
  await page.screenshot({ path: `${OUT}/lp-03-filled.png`, fullPage: true });
  await page.getByRole('button', { name: 'Get my free quote' }).first().click();
  await page.getByText("Thanks! We'll call you within 24 hours.").waitFor({ timeout: 15000 });
  check(true, 'thank-you message shows');
  await page.screenshot({ path: `${OUT}/lp-04-thanks.png` });
  const c = seen.commits[0];
  const id = c.writes[0].update.name.split('/').pop();
  check(field(c, 'name').stringValue === 'Test Lead Ravi' && field(c, 'phone').stringValue === '9876543210', 'saved name and 10-digit mobile');
  check(field(c, 'businessType').stringValue === 'Restaurant' && field(c, 'need').stringValue === 'Online shop', 'saved business type and need');
  const utm = field(c, 'utm').mapValue.fields;
  check(utm.source.stringValue === 'facebook' && utm.medium.stringValue === 'paid' && utm.campaign.stringValue === 'web-nov' && utm.content.stringValue === 'ad1' && utm.fbclid.booleanValue === true, 'saved utm_source/medium/campaign/content and Meta click');
  check(c.writes[0].updateTransforms[0].setToServerValue === 'REQUEST_TIME', 'time is set by the server');
  check(seen.alerts.length === 1 && seen.alerts[0].id === id, 'team alert requested for this enquiry');
  const lead = (await fbqCalls(page)).filter((a) => a[1] === 'Lead');
  check(lead.length === 1 && lead[0][3]?.eventID === id, 'Lead event fired once, after saving');
  check(!JSON.stringify(lead).includes('9876543210') && !JSON.stringify(lead).includes('Ravi'), 'no name or number sent to Meta');
  if (!MOCK) {
    const doc = await fetch(`${FS}/leads/${id}`, { headers: { Authorization: 'Bearer owner' } }).then((r) => r.json());
    check(doc.fields?.status?.stringValue === 'new' && !!doc.fields?.createdAt?.timestampValue, 'enquiry stored in Firestore as "new" with time');
  }
  console.log(`   landing page: ${(seen.bytes / 1024).toFixed(0)} KB downloaded, load event in ${loadMs} ms (local)`);
  check(seen.bytes < 450 * 1024, `landing page download is small (${(seen.bytes / 1024).toFixed(0)} KB)`);
  await ctx.close();
}

// ---------------------------------------------------------------- 2. visitor who says no to cookies (iPhone)
{
  const { ctx, page, seen } = await phone('iPhone 13');
  await page.goto(`${BASE}/website-quote/`);
  await page.getByRole('button', { name: 'No thanks' }).click();
  await page.fill('#q-name', 'No Cookie Priya');
  await page.fill('#q-phone', '+91 9123456789');
  await page.locator('#quote label').filter({ hasText: /^Clinic$/ }).click();
  await page.locator('#quote label').filter({ hasText: /^Not sure$/ }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Get my free quote' }).first().click();
  await page.getByText("Thanks! We'll call you within 24 hours.").waitFor({ timeout: 15000 });
  check(seen.commits.length === 1 && field(seen.commits[0], 'phone').stringValue === '9123456789', 'iPhone: +91 number saved as 10 digits');
  check((await page.evaluate(() => typeof window.fbq)) === 'undefined', 'No thanks: Pixel never loads, no Lead event');
  check(!field(seen.commits[0], 'utm').mapValue.fields.source, 'direct visit: no made-up UTM');
  await page.reload();
  check(!(await page.getByRole('region', { name: 'Cookie choice' }).isVisible()), 'cookie choice remembered');
  await page.screenshot({ path: `${OUT}/lp-05-iphone.png` });
  await ctx.close();
}

// ---------------------------------------------------------------- 3. sign-up without email or password
{
  const { ctx, page, seen } = await phone('Pixel 5');
  await page.goto(`${BASE}/signup/?interest=tech-build`);
  await page.getByRole('button', { name: 'Website / App' }).waitFor();
  check((await page.getByRole('button', { name: 'Website / App' }).getAttribute('aria-pressed')) === 'true', '?interest=tech-build pre-selects "Website / App"');
  check((await page.getByText('Tech build').count()) === 0, '"Tech build" renamed');
  check(await page.getByText('Email (optional)').isVisible() && await page.getByText('(optional, 8+ characters)').isVisible(), 'email and password marked optional');
  await page.fill('#name', 'Signup Sneha');
  await page.fill('#company', 'Sneha Salon');
  await page.fill('#phone', '9988776655');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Send my details' }).click();
  await page.getByText("Thanks! We'll call you within 24 hours.").waitFor({ timeout: 15000 });
  const c = seen.commits[0];
  check(field(c, 'source').stringValue === 'signup' && field(c, 'company').stringValue === 'Sneha Salon' && field(c, 'interests').arrayValue.values[0].stringValue === 'tech', 'saved as an enquiry with company and interest');
  check(!field(c, 'email'), 'no email needed');
  await page.screenshot({ path: `${OUT}/lp-06-signup-thanks.png` });
  await ctx.close();
}

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
