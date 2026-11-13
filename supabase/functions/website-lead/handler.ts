/**
 * Team alert for a new website enquiry.
 *
 * The browser saves the enquiry to Firestore first, then posts { id } here. We read that
 * enquiry back from Firestore (allowed only for 15 minutes after it was created), so the alert
 * always shows exactly what was saved and this endpoint cannot be used to send made-up text.
 * Then: email via Resend, and WhatsApp via CallMeBot and/or the WhatsApp Cloud API if set up.
 */

export type Env = Record<string, string | undefined>;
type Fetch = typeof fetch;

export type Lead = {
  id: string;
  source: string;
  name: string;
  phone: string;
  businessType?: string;
  need?: string;
  message?: string;
  company?: string;
  email?: string;
  companySize?: string;
  interests?: string[];
  utm?: Record<string, string | boolean>;
  createdAt?: string;
};

const ORIGINS = [
  'https://bigpayrolls.com',
  'https://www.bigpayrolls.com',
  'https://bigpayrolls-6ec80.web.app',
  'https://bigpayrolls-6ec80.firebaseapp.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

const sent = new Map<string, number>();

function cors(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin && ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info',
    Vary: 'Origin',
  };
}

const json = (body: unknown, status: number, headers: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

// ---------------------------------------------------------------- Firestore
type FsV = { stringValue?: string; booleanValue?: boolean; timestampValue?: string; mapValue?: { fields?: Record<string, FsV> }; arrayValue?: { values?: FsV[] } };

function fromFs(v: FsV): unknown {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.mapValue) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, fromFs(x)]));
  if (v.arrayValue) return (v.arrayValue.values ?? []).map(fromFs);
  return undefined;
}

export async function readLead(env: Env, id: string, fetcher: Fetch): Promise<Lead | null> {
  const project = env.FIREBASE_PROJECT_ID || 'bigpayrolls-6ec80';
  const base = env.FIRESTORE_BASE || 'https://firestore.googleapis.com/v1';
  const key = env.FIREBASE_API_KEY ? `?key=${encodeURIComponent(env.FIREBASE_API_KEY)}` : '';
  const r = await fetcher(`${base}/projects/${project}/databases/(default)/documents/leads/${id}${key}`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) return null;
  const doc = (await r.json()) as { fields?: Record<string, FsV> };
  const f = Object.fromEntries(Object.entries(doc.fields ?? {}).map(([k, v]) => [k, fromFs(v)])) as Omit<Lead, 'id'>;
  if (typeof f.name !== 'string' || typeof f.phone !== 'string') return null;
  return { id, ...f };
}

// ---------------------------------------------------------------- message text
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export function istTime(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
}

function utmLine(l: Lead): string {
  const u = l.utm ?? {};
  const parts = [u.source && `source ${u.source}`, u.medium && `medium ${u.medium}`, u.campaign && `campaign ${u.campaign}`, u.content && `ad ${u.content}`, u.fbclid && 'Meta click'].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Direct / not known';
}

export function summary(l: Lead): { subject: string; rows: [string, string][]; short: string } {
  const what = l.need || (l.interests?.length ? l.interests.join(', ') : 'Enquiry');
  const rows: [string, string][] = [
    ['Name', l.name],
    ['Mobile', `+91 ${l.phone}`],
    ...(l.businessType ? [['Business', l.businessType] as [string, string]] : []),
    ['Needs', what],
    ...(l.company ? [['Company', l.company] as [string, string]] : []),
    ...(l.email ? [['Email', l.email] as [string, string]] : []),
    ...(l.companySize ? [['Employees', l.companySize] as [string, string]] : []),
    ...(l.message ? [['Message', l.message] as [string, string]] : []),
    ['Came from', utmLine(l)],
    ['Form', l.source === 'signup' ? 'Sign-up page (no password)' : 'Website quote page'],
    ['Time', istTime(l.createdAt)],
  ];
  const subject = `New enquiry: ${l.name} – ${what}${l.businessType ? ` (${l.businessType})` : ''}`;
  const short = `New Big Payrolls enquiry\n${l.name}, +91 ${l.phone}\n${l.businessType ? `${l.businessType} – ` : ''}${what}${l.message ? `\n"${l.message.slice(0, 200)}"` : ''}\nCall within 24 hours.`;
  return { subject, rows, short };
}

// ---------------------------------------------------------------- channels
export async function sendEmail(env: Env, l: Lead, fetcher: Fetch): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.LEAD_ALERT_EMAIL) return false;
  const { subject, rows } = summary(l);
  const wa = `https://wa.me/91${l.phone}?text=${encodeURIComponent(`Hi ${l.name}, this is Big Payrolls. Thanks for your enquiry about a website.`)}`;
  const admin = `${(env.SITE_URL || 'https://bigpayrolls.com').replace(/\/+$/, '')}/admin/leads/`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#141414">
