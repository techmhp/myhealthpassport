# My Health Passport - Development Session Report

**Date:** March 7, 2026
**Project:** My Health Passport (MHP)
**Repositories:** `myhealthpassport-app` (Next.js frontend), `myhealthpassport-api` (FastAPI backend)
**Location:** `D:\MHP_OLDCODE_Merge with_New Code_Final\`

---

## Session 1: Local Environment Setup & Bug Fixes

### 1. Local Dev Environment Setup

Set up a complete local development environment from scratch:

| Component | Version | Details |
|-----------|---------|---------|
| PostgreSQL | 17 | Database server, created `myhealth_passport` database |
| Memurai | (Redis-compatible) | Session caching (ObjectCache) |
| Python | 3.12 | Virtual environment for FastAPI backend |
| Node.js | v24.x | Next.js frontend dependencies |
| FastAPI server | Port 9000 | API backend |
| Next.js server | Port 3000 | Frontend |

### 2. Backend Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `uvloop` crash on Windows | `uvloop` is Linux-only | Removed uvloop import, used default asyncio loop |
| WeasyPrint errors | Missing system dependencies | Installed GTK runtime for Windows |
| AWS credential errors | Missing AWS config | Added placeholder AWS credentials in `.env` |
| Emoji encoding crash | Windows cp1252 can't encode Unicode emoji | Replaced emoji characters with ASCII text |
| DB schema mismatches | Code models didn't match DB columns | Aligned Tortoise ORM models with actual schema |
| Login 500 Internal Server Error | `SMART_SCALE` missing from `ScreeningTeamRoles` enum in `user_models.py` | Added `SMART_SCALE = "SMART_SCALE"` to the enum |

### 3. Database Import

- Imported user-provided DB dump: `C:\Users\yakub\Downloads\myhealth_passport.sql` (11.4 MB)
- PostgreSQL 16 dump imported into PG 17 with zero errors
- Verified schema compatibility: all 4 main user tables had perfect column match

### 4. Login System Debugging

**Key file:** `src/api/general/routes/home.py` - Login endpoint maps `role_type` to user models:

| Login Portal | URL | role_type sent | User Table |
|-------------|-----|---------------|------------|
| Parent Login | `/parent-login` | `PARENT` | `users_parents` |
| School Login | `/school-login` | `SCHOOL_STAFF` | `users_school_staff` |
| Admin & Staff Login | `/login` | `SCREENING_TEAM` / `ADMIN_TEAM` / etc. | Multiple tables |
| Expert Login | `/expert-login` | `CONSULTANT_TEAM` | `users_consultant` |

**Password pattern:** username = password for all non-parent users. Parent login uses OTP (hardcoded `123456` in dev mode).

### 5. Frontend Fix: Parent Login Page

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Parent login 500 error | `placeholder.s3.amazonaws.com` not whitelisted in Next.js `images.remotePatterns` | Added hostname to `next.config.mjs` |

---

## Session 2: MHP2 Marketing Site Merge

### Overview

Merged the `mhp2` repository (a separate Vite + React + TypeScript marketing website) into the existing Next.js application.

**Source repo:** `https://github.com/techmhp/mhp2`

| Aspect | mhp2 (Source) | Existing App (Target) |
|--------|--------------|----------------------|
| Framework | Vite + React 18 | Next.js 15 |
| Language | TypeScript | JavaScript |
| UI Library | shadcn/ui (Radix) | Ant Design |
| CSS | Tailwind CSS | Tailwind CSS v4 |
| Auth/Backend | Supabase | FastAPI + PostgreSQL |
| Pages | 22 (14 public, 3 auth, 4 dashboard stubs, 1 404) | 102 operational pages |

### Approach Chosen

**Port into existing Next.js app** - Bring mhp2's marketing pages and components into the existing Next.js app as new routes, keeping both UI systems (Ant Design for dashboards, shadcn/ui for marketing).

### Step-by-Step Implementation

#### Step 1: Install Dependencies (~40+ npm packages)

Installed all Radix UI primitives, utility libraries, and UI packages:
- 27 `@radix-ui/react-*` packages (accordion, dialog, dropdown-menu, tabs, tooltip, etc.)
- `lucide-react` (icons), `recharts` (charts), `sonner` (toast notifications)
- `class-variance-authority`, `clsx`, `tailwind-merge` (shadcn utilities)
- `tailwindcss-animate` (animation plugin)
- `typescript`, `@types/react` (TypeScript support)

#### Step 2: Set Up shadcn/ui Foundation

| File | Action | Purpose |
|------|--------|---------|
| `lib/utils.ts` | Created | `cn()` utility for Tailwind class merging |
| `tailwind.config.js` | Extended | Added shadcn theme colors (HSL CSS variables), animations, fonts |
| `styles/globals.css` | Updated | Added CSS variables for light/dark mode, TW4 `@config` directive |
| `tsconfig.json` | Created | TypeScript support with `@/*` path alias |

