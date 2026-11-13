# Big Payrolls website — bigpayrolls.com

Company website for **Big Payrolls Solution Private Limited** with client sign up / sign in, a "Get started" request wizard and a client dashboard.

**Stack (all free tiers):** Next.js (static export) · Firebase Authentication · Cloud Firestore · Firebase Hosting.

## What's in phase 1

| Page | Path | What it does |
|---|---|---|
| Home | `/` | Services, products (PF Mitra, Auto Talent Grid), industries, how it works |
| Sign up | `/signup/` | Email + password or Google; saves client profile |
| Sign in | `/signin/` | Email + password or Google; forgot password |
| Get started | `/get-started/` | Service → industry → business type → features → details → book a call; saves the request |
| Dashboard | `/dashboard/` | Client's requests, status progress and quote (once added) |
| Policies | `/privacy/`, `/terms/`, `/refund/` | Needed for Razorpay approval. Template text — get it reviewed |

**Next phase:** admin panel (see all requests, set the quote), online quote acceptance and Razorpay payment, mobile OTP login.

## Run it on your computer

```bash
npm install
cp .env.production .env.local   # Firebase keys for project bigpayrolls-6ec80
npm run dev                     # open http://localhost:3000
```

Without the Firebase values the site still runs; login and saving are switched off and a note says so.

## One-time setup

1. **Create a Firebase project** at https://console.firebase.google.com → *Add project* → name it `bigpayrolls`. Google Analytics is optional. Stay on the free **Spark** plan.
2. **Turn on login:** *Build → Authentication → Get started → Sign-in method* → enable **Email/Password** and **Google** (set the support email).
3. **Create the database:** *Build → Firestore Database → Create database* → choose location **asia-south1 (Mumbai)** → start in **production mode**.
4. **Get the web keys:** *Project settings (gear) → Your apps → Web (`</>`)* → register app `bigpayrolls-web` → copy the `firebaseConfig` values into `.env.local`.
5. **Install the Firebase tool and deploy the security rules:**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use --add            # pick your project, alias "default"
   firebase deploy --only firestore:rules
   ```
6. **Publish the site:**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
   It goes live at `https://<project-id>.web.app`.
7. **Auto-deploy from GitHub:** Firebase → *Project settings → Service accounts → Generate new private key* (keep this file private). In GitHub → *Settings → Secrets and variables → Actions* add a secret named `FIREBASE_SERVICE_ACCOUNT` containing the whole JSON file. Every push to `main` then builds and deploys (`.github/workflows/deploy.yml`). The public web config is already in `.env.production`.

## Connect bigpayrolls.com

1. Firebase console → *Hosting → Add custom domain* → enter `bigpayrolls.com` (then again for `www.bigpayrolls.com`, set to redirect).
2. Firebase shows DNS records (an **A** record and a **TXT** record). Add them at the company where you bought the domain (GoDaddy, Hostinger, etc.) → *DNS settings*.
3. Wait for verification (minutes to a few hours). Firebase sets up HTTPS for free.
4. Firebase → *Authentication → Settings → Authorized domains* → add `bigpayrolls.com` and `www.bigpayrolls.com` so Google sign-in works there.

## Admin dashboard — bigpayrolls.com/admin

**Make yourself (or staff) an admin:** sign up on the site, then Firebase → Firestore → `users` → that person's document → change `role` from `client` to `admin`. Admins are taken to `/admin/` when they sign in.

| Page | What you do there |
|---|---|
| `/admin/` | All requests with counters (new, calls, waiting on client, in progress, payments received), filters and search |
| `/admin/request/?id=…` | One request: client details with WhatsApp / call / email buttons, **post updates and change status** (client sees them), **build and send the quote**, **record payments**, private team notes |
| `/admin/clients/` | Every client account with contact details, interests and total paid |
| `/admin/settings/` | Your UPI ID, bank details and invoice details (prefix, GSTIN, email, footer) |

**What the client sees** on `/dashboard/`: progress bar, your updates, the quote with **Accept quote** / **Ask for changes**, and paid / balance once they accept.

**Payments:** once the client accepts a quote, their dashboard shows the amount due with a **UPI QR code**, a **Pay with UPI app** button on phones (amount filled in), your **bank details**, and a **Pay online** button if you paste a Razorpay payment link on the request. After paying they click **I have paid** and enter the UTR; you see it under *Payments to verify* and click **Confirm received**. You can also record any payment by hand (cash, cheque, etc.). Money goes straight to your account; no gateway fees for UPI or bank transfer.

**Invoices:** on a request click **Create invoice**. It gets the next number for the financial year (e.g. BP/2026-27/0001), shows items, payments received and balance due, and both you and the client can **Download PDF** from `/invoice/?id=…`.

