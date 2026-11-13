/**
 * Enquiries ("leads") from the ad landing page and the short sign-up.
 *
 * Saved straight to Firestore over its REST API (no Firebase SDK, so the landing page stays
 * small and fast). firestore.rules checks every field. After saving, the team-alert function
 * is asked to email / WhatsApp the team; if that fails the enquiry is still saved and shows
 * in Admin → Enquiries.
 */

export const BUSINESS_TYPES = ['Shop', 'Restaurant', 'Clinic', 'Startup', 'Services', 'Other'] as const;
export const NEEDS = ['Business website', 'Online shop', 'Landing page', 'Not sure'] as const;
export const LEAD_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Utm = { source?: string; medium?: string; campaign?: string; content?: string; term?: string; fbclid?: boolean; landing?: string; referrer?: string };

export type LeadInput = {
  source: 'website-quote' | 'signup';
  name: string;
  phone: string; // 10 digits
  businessType?: string;
  need?: string;
  message?: string;
  company?: string;
  email?: string;
  interests?: string[];
  companySize?: string;
};

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
const KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
const EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATORS === '1';
const FS_BASE = EMULATOR ? 'http://127.0.0.1:8080/v1' : 'https://firestore.googleapis.com/v1';
/** Team-alert function (Supabase Edge Function). Empty = alerts off. */
const ALERT_URL = process.env.NEXT_PUBLIC_LEAD_ALERT_URL || '';

// ------------------------------------------------------------------ where the visitor came from
const ACQ_KEY = 'bp.acq';

const clean = (v: string | null) => {
  const s = (v ?? '').trim().slice(0, 100);
  return s && /^[\w .:/@+|-]+$/u.test(s) ? s : undefined;
};

function readAcq(): Utm | null {
  try {
    const v = localStorage.getItem(ACQ_KEY);
    return v ? (JSON.parse(v) as Utm) : null;
  } catch {
    return null;
  }
}

/**
 * Remember the ad link that brought this browser here (utm_* and fbclid). A later visit from
 * an ad replaces an earlier visit that had none, but never an earlier ad (first touch wins).
 */
export function captureUtm(loc: Location = window.location, ref = document.referrer): Utm {
  const p = new URLSearchParams(loc.search);
  let refHost: string | undefined;
  try {
    const h = ref ? new URL(ref).hostname : '';
    refHost = h && h !== loc.hostname && /^[\w.-]+$/.test(h) ? h.slice(0, 100) : undefined;
  } catch {
    refHost = undefined;
  }
  const now: Utm = {
    source: clean(p.get('utm_source')),
    medium: clean(p.get('utm_medium')),
    campaign: clean(p.get('utm_campaign')),
    content: clean(p.get('utm_content')),
    term: clean(p.get('utm_term')),
    fbclid: p.has('fbclid') || undefined,
    landing: /^\/[\w\-/]*$/.test(loc.pathname) ? loc.pathname.slice(0, 100) : undefined,
    referrer: refHost,
  };
  const fromAd = (u: Utm | null) => Boolean(u && (u.source || u.campaign || u.fbclid));
  const prev = readAcq();
  if (!prev || (fromAd(now) && !fromAd(prev))) {
    try {
      localStorage.setItem(ACQ_KEY, JSON.stringify(now));
    } catch {
      /* storage blocked: the UTM of this page load is still used */
    }
    return now;
  }
  return prev;
}

// ------------------------------------------------------------------ saving
type FsValue = { stringValue: string } | { booleanValue: boolean } | { mapValue: { fields: Record<string, FsValue> } } | { arrayValue: { values: FsValue[] } };

function toFs(v: unknown): FsValue | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFs).filter(Boolean) as FsValue[] } };
  if (typeof v === 'object') return { mapValue: { fields: toFields(v as Record<string, unknown>) } };
  return undefined;
}

function toFields(o: Record<string, unknown>): Record<string, FsValue> {
  const out: Record<string, FsValue> = {};
  for (const [k, v] of Object.entries(o)) {
    const f = toFs(v);
    if (f) out[k] = f;
  }
  return out;
}

function newId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

export const phone10 = (s: string) => {
  const d = s.replace(/\D/g, '');
  return d.length === 12 && d.startsWith('91') ? d.slice(2) : d.length === 11 && d.startsWith('0') ? d.slice(1) : d;
};
export const validPhone = (s: string) => /^[6-9]\d{9}$/.test(phone10(s));

/** Save the enquiry, then ask for the team alert. Returns the new enquiry id. */
export async function submitLead(input: LeadInput): Promise<string> {
  if (!PROJECT || !KEY) throw new Error('Enquiries are not connected yet. Please call or WhatsApp us.');
  const id = newId();
  const utm = typeof window !== 'undefined' ? captureUtm() : null;
  const data = {
    ...input,
    name: input.name.trim().slice(0, 80),
    phone: phone10(input.phone),
    message: input.message?.trim().slice(0, 1000),
    company: input.company?.trim().slice(0, 100),
    email: input.email?.trim().slice(0, 120),
    utm: utm ?? undefined,
    status: 'new',
    consent: true,
  };
  const docName = `projects/${PROJECT}/databases/(default)/documents/leads/${id}`;
  const res = await fetch(`${FS_BASE}/projects/${PROJECT}/databases/(default)/documents:commit?key=${KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      writes: [
        {
          update: { name: docName, fields: toFields(data) },
          updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
          currentDocument: { exists: false },
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(res.status === 403 || /PERMISSION_DENIED/.test(body) ? 'Please check your details and try again.' : 'Could not send right now. Please try again in a minute.');
  }
  // Team alert: best effort, the enquiry is already saved.
  if (ALERT_URL) {
    try {
      await fetch(ALERT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }), keepalive: true });
    } catch {
      /* shows in Admin → Enquiries anyway */
    }
  }
  return id;
}