#### Step 3: Copy shadcn UI Components

- **48 `.tsx` files** copied to `components/shadcn/`
- Used `shadcn/` directory (not `ui/`) to avoid case-insensitive conflict with existing `components/UI/` on Windows
- Fixed all internal imports: `@/components/ui/` changed to `@/components/shadcn/`

**Components include:** accordion, alert-dialog, avatar, badge, button, calendar, card, carousel, chart, checkbox, collapsible, command, dialog, drawer, dropdown-menu, form, hover-card, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip, and more.

#### Step 4: Copy Marketing Components

- **46 component files** copied to `components/marketing/` with subdirectories:
  - `csr/` - CSR partnership components
  - `investor/` - Investor page sections
  - `investor/svalife/` - SVA Life partner sections
  - `parent/` - Parent care components
  - `product/` - Product model components
  - `school/` - School program components

**Key conversions performed on every file:**
- `react-router-dom` Link/useNavigate/useLocation replaced with `next/link` and `next/navigation`
- `@/components/ui/` changed to `@/components/shadcn/`
- Supabase imports removed, replaced with `console.log` placeholders
- `'use client'` directive added to all files
- `@/assets/` image imports changed to `/marketing-assets/` string paths

#### Step 5: Create Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useScrollAnimation` | `hooks/useScrollAnimation.tsx` | IntersectionObserver-based scroll animations |
| `use-toast` | `hooks/use-toast.ts` | Toast notification state management |
| `use-mobile` | `hooks/use-mobile.tsx` | Mobile breakpoint detection |
| `useRazorpay` | `hooks/useRazorpay.ts` | Payment gateway (placeholder, Supabase removed) |

#### Step 6: Port Static Assets

| Destination | Files | Details |
|-------------|-------|---------|
| `public/marketing-assets/` | 26 files | 13 blog images, logo, portal images, school images, passport mockups |
| `public/downloads/` | 6 PDFs | Health reports, pitch deck, psychology report |
| `public/videos/` | 2 MP4s | Intro video, product explanation |
| `public/placeholder.svg` | 1 file | Placeholder image |

#### Step 7: Port Blog Data

- Created `data/blogContent.ts` with 13 blog articles
- Converted image imports from `@/assets/` to `/marketing-assets/` string paths
- Categories: Nutrition, Gut Health, Anxiety, Hormones, Stress

#### Step 8: Create Next.js Page Routes

Created 15 page routes under `app/(public)/`:

| Route | Page | Source Component |
|-------|------|-----------------|
| `/` | Marketing landing page | Hero, Pillars, Need, Security sections |
| `/parents` | Parent care programs | ParentPage with concern cards, booking |
| `/schools` | School health framework | SchoolPage with programs grid |
| `/schools/health-buddy-centre` | Buddy Centre details | HealthBuddyCentrePage |
| `/schools/health-camp` | Health Camp model | HealthCampPage |
| `/schools/health-talks` | Health Talks program | HealthTalksPage |
| `/investors` | Business model | InvestorPage with MHP & SVA Life sections |
| `/csr` | CSR partnership | CSRPage with impact calculator |
| `/resources` | Blog listing + videos | ResourcesPage with tabs |
| `/blog/[slug]` | Dynamic blog detail | BlogPostPage with dynamic routing |
| `/product` | Product models | ProductPage (Flagship, Compact, etc.) |
| `/school-pitch` | School sales pitch | SchoolPitchPage |
| `/privacy-policy` | Privacy policy | PrivacyPolicyPage |
| `/terms-of-service` | Terms of service | TermsOfServicePage |

Created `app/(public)/layout.js` wrapping all marketing pages with Header + Footer.

#### Step 9: Handle Root Route Change

- Old login selector page moved from `/` to `/portal` (`app/(auth)/portal/page.js`)
- Root `/` now shows the marketing landing page
- Marketing Header login dropdown updated to point to existing auth routes:
  - Parent Login links to `/parent-login`
  - School Login links to `/school-login`
  - Expert Login links to `/expert-login`
  - Admin Login links to `/login`

#### Step 10: Fix Tailwind CSS v4 Compatibility

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| `Cannot apply unknown utility class: border-border` | TW4 doesn't read `tailwind.config.js` by default | Added `@config "../tailwind.config.js"` and `@plugin "tailwindcss-animate"` directives to globals.css |
| `@tailwind base/components/utilities` deprecated in TW4 | Legacy syntax | Changed to `@import "tailwindcss"` |
| `@apply border-border` not recognized | TW4 custom utilities need explicit config | Replaced with plain CSS: `border-color: hsl(var(--border))` |
| TypeScript deps install via yarn | Yarn not installed, project uses npm | Installed `typescript` and `@types/react` via npm |

