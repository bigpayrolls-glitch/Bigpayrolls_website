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
cp .env.example .env.local   # then fill in the Firebase values (step 4 below)
npm run dev                  # open http://localhost:3000
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
7. **Auto-deploy from GitHub (optional, recommended):** in Google Cloud console → *IAM → Service accounts* → create one with role **Firebase Hosting Admin** → *Keys → Add key → JSON*. In GitHub → *Settings → Secrets and variables → Actions* add `FIREBASE_SERVICE_ACCOUNT` (the whole JSON) plus each `NEXT_PUBLIC_FIREBASE_*` value. Every push to `main` then builds and deploys (`.github/workflows/deploy.yml`).

## Connect bigpayrolls.com

1. Firebase console → *Hosting → Add custom domain* → enter `bigpayrolls.com` (then again for `www.bigpayrolls.com`, set to redirect).
2. Firebase shows DNS records (an **A** record and a **TXT** record). Add them at the company where you bought the domain (GoDaddy, Hostinger, etc.) → *DNS settings*.
3. Wait for verification (minutes to a few hours). Firebase sets up HTTPS for free.
4. Firebase → *Authentication → Settings → Authorized domains* → add `bigpayrolls.com` and `www.bigpayrolls.com` so Google sign-in works there.

## Make yourself an admin

After you sign up on the site: Firestore → `users` → your document → change `role` from `client` to `admin`. Admins can read and update every request (the admin screens come in the next phase; until then you can set a quote directly in Firestore — add a `quote` map with `total`, `items` and `notes`, and set `status` to `quote_sent`).

## Request statuses

`submitted` → `call_scheduled` → `quote_sent` → `accepted` → `in_progress` → `live` (also `changes_requested`, `cancelled`).

## Add your photos

Put photos in `public/photos/` and set their paths in `lib/site.ts` → `photos`, for example `heroTeam: '/photos/hero-team.jpg'`. Use your own photos or stock photos you have rights to (Unsplash and Pexels are free). Landscape photos around 1600 px wide work well; keep each under ~400 KB.

## Update contact details

Set `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_EMAIL` and `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` (and GitHub secrets). Office address, CIN and GSTIN are in `lib/site.ts`.

## Edit what clients can choose

Services, industries, business types, features, budgets and call slots are all in `lib/catalog.ts`.

## Free-tier limits (Firebase Spark)

Hosting: 10 GB storage, 360 MB/day transfer. Firestore: 50,000 reads and 20,000 writes per day. Auth: email and Google login are free. That is plenty for launch; you only need the paid Blaze plan for SMS OTP login or much higher traffic.
