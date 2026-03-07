# MHP2 — Project Status Report

**Date:** 5 March 2026 (Updated)
**Repository:** https://github.com/techmhp/mhp2

---

## 1. Bugs Fixed

### 1.1 Razorpay 400 Bad Request on Some Payment Plans
- **Problem:** Razorpay API returned 400 error for plans with long names (e.g. "Emotional & Learning — Assessment"). Shorter plan names (INSIGHT, FLOURISH) worked fine.
- **Root Cause:** The `receipt` field in `src/hooks/useRazorpay.ts` exceeded Razorpay's 40-character limit. Long plan names generated receipts like `emotional_&_learning_—_assessment_1709564823456` (48+ chars).
- **Fix:** Truncated receipt to safe format: `rcpt_{timestamp}_{planName.slice(0,10)}` — always under 40 chars.
- **File Changed:** `src/hooks/useRazorpay.ts`

### 1.2 UAT Deploying with Production Environment
- **Problem:** `deploy-uat.yml` ran `npm run build` which loads `.env.production` — so UAT was pointing to the Production Supabase.
- **Fix:** Changed build command to `npm run build:uat` which loads `.env.uat`.
- **File Changed:** `.github/workflows/deploy-uat.yml`

### 1.3 Missing `build:uat` Script
- **Problem:** `package.json` on main branch had no `build:uat` script (only existed on staging from Durga's work).
- **Fix:** Added `"build:uat": "vite build --mode uat"` to `package.json`.
- **File Changed:** `package.json`

### 1.4 Domain Detection Hack in OTP Page
- **Problem:** `ParentOTPLoginPage.tsx` had 3 copy-pasted blocks (~55 lines) sniffing `window.location.hostname` to determine the API URL at runtime.
- **Fix:** Replaced all 3 blocks with a single `getApiUrl()` helper that reads from `VITE_API_URL` env var, with hostname fallback only if env var is missing.
- **File Changed:** `src/pages/ParentOTPLoginPage.tsx`

### 1.5 Main ↔ Staging Branch Merge Conflict
- **Problem:** Auto-sync from main to staging failed due to merge conflicts in `.env` and `.env.uat` (our cleanup vs Durga's changes).
- **Fix:** Merged main into staging manually, resolved conflicts by taking the clean env files from main.

---

## 2. Environment Setup Completed

### 2.1 Two Separate Supabase Projects

| Environment | Project ID | Region | URL |
|-------------|-----------|--------|-----|
| **UAT** | `kzsjgnrubrtnkvcdfusz` | ap-south-1 (Mumbai) | https://kzsjgnrubrtnkvcdfusz.supabase.co |
| **Production** | `ydafyxiipfdgoohgxidh` | ap-south-1 (Mumbai) | https://ydafyxiipfdgoohgxidh.supabase.co |

> **Note:** Original Production project (`ibwjdappyvcqixvpfevz`) was in ap-northeast-1 (Tokyo) — replaced with Mumbai region for lower latency. Old Tokyo project has been **deleted**.

### 2.2 Environment Files

| File | Purpose | Supabase Target |
|------|---------|----------------|
| `.env` | Local dev / default | UAT (safe for development) |
| `.env.uat` | UAT builds (`npm run build:uat`) | UAT |
| `.env.production` | Production builds (`npm run build`) | Production |

### 2.3 CI/CD Pipeline

| Workflow | Trigger | Build Command | Deploys To |
|----------|---------|--------------|------------|
| `sync-to-staging.yml` | Push to `main` | — | Merges main → staging |
| `deploy-uat.yml` | Push to `staging` | `npm run build:uat` | S3 `mhp-uat` → CloudFront `EVF2MJYSV3EHO` |
| `deploy-prod.yml` | Manual trigger | `npm run build` | S3 `mhp-production` → CloudFront `E3B92WOD20KCJ3` |

### 2.4 Old Supabase References Removed
- All references to the lost Supabase project (`ahiflquimqpogzvybhhx`) removed from entire codebase.
- Durga's incorrect anon key format (`sb_publishable_...`) replaced with correct JWT keys.

---

## 3. Database Schema — Applied to Both Projects

Tables created on both UAT and Production Supabase:

| Table | Purpose | RLS |
|-------|---------|-----|
| `profiles` | User profiles (linked to auth.users) | Yes — users see own profile |
| `user_roles` | Role assignments (parent/school/expert/admin) | Yes — users see own role, admins see all |
| `school_leads` | School inquiry form submissions | Yes — public insert, admin read |
| `parent_bookings` | Parent booking/contact form submissions | Yes — public insert, admin read |

Supporting objects:
- `handle_new_user()` trigger function — auto-creates profile + assigns role on signup
- `on_auth_user_created` trigger — fires on new auth user
- Migration columns: `concern_area`, `gender`, `program_interest` on respective tables

---

## 4. Razorpay Edge Function — Deployed to Both

| Item | UAT | Production |
|------|-----|------------|
| **Edge function** (`create-razorpay-order`) | ✅ Deployed (ACTIVE) | ✅ Deployed (ACTIVE) |
| **RAZORPAY_KEY_ID** | ✅ `rzp_test_RBTo1rrLQ9tSY6` (test) | ✅ `rzp_live_Rw87swcDtmaYd2` (live) |
| **RAZORPAY_KEY_SECRET** | ✅ Set | ✅ Set |

- UAT uses **test keys** — no real money charged, use [Razorpay test cards](https://razorpay.com/docs/payments/payments/test-card-details/) (e.g. `4111 1111 1111 1111`)
- Production uses **live keys** — real payments will be processed

---

## 5. UAT Testing Results

**Site:** https://uat.myhealthpassport.in

| Test | Result |
|------|--------|
| All pages load (`/`, `/login`, `/login/parent`, `/login/school`, `/csr`) | ✅ Pass |
| Supabase connection (UAT project) | ✅ Pass |
| Razorpay edge function — order creation | ✅ Pass |
| Razorpay test key returned correctly | ✅ Pass |
| School leads form — DB insert | ✅ Pass |
| Parent bookings form — DB insert | ✅ Pass |
| "Talk to Our Team" dialog — DB insert | ✅ Pass |
| RLS policies — public insert allowed | ✅ Pass |
| Parent OTP login | ⏳ Backend works, needs test user (see Pending) |

---

## 6. Pending Items

### 6.1 Parent OTP Login — Needs Test User in Backend DB
- **Status:** Frontend and backend API are both working. The OTP page calls `POST {VITE_API_URL}/login-mobile` on Durga's Python/FastAPI backend.
- **Issue:** No parent user with phone `8977655873` exists in the UAT backend PostgreSQL database.
- **Action for Durga:** Run this SQL on the UAT backend PostgreSQL:
  ```sql
  INSERT INTO parents (
    primary_first_name, primary_mobile, primary_email,
    user_role, role_type, is_active, is_verified,
    username, password, created_at
  ) VALUES (
    'Test Parent', '8977655873', 'test@mhp.in',
    'PARENT', 'PARENT', true, true,
    '8977655873', '$2b$12$dummy_hash_for_testing',
    NOW()
  );
  ```
- **Note:** In non-production mode, the OTP is hardcoded to `123456` — no SMS is sent.

### 6.2 Set Razorpay Live Keys on Production — ✅ DONE
- Edge function deployed to Production Supabase (`ydafyxiipfdgoohgxidh`) ✅
- `RAZORPAY_KEY_ID` = `rzp_live_Rw87swcDtmaYd2` ✅ Set
- `RAZORPAY_KEY_SECRET` ✅ Set
- **⚠️ IMPORTANT:** Production payments are LIVE — real money will be charged

### 6.3 OTP Login — Dual Channel (SMS + WhatsApp) — Code Complete

**Architecture:** Supabase Phone Auth → Send SMS Hook → Edge Function → SMS or WhatsApp

The edge function supports **three delivery channels** controlled by `OTP_CHANNEL` env var:
| Channel | Provider | Status | Use when |
|---------|----------|--------|----------|
| `sms` (default) | SMSLogin.co | ✅ Ready NOW | Immediate — works today |
| `whatsapp` | AiSensy | 🟠 Pending Meta template | After `mhp_otp_login` approved |
| `auto` | WhatsApp → SMS fallback | 🟠 Needs both configured | Best UX — try WhatsApp, fall back to SMS |

#### Current SMS Provider — SMSLogin.co (Durga's existing provider)
| Setting | Value |
|---------|-------|
| **Provider** | SMSLogin.co (Indian bulk SMS gateway) |
| **API Endpoint** | `https://smslogin.co/v3/api.php` (GET request) |
| **Username** | `Myhealth` |
| **Sender ID** | `MYHLTP` (DLT registered, shows as `CP-MYHLTP-S`) |
| **DLT Template ID** | `1707175326692338253` |
| **OTP message** | "Dear User, Your OTP for login to My health passport app is {otp}. Please do not share this OTP." |
| **Secrets set?** | ✅ Set on BOTH UAT + Production |

#### WhatsApp Provider — AiSensy
- **AiSensy account:** MY HEALTH PASSPORT (app.aisensy.com / wapp.leonas.in)
- **WhatsApp Business Number:** +91 77939 25151
- **API Campaign Key:** ✅ Found (JWT on app.aisensy.com Developer Hub)
- **Template `mhp_otp_login`:** 🟠 Submitted 05-03-2026, pending Meta approval
- **Shweta confirmed:** No existing auth template — they never sent auth messages via WhatsApp
- **Balance:** ₹3,083.72 (~21,000 OTP messages at ₹0.145/msg), valid till 01-08-2026

**✅ Code & Deployment Complete:**
- `supabase/functions/send-sms-hook/index.ts` — Dual-channel edge function
  - Deployed to BOTH UAT + Production (ACTIVE)
  - Webhook signature verification via `standardwebhooks`
  - `OTP_CHANNEL=sms` → SMSLogin.co (set as default — works immediately)
  - `OTP_CHANNEL=whatsapp` → AiSensy WhatsApp API
  - `OTP_CHANNEL=auto` → WhatsApp first, SMS fallback
  - SMSLogin secrets: ✅ `SMSLOGIN_API_KEY`, `SMSLOGIN_USERNAME`, `SMSLOGIN_SENDER_ID`, `SMSLOGIN_TEMPLATE_ID` — all set
- `supabase/migrations/20260305120000_phone_auth_support.sql` — Applied to BOTH UAT + Production
  - `profiles.email` now nullable (phone users don't have email)
  - `handle_new_user()` trigger updated: stores phone, auto-assigns `parent` role for phone signups
- `src/pages/ParentOTPLoginPage.tsx` — Rewritten to use Supabase Auth
  - `signInWithOtp({ phone: '+91...' })` → Supabase generates OTP → Hook sends SMS/WhatsApp
  - `verifyOtp({ phone, token, type: 'sms' })` → Supabase verifies → session created
  - AuthContext `onAuthStateChange` picks up session automatically
  - UI updated: "+91" prefix shown, 10-digit validation

**✅ Supabase Dashboard Configuration — DONE (via Management API):**
- Phone Auth: ✅ Enabled on BOTH UAT + Production
- Send SMS Hook: ✅ Configured on BOTH — pointing to `send-sms-hook` edge function
- Hook Secret: ✅ Generated (`v1,whsec_nYZW...`) & set as `SEND_SMS_HOOK_SECRET` on both
- `on_auth_user_created` trigger: ✅ Fixed (was missing on UAT, now created)

**✅ E2E Test — SMS OTP Received!**
- Sent `signInWithOtp({ phone: "+918977655873" })` to UAT
- User created in `auth.users`, profile + `parent` role auto-assigned
- SMS OTP received on phone via SMSLogin.co ✅

**🔲 Future: Switch to WhatsApp**
- Once Meta approves `mhp_otp_login` template, set `AISENSY_API_KEY` + change `OTP_CHANNEL=whatsapp` (or `auto`)

### 6.4 Production RLS Policies — ✅ FIXED
- **Status:** ✅ Working — anonymous inserts confirmed working on Production
- **Resolution:** RLS was never broken — earlier test used wrong column names (`contact_person` instead of `full_name`), causing misleading errors. Policies with `TO anon` and grants are all correctly configured.
- **Verified:** `SET ROLE anon; INSERT INTO school_leads (...)` — success

### 6.5 Production Frontend Deployment
- Database schema: ✅ Applied (new Mumbai project)
- Edge function: ✅ Deployed
- RLS policies: ✅ Working
- Razorpay secrets: ✅ Set (live keys)
- Frontend deployment: ✅ Deployed & verified (E2E tests passed)
- Custom backend API (`api.myhealthpassport.in`): Managed by Durga

### 6.6 Delete Old Tokyo Production Project — ✅ DONE
- Old Production project `ibwjdappyvcqixvpfevz` (ap-northeast-1) deleted from Supabase Dashboard

### 6.7 Supabase CLI Authentication
- CLI is currently logged in as `mayakub@gmail.com`
- UAT/Production projects belong to `tech@myhealthpassport.in`
- Supabase access token generated: `sbp_19d3...fbdf` (MHP CLI token)
- Used via `SUPABASE_ACCESS_TOKEN` env var for deployments

---

## 7. Repository Structure

```
mhp2/
├── .env                    # Local dev → UAT Supabase
├── .env.uat                # UAT builds → UAT Supabase
├── .env.production         # Prod builds → Production Supabase
├── .github/workflows/
│   ├── sync-to-staging.yml # Auto-sync main → staging
│   ├── deploy-uat.yml      # staging push → S3 mhp-uat
│   └── deploy-prod.yml     # Manual → S3 mhp-production
├── supabase/
│   ├── config.toml          # project_id = ydafyxiipfdgoohgxidh (Mumbai)
│   ├── functions/
│   │   ├── create-razorpay-order/index.ts
│   │   └── send-sms-hook/index.ts  # WhatsApp OTP via AiSensy (NEW)
│   └── migrations/          # 8 migration files (+ phone auth support)
├── src/
│   ├── hooks/useRazorpay.ts           # Razorpay integration (receipt fix)
│   ├── pages/ParentOTPLoginPage.tsx   # OTP login (cleaned up)
│   ├── integrations/supabase/client.ts # Supabase client
│   └── contexts/AuthContext.tsx        # Auth state management
└── package.json             # build:uat script added
```

---

## 8. Key Credentials Reference

| Service | UAT | Production |
|---------|-----|------------|
| **Supabase Project** | `kzsjgnrubrtnkvcdfusz` | `ydafyxiipfdgoohgxidh` (Mumbai) |
| **Supabase Account** | `tech@myhealthpassport.in` | `tech@myhealthpassport.in` |
| **Razorpay Key Type** | Test (`rzp_test_...`) | Live (`rzp_live_...`) ✅ |
| **Backend API** | `uat-api.myhealthpassport.in` | `api.myhealthpassport.in` |
| **Frontend URL** | `uat.myhealthpassport.in` | `myhealthpassport.in` |
| **S3 Bucket** | `mhp-uat` | `mhp-production` |
| **CloudFront** | `EVF2MJYSV3EHO` | `E3B92WOD20KCJ3` |

---

## 9. Related Repositories

| Repo | Purpose | Notes |
|------|---------|-------|
| `techmhp/mhp2` | Frontend (React + Vite + Supabase) | This repo — active development |
| `techmhp/myhealthpassport-api` | Backend API (Python/FastAPI + PostgreSQL) | Durga manages — OTP, payments, screening |
| `techmhp/myhealthpassport-app` | Old frontend (Next.js) | Legacy — has Razorpay integration via env vars |

---

*Report generated by Claude — 5 March 2026 (updated with Mumbai migration)*