---

## Verification Results

### All Pages Tested (HTTP Status Codes)

**New Marketing Pages (all 200 OK):**
- `/` `/parents` `/schools` `/investors` `/csr` `/resources` `/product`
- `/school-pitch` `/privacy-policy` `/terms-of-service`
- `/schools/health-buddy-centre` `/schools/health-camp` `/schools/health-talks`
- `/blog/why-toddlers-get-hangry`

**Existing Auth Pages (all 200 OK):**
- `/portal` `/login` `/parent-login` `/school-login` `/expert-login`

**Existing Dashboard Pages (307 redirect - expected when not authenticated):**
- `/screening/home` `/admin/home`

**Server compilation:** All pages compiled with zero errors.

---

## Files Modified/Created Summary

### Backend (`myhealthpassport-api`)

| File | Change |
|------|--------|
| `src/models/user_models.py` | Added `SMART_SCALE` to `ScreeningTeamRoles` enum |

### Frontend (`myhealthpassport-app`)

| Category | Files | Count |
|----------|-------|-------|
| shadcn UI Components | `components/shadcn/*.tsx` | 48 |
| Marketing Components | `components/marketing/**/*.tsx` | 46 |
| Page Routes | `app/(public)/**/page.js` + layout | 15 + 1 layout |
| Hooks | `hooks/*.tsx` / `hooks/*.ts` | 4 |
| Data | `data/blogContent.ts` | 1 |
| Static Assets | `public/marketing-assets/*` | 26 |
| Downloads | `public/downloads/*.pdf` | 6 |
| Videos | `public/videos/*.mp4` | 2 |
| Config | `tailwind.config.js`, `tsconfig.json`, `globals.css`, `next.config.mjs` | 4 |
| Root Page | `app/page.js` (replaced with marketing landing) | 1 |
| Portal Page | `app/(auth)/portal/page.js` (old login selector) | 1 |
| **Total** | | **~155 files** |

---

## Architecture After Merge

```
myhealthpassport-app/
|-- app/
|   |-- page.js                    # Marketing landing (NEW - was login selector)
|   |-- (auth)/
|   |   |-- login/                 # Admin & Staff login (existing)
|   |   |-- parent-login/          # Parent OTP login (existing)
|   |   |-- school-login/          # School login (existing)
|   |   |-- expert-login/          # Expert login (existing)
|   |   |-- portal/                # Login selector cards (MOVED from /)
|   |-- (public)/
|   |   |-- layout.js              # Marketing layout (Header + Footer)
|   |   |-- parents/               # NEW - Parent care page
|   |   |-- schools/               # NEW - School health pages (4 routes)
|   |   |-- investors/             # NEW - Investor page
|   |   |-- csr/                   # NEW - CSR partnership
|   |   |-- resources/             # NEW - Blog + video resources
|   |   |-- blog/[slug]/           # NEW - Dynamic blog pages
|   |   |-- product/               # NEW - Product models
|   |   |-- school-pitch/          # NEW - School sales pitch
|   |   |-- privacy-policy/        # NEW - Privacy policy
|   |   |-- terms-of-service/      # NEW - Terms of service
|   |-- (dashboard)/               # Existing dashboards (102 pages)
|-- components/
|   |-- shadcn/                    # NEW - 48 shadcn/ui components
|   |-- marketing/                 # NEW - 46 marketing components
|   |-- UI/                        # Existing - shared UI components
|-- hooks/                         # NEW - 4 custom hooks
|-- data/                          # NEW - blog content data
|-- lib/
|   |-- utils.ts                   # NEW - cn() utility
|-- public/
|   |-- marketing-assets/          # NEW - 26 images
|   |-- downloads/                 # NEW - 6 PDFs
|   |-- videos/                    # NEW - 2 MP4s
```

---

## Known Remaining Items

1. **Supabase placeholders:** 6 marketing components have `console.log` placeholders where Supabase form submission calls were removed. These need to be wired to the FastAPI backend when ready.
2. **Razorpay payment hook:** `useRazorpay.ts` has Supabase code removed. Needs FastAPI integration for payment order creation.
3. **`legacyBehavior` deprecation:** The `/portal` page uses `legacyBehavior` prop on Next.js Link components. Minor cleanup item.
4. **Dark mode:** CSS variables for dark mode are defined but not actively toggled. No dark mode toggle exists in the UI.
5. **SEO metadata:** Marketing pages don't have Next.js metadata exports (title, description, OpenGraph). Can be added later.

---

*Report generated on March 7, 2026*
