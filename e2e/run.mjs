// End-to-end test of the client + admin flow against the Firebase emulators.
// Run with: firebase emulators:exec --only auth,firestore --project demo-bp "node e2e/run.mjs"
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';
const FS = 'http://127.0.0.1:8080/v1/projects/demo-bp/databases/(default)/documents';
const OUT = 'e2e/shots';
mkdirSync(OUT, { recursive: true });
let step = 0;
const results = [];
const ok = (m) => { results.push(['PASS', m]); console.log('PASS', m); };
const bad = (m) => { results.push(['FAIL', m]); console.log('FAIL', m); };
const shot = (page, name) => page.screenshot({ path: `${OUT}/${String(++step).padStart(2, '0')}-${name}.png`, fullPage: true });

async function signUp(page, { name, company, phone, email, interest }) {
  await page.goto(`${BASE}/signup/`);
  await page.fill('#name', name);
  await page.fill('#company', company);
  await page.fill('#phone', phone);
  await page.fill('#email', email);
  await page.fill('#password', 'testpass123');
  await page.selectOption('#size', '11–50');
  await page.getByRole('button', { name: interest }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/get-started/', { timeout: 20000 });
}

async function setRole(email, role) {
  const q = await fetch(`${FS}:runQuery`, {
    method: 'POST',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'users' }], where: { fieldFilter: { field: { fieldPath: 'email' }, op: 'EQUAL', value: { stringValue: email } } } } }),
  }).then((r) => r.json());
  const name = q.find((x) => x.document)?.document?.name;
  if (!name) throw new Error('admin profile not found');
  const res = await fetch(`http://127.0.0.1:8080/v1/${name}?updateMask.fieldPaths=role`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { role: { stringValue: role } } }),
  });
  if (!res.ok) throw new Error('could not set role ' + res.status);
}

const browser = await chromium.launch();
const errors = [];
const mk = async () => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('dialog', (d) => d.accept());
  return page;
};