<h2 style="margin:0 0 12px">New website enquiry</h2>
<table style="border-collapse:collapse;width:100%;font-size:15px">${rows
    .map(([k, v]) => `<tr><td style="padding:6px 10px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0">${esc(v)}</td></tr>`)
    .join('')}</table>
<p style="margin:18px 0">
<a href="tel:+91${l.phone}" style="background:#141414;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:bold;margin-right:8px">Call</a>
<a href="${wa}" style="background:#25D366;color:#fff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:bold;margin-right:8px">WhatsApp</a>
<a href="${admin}" style="color:#141414">Open in admin</a></p>
<p style="color:#666;font-size:13px">Promise on the page: we call within 24 hours.</p></div>`;
  const text = `${rows.map(([k, v]) => `${k}: ${v}`).join('\n')}\n\nCall: tel:+91${l.phone}\nWhatsApp: ${wa}\nAdmin: ${admin}`;
  const r = await fetcher('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.LEAD_ALERT_FROM || 'Big Payrolls Leads <leads@bigpayrolls.com>',
      to: env.LEAD_ALERT_EMAIL.split(',').map((s) => s.trim()).filter(Boolean),
      subject,
      html,
      text,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!r.ok) console.warn('lead email failed', r.status, await r.text().catch(() => ''));
  return r.ok;
}

/** WhatsApp to the team's own number through CallMeBot (free; one-time opt-in on that phone). */
export async function sendCallMeBot(env: Env, l: Lead, fetcher: Fetch): Promise<boolean> {
  if (!env.CALLMEBOT_PHONE || !env.CALLMEBOT_APIKEY) return false;
  let ok = true;
  const phones = env.CALLMEBOT_PHONE.split(',').map((s) => s.trim()).filter(Boolean);
  const keys = env.CALLMEBOT_APIKEY.split(',').map((s) => s.trim());
  for (const [i, phone] of phones.entries()) {
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(summary(l).short)}&apikey=${encodeURIComponent(keys[i] ?? keys[0])}`;
    const r = await fetcher(url, { signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (!r?.ok) {
      ok = false;
      console.warn('CallMeBot WhatsApp failed', r?.status);
    }
  }
  return ok;
}

/**
 * WhatsApp Cloud API (Meta) template message. The approved template needs 4 body
 * variables: {{1}} name, {{2}} mobile, {{3}} business type, {{4}} what they need.
 */
export async function sendWhatsAppCloud(env: Env, l: Lead, fetcher: Fetch): Promise<boolean> {
  if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID || !env.WHATSAPP_TO || !env.WHATSAPP_TEMPLATE) return false;
  const params = [l.name, `+91 ${l.phone}`, l.businessType || '-', l.need || l.interests?.join(', ') || 'Enquiry'].map((t) => ({ type: 'text', text: t.slice(0, 200) }));
  let ok = true;
  for (const to of env.WHATSAPP_TO.split(',').map((s) => s.trim()).filter(Boolean)) {
    const r = await fetcher(`https://graph.facebook.com/v21.0/${encodeURIComponent(env.WHATSAPP_PHONE_ID)}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.WHATSAPP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: { name: env.WHATSAPP_TEMPLATE, language: { code: env.WHATSAPP_TEMPLATE_LANG || 'en' }, components: [{ type: 'body', parameters: params }] },
      }),
      signal: AbortSignal.timeout(10000),
    }).catch(() => null);
    if (!r?.ok) {
      ok = false;
      console.warn('WhatsApp Cloud API failed', r?.status, await r?.text().catch(() => ''));
    }
  }
  return ok;
}

// ---------------------------------------------------------------- entry
export async function handle(req: Request, env: Env, fetcher: Fetch = fetch): Promise<Response> {
  const headers = cors(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405, headers);
  let id = '';
  try {
    id = String(((await req.json()) as { id?: unknown }).id ?? '');
  } catch {
    /* falls through to the check below */
  }
  if (!/^[A-Za-z0-9]{20}$/.test(id)) return json({ error: 'Bad request' }, 400, headers);
  // Once per enquiry (per running instance).
  const now = Date.now();
  for (const [k, t] of sent) if (now - t > 30 * 60_000) sent.delete(k);
  if (sent.has(id)) return json({ ok: true, duplicate: true }, 200, headers);

  const lead = await readLead(env, id, fetcher).catch(() => null);
  if (!lead) return json({ error: 'Enquiry not found' }, 404, headers);
  sent.set(id, now);

  const [email, callmebot, cloud] = await Promise.all([
    sendEmail(env, lead, fetcher).catch(() => false),
    sendCallMeBot(env, lead, fetcher).catch(() => false),
    sendWhatsAppCloud(env, lead, fetcher).catch(() => false),
  ]);
  return json({ ok: true, email, whatsapp: callmebot || cloud }, 200, headers);
}