**Security:** clients only ever see their own requests; they cannot change prices, payments or status (except accepting a quote or asking for changes), and cannot read team notes. The rules are in `firestore.rules`, are published automatically on each deploy, and are covered by tests.

**Testing:** GitHub → Actions → *End-to-end test* → *Run workflow* runs the whole client + admin flow in a browser against test copies of Firebase (no live data touched).

## Request statuses

`submitted` → `call_scheduled` → `quote_sent` → `quote_accepted` → `advance_paid` → `in_progress` → `live` (also `changes_requested`, `completed`, `cancelled`).

## Photos

The site uses free stock photos from [Pexels](https://www.pexels.com/license/) (free for commercial use, no attribution required), stored in `public/photos/` and listed in `lib/site.ts` → `photos`:

| File | Pexels photo |
|---|---|
| hero-team.jpg | https://www.pexels.com/photo/7581046/ |
| hero-employee.jpg | https://www.pexels.com/photo/7581111/ |
| hero-handshake.jpg | https://www.pexels.com/photo/8837500/ |
| hr-services.jpg | https://www.pexels.com/photo/7580645/ |
| tech-build.jpg | https://www.pexels.com/photo/12899156/ |
| support-call.jpg | https://www.pexels.com/photo/7580638/ |
| industry-restaurant.jpg | https://www.pexels.com/photo/12203611/ |
| industry-retail.jpg | https://www.pexels.com/photo/36317181/ |
| industry-healthcare.jpg | https://www.pexels.com/photo/7108318/ |
| industry-manufacturing.jpg | https://www.pexels.com/photo/31047149/ |

To use your own team or office photos instead, replace the file with the same name (landscape, ~1400 px wide, under ~300 KB). Real photos of your team build more trust than stock photos.

Logos: `logo-horizontal.png` (header), `logo-horizontal-white.png` (dark backgrounds), `logo-stacked.png` (footer), `logo-mark.png` and `app/icon.png` (browser tab icon) — all transparent PNGs made from the original logo.

## Update contact details

Set `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` (and GitHub secrets). Office address, CIN and GSTIN are in `lib/site.ts`.

## Edit what clients can choose

Services, industries, business types, features, budgets and call slots are all in `lib/catalog.ts`.

## Free-tier limits (Firebase Spark)

Hosting: 10 GB storage, 360 MB/day transfer. Firestore: 50,000 reads and 20,000 writes per day. Auth: email and Google login are free. That is plenty for launch; you only need the paid Blaze plan for SMS OTP login or much higher traffic.

## Ad landing page — bigpayrolls.com/website-quote

Fast, no-login "Get a quote" page for Meta ads (website-building service). Light on purpose: no Firebase SDK, no photos to download.

- **Form:** name, mobile / WhatsApp (+91, 10 digits), business type, what they need, optional message, Terms consent. After sending: "Thanks! We'll call you within 24 hours."
- **Saved to** Firestore `leads` (rules check every field; visitors can create only). **Admin → Enquiries** lists them with Call / WhatsApp buttons, status (New → Called → Quote sent → Won / Not interested), notes and CSV download.
- **UTM:** `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` (and `fbclid`) are captured on landing (first ad touch kept) and saved with the enquiry.
- **Meta Pixel** `1677610107402565` loads only after the visitor taps **Allow** in the cookie banner: `PageView` on load, `Lead` only after the enquiry is saved (event id = enquiry id). No names or numbers go to Meta. `NEXT_PUBLIC_META_PIXEL_ID=off` switches it off.
- **Team alert:** after saving, the page calls the Supabase Edge Function `website-lead` (`supabase/functions/website-lead`), which reads the enquiry back and sends an email (Resend) and, if set up, a WhatsApp message (CallMeBot to your own phone, or the WhatsApp Cloud API with an approved template that has 4 variables: name, mobile, business type, need).
- **/signup** also works without email or password: it is then saved as an enquiry (Admin → Enquiries) instead of an account. `?interest=tech-build` pre-selects "Website / App".

**Secrets** (GitHub → Settings → Secrets and variables → Actions), published to the function on every deploy:

| Secret | What |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Supabase → Account → Access Tokens → Generate (lets the deploy publish the function) |
| `RESEND_API_KEY` | Resend → API Keys → Create (Sending access, domain bigpayrolls.com) |
| `LEAD_ALERT_EMAIL` | Where alerts go, comma-separated |
| `CALLMEBOT_PHONE`, `CALLMEBOT_APIKEY` | Optional WhatsApp alert to your own number (callmebot.com, free) |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_TO`, `WHATSAPP_TEMPLATE` | Optional, official WhatsApp Cloud API instead |

Tests: `node --experimental-strip-types e2e/lead-alert.test.mjs` (function), `e2e/rules.test.mjs` (rules), `e2e/landing.test.mjs` (phones, in the End-to-end test workflow).