try {
  // ---- Client signs up and sends a request
  const client = await mk();
  await signUp(client, { name: 'Ravi Kumar', company: 'Spice Box Kitchen', phone: '9876543210', email: 'ravi@test.com', interest: 'Tech build' });
  ok('client signed up and landed on get-started');
  const next = () => client.getByRole('button', { name: /^(Next|Skip for now)$/ }).click();
  await client.getByRole('button', { name: /^Website/ }).click(); await next();
  await client.getByRole('button', { name: /^Hotel and restaurant/ }).click(); await next();
  await client.getByRole('button', { name: 'Cloud kitchen' }).click(); await next();
  await client.getByRole('button', { name: 'Online food ordering' }).click(); await next();
  await client.getByRole('button', { name: '₹40,000 – 75,000' }).click();
  await next();
  await client.locator('fieldset', { hasText: 'Pick a day' }).getByRole('button').first().click();
  await client.getByRole('button', { name: '12:00 PM' }).click();
  await client.getByRole('button', { name: 'Book my call' }).click();
  await client.getByText('Request received').waitFor({ timeout: 15000 });
  ok('client sent a request');
  await shot(client, 'client-request-sent');

  // Client must not get into admin
  await client.goto(`${BASE}/admin/`);
  await client.getByText('Staff only').waitFor({ timeout: 15000 });
  ok('client blocked from admin');
  await shot(client, 'client-blocked-from-admin');

  // ---- Admin signs up, gets admin role
  const admin = await mk();
  await signUp(admin, { name: 'Owner Admin', company: 'Big Payrolls', phone: '9000000001', email: 'owner@test.com', interest: 'HR & payroll' });
  await setRole('owner@test.com', 'admin');
  await admin.goto(`${BASE}/admin/`);
  await admin.getByText('Spice Box Kitchen').first().waitFor({ timeout: 15000 });
  ok('admin sees the new request in the list');
  await shot(admin, 'admin-requests');

  // Payment settings
  await admin.goto(`${BASE}/admin/settings/`);
  await admin.fill('#upi', 'bigpayrolls@okhdfcbank');
  await admin.fill('#acno', '50200012345678');
  await admin.fill('#ifsc', 'HDFC0001234');
  await admin.fill('#bank', 'HDFC Bank');
  await admin.fill('#iemail', 'accounts@bigpayrolls.com');
  await admin.getByRole('button', { name: 'Save settings' }).click();
  await admin.getByText('Saved. Clients will see', { exact: false }).waitFor({ timeout: 15000 });
  ok('admin saved UPI and bank details');
  await shot(admin, 'admin-settings');

  await admin.goto(`${BASE}/admin/`);
  await admin.getByText('Spice Box Kitchen').first().click();
  await admin.getByRole('heading', { name: 'Spice Box Kitchen' }).waitFor({ timeout: 15000 });
  ok('admin opened request detail');

  // Status update with message
  await admin.selectOption('#status', 'call_scheduled');
  await admin.fill('#upd', 'Thanks Ravi! We will call you at the booked time.');
  await admin.getByRole('button', { name: 'Send update' }).click();
  await admin.getByText('Sent. The client sees it on their dashboard.').waitFor({ timeout: 15000 });
  ok('admin posted a status update');

  // Quote
  await admin.fill('#qa-0', '35000');
  await admin.getByRole('button', { name: '+ Add item' }).click();
  await admin.fill('#qi-1', 'Domain, hosting and setup');
  await admin.fill('#qa-1', '5000');
  await admin.fill('#qt', '12–15 working days');
  await admin.fill('#qn', 'Includes ordering website, admin dashboard and WhatsApp alerts. GST extra.');
  await admin.getByLabel(/Maintenance charges/).check();
  await admin.fill('#ma', '1500');
  await admin.getByRole('button', { name: /Send quote to client/ }).click();
  await admin.getByText('Quote sent.', { exact: false }).waitFor({ timeout: 15000 });
  ok('admin sent quote of ₹40,000');
  await shot(admin, 'admin-quote-sent');

  // ---- Client sees quote and accepts
  await client.goto(`${BASE}/dashboard/`);
  await client.getByText('Your quote').waitFor({ timeout: 15000 });
  (await client.getByText('₹40,000').count()) > 0 ? ok('client sees quote total') : bad('client quote total missing');
  (await client.getByText('Thanks Ravi!').count()) > 0 ? ok('client sees admin update') : bad('client update missing');
  (await client.getByText('₹1,500/month').count()) > 0 ? ok('client sees monthly maintenance') : bad('client maintenance missing');
  await shot(client, 'client-sees-quote');
  await client.getByRole('button', { name: 'Accept quote' }).click();
  await client.getByText('Advance due now').waitFor({ timeout: 15000 });
  ok('client accepted quote and sees advance due');
  await shot(client, 'client-accepted');
  (await client.getByAltText(/UPI QR code/).count()) > 0 ? ok('client sees UPI QR code') : bad('UPI QR missing');
  (await client.getByText('bigpayrolls@okhdfcbank').count()) > 0 ? ok('client sees UPI ID') : bad('UPI ID missing');

  // Client reports a payment
  await client.getByRole('button', { name: 'I have paid' }).click();
  await client.locator('input[id^="putr-"]').fill('UTR987654321');
  await client.getByRole('button', { name: 'Send to Big Payrolls' }).click();
  await client.getByText('We received your note', { exact: false }).waitFor({ timeout: 15000 });
  ok('client submitted payment with UTR');
  await shot(client, 'client-reported-payment');

  // ---- Admin records payment
  await admin.reload();
  await admin.getByText('Client accepted the quote').waitFor({ timeout: 15000 });
  ok('admin sees client accepted');
  await admin.getByText('Client says they paid', { exact: false }).waitFor({ timeout: 15000 });
  ok('admin sees payment to verify');
  await admin.getByRole('button', { name: 'Confirm received' }).click();
  await admin.getByText('UTR987654321').first().waitFor({ timeout: 15000 });
  ok('admin confirmed ₹20,000 payment');

  // Invoice
  await admin.getByRole('button', { name: 'Create invoice' }).click();
  await admin.getByText(/Invoice BP\/\d{4}-\d{2}\/0001 created/).waitFor({ timeout: 15000 });
  ok('admin created invoice BP/…/0001');
  await admin.fill('#plink', 'https://rzp.io/l/test123');
  await admin.getByRole('button', { name: 'Save link' }).click();
  await admin.getByText('Payment link saved', { exact: false }).waitFor({ timeout: 15000 });
  ok('admin saved Razorpay link');
  await admin.fill('#notes', 'Prefers WhatsApp. Menu Excel coming Friday.');
  await admin.getByRole('button', { name: 'Save notes' }).click();
  await admin.getByText('Saved.').waitFor({ timeout: 15000 });
  ok('admin saved private team notes');
  await shot(admin, 'admin-payment-recorded');

  await admin.goto(`${BASE}/admin/`);
  await admin.getByText('₹20,000').first().waitFor({ timeout: 15000 });
  ok('admin list shows payment');
  await shot(admin, 'admin-list-after-payment');
  await admin.goto(`${BASE}/admin/clients/`);
  await admin.getByText('Spice Box Kitchen').first().waitFor({ timeout: 15000 });
  ok('admin clients page lists the client');
  await shot(admin, 'admin-clients');

  // ---- Client final state
  await client.goto(`${BASE}/dashboard/`);
  await client.getByText('Advance paid').first().waitFor({ timeout: 15000 });
  (await client.getByText('Pay online (card, UPI, netbanking)').count()) > 0 ? ok('client sees Pay online button') : bad('Pay online button missing');
  await client.getByRole('link', { name: /Invoice BP\// }).click();
  await client.getByRole('heading', { name: 'INVOICE' }).waitFor({ timeout: 15000 });
  ok('client opened invoice');
  await shot(client, 'client-invoice');
  const [dl] = await Promise.all([client.waitForEvent('download', { timeout: 30000 }), client.getByRole('button', { name: 'Download PDF' }).click()]);
  const pdfPath = `${OUT}/invoice.pdf`;
  await dl.saveAs(pdfPath);
  const head = (await import('node:fs')).readFileSync(pdfPath).subarray(0, 5).toString();
  head === '%PDF-' && dl.suggestedFilename().startsWith('Invoice-BP-') ? ok('invoice PDF downloaded: ' + dl.suggestedFilename()) : bad('invoice PDF invalid');
  await client.goto(`${BASE}/dashboard/`);
  await client.getByText('Advance paid').first().waitFor({ timeout: 15000 });
  (await client.getByText('Prefers WhatsApp').count()) === 0 ? ok('team notes hidden from client') : bad('team notes visible to client!');
  ok('client sees Advance paid');
  await shot(client, 'client-final');

  // Mobile admin view
  await client.setViewportSize({ width: 390, height: 844 });
  await client.reload();
  await client.getByText('Advance paid').first().waitFor({ timeout: 15000 });
  await shot(client, 'client-mobile');
  await admin.setViewportSize({ width: 390, height: 844 });
  await admin.goto(`${BASE}/admin/`);
  await admin.getByText('Spice Box Kitchen').first().waitFor({ timeout: 15000 });
  await shot(admin, 'admin-mobile');
} catch (e) {
  bad('flow stopped: ' + e.message);
}

if (errors.length) errors.forEach((e) => bad('page error: ' + e));
await browser.close();
const failed = results.filter((r) => r[0] === 'FAIL');
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
for (const f of failed) console.log(`::error::${f[1]}`);
if (failed.length) process.exit(1);
console.log(`::notice::All ${results.length} end-to-end checks passed`);
