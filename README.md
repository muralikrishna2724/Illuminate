# ILLUMINATE

The event website and registration platform for **ILLUMINATE**, a 2-day college innovation, technology, entrepreneurship and creative event on **October 8–9**.

| Day | Date | Events |
| --- | --- | --- |
| Day 1 | October 8 | Deja Vu Hackathon · AI Debate · IPL Auction |
| Day 2 | October 9 | Illuminate — Entrepreneurship Workshop (the flagship, associated with IIT Bombay) |

The project includes the public website, registrations with payment-proof upload (UTR + screenshot), a PostgreSQL database, secure admin authentication, a dashboard where admins verify or reject payments with one click, Deja Vu quiz-link management and CSV export.

---

## 1. Project overview

**Public site**

| Route | Purpose |
| --- | --- |
| `/` | Homepage: hero, 2-day overview, Day 1 events, Illuminate Workshop feature, navigation, registration CTA, FAQ preview |
| `/day-1` | Day 1 (October 8): Deja Vu Hackathon, AI Debate, IPL Auction |
| `/day-2` | Day 2 (October 9): Illuminate — Entrepreneurship Workshop |
| `/schedule` | Both days, with no invented timings |
| `/faq` | FAQs written only from confirmed information |
| `/register` | Step 1: choose an event |
| `/register/hackathon` · `/register/debate` · `/register/ipl-auction` · `/register/illuminate` | Registration forms (details → payment proof → confirmation) |
| `/registration` · `/registration/[id]` | Registrants check their payment status and, for Deja Vu, the quiz link |
| `/login` | One login for everyone (see below) |
| `/dashboard` | Participant profile: their details (name, email, phone, college, department, year) and every registration linked to their email, with payment status and the Deja Vu quiz |

**Login.** The header's **Login** button leads to one form with an email and a "registration ID or password" field:
- **Participants** enter the email they registered with and one of their registration IDs (`ILM-XXXXXX`). Any email on the registration works: the contact, the participant, the team leader or any team member. They land on `/dashboard`. Participants don't have passwords.
- **Participants who lost their registration ID** can enter their email and the phone number they registered with instead (`+91` and spaces are fine). Both must belong to the same person on a registration: the leader's email with the leader's phone, or a member's email with that member's phone. An email and phone from two different teammates are rejected.
- **Organisers** enter their admin email and their password in the same second field, and land on `/admin/dashboard`. The page deliberately doesn't mention this: its labels, hints and error messages only talk about registration IDs and phone numbers.
- A wrong combination always gets the same message, so the form doesn't reveal which emails exist. Login attempts are rate-limited.
- While someone is signed in, the header shows a profile button (initials and first name) instead of **Login**. It opens a menu with their name, a link to their profile (or the admin dashboard, for organisers) and **Log out**. Because of this, the public pages are rendered per request; the session is only looked up when a session cookie is present.

**Admin** (sign-in required)

| Route | Purpose |
| --- | --- |
| `/login` | Shared sign-in (`/admin/login` redirects here) |
| `/admin/dashboard` | Live counts and a queue of payments to review, with **VERIFY** / **REJECT** on each row |
| `/admin/hackathon` | Deja Vu registrations and quiz-link management |
| `/admin/debate` · `/admin/ipl-auction` · `/admin/illuminate` | Per-event registrations |

**Registration flow**

1. The registrant picks an event.
2. They fill in their details. Team events need exactly 4 members.
3. The site shows the amount. The server calculates it; the browser's value is never used.
4. The site shows payment instructions (UPI ID and QR, or clearly marked placeholders until they're configured).
5. The registrant enters the UTR / transaction ID and uploads a payment screenshot.
6. The backend validates everything, including the file's real content and UTR uniqueness.
7. The registration, team or participant, members and payment are created in **one database transaction**.
8. The payment status is **PENDING**, and the registrant gets a registration ID like `ILM-7K3QXZ`.
9. An admin checks the payment manually and clicks **VERIFY** (→ `VERIFIED`) or **REJECT** (→ `REJECTED`, with an optional reason).

---

## 2. Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Route Handlers, `proxy.ts`), React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4, `next/font` (Bricolage Grotesque for headings + Inter for text) |
| Animation | WebGL black hole (hero); CSS transitions + IntersectionObserver reveals; GSAP (ScrollTrigger, ScrollToPlugin) for the cinematic footer |
| Database | PostgreSQL + Prisma 6 (migrations, seed) |
| Validation | Zod 4. The same schemas run in the browser and on the server |
| Auth | bcrypt password hashes, DB-backed opaque sessions in an httpOnly cookie |
| Storage | Supabase Storage (private bucket) behind a provider interface, plus a local-disk provider for development |
| Quality | ESLint (`eslint-config-next` + TypeScript rules), `tsc --noEmit`, Node test runner (unit + end-to-end API tests) |

### Project structure

```
app/
  (site)/            public pages (layout: header + cinematic footer)
  admin/             (protected)/ admin pages (server-side session check)
  api/               route handlers (public + /api/admin/*)
components/
  admin/             dashboard, registrations table, detail panel, reject dialog, quiz manager
  home/ layout/ ui/  page sections, header, cinematic footer, primitives
  registration/      registration form, screenshot upload, payment instructions, success view
  ui/optimized-black-hole*  WebGL black-hole renderer (hero)
  visual/            BlackHole still-frame accents + Starfield (canvas)
lib/
  api/               browser API client (typed, no raw fetch in components)
  auth/              password hashing, sessions, guards
  db/                Prisma client
  events/catalog.ts  single source of truth for event content & pricing
  http/              API response format, errors, rate limiting, origin checks
  storage/           ObjectStorage interface + Supabase and local providers
  validation/        Zod schemas (registration, admin, file)
services/            business logic (registrations, payments, quiz, admin queries, CSV export)
prisma/              schema.prisma, migrations/, seed.ts
scripts/             create-admin.ts
tests/               unit/ and e2e/ tests
types/domain.ts      shared DTO types (Event, Team, Payment, Quiz, …)
proxy.ts             redirects signed-out visitors away from /admin (see note in the file)
```

---

## 3. Installation

Requirements: **Node.js ≥ 20.9** and **PostgreSQL ≥ 14**.

```bash
npm install           # also runs `prisma generate`
cp .env.example .env  # then fill in the values (see below)
```

---

## 4. Environment variables

All variables are documented in [`.env.example`](.env.example). The important ones:

| Variable | Secret? | Notes |
| --- | --- | --- |
| `DATABASE_URL` | **yes** | PostgreSQL connection string used by the app (on Vercel + Supabase: the transaction pooler, port 6543, with `?pgbouncer=true&connection_limit=1`) |
| `DIRECT_URL` | **yes** | Connection string used by `prisma migrate` (on Supabase: the session pooler, port 5432). Locally, the same as `DATABASE_URL` |
| `ADMIN_SESSION_SECRET` | **yes** | ≥ 32 random chars (`openssl rand -base64 48`). Key for hashing session tokens |
| `STORAGE_PROVIDER` | no | `supabase` (production) or `local` (development) |
| `SUPABASE_URL` | no | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes** | Server-only. Used to read and write the private screenshot bucket |
| `SUPABASE_STORAGE_BUCKET` | no | Defaults to `payment-screenshots` |
| `SUPABASE_ANON_KEY` | no | Not used by the server code. Listed for completeness |
| `NEXT_PUBLIC_API_BASE_URL` | no | Leave empty; set only if the API runs on another origin |
| `PAYMENT_UPI_ID`, `PAYMENT_PAYEE_NAME`, `PAYMENT_QR_IMAGE_URL` | no | Official payment details. Placeholders are shown until they're set |
| `CONTACT_EMAIL`, `CONTACT_PHONE` | no | Shown in the footer. Placeholders are shown until they're set |
| `TRUST_PROXY_HEADERS` | no | `true` behind Vercel/Nginx/Cloudflare; `false` if Node is exposed directly |

Secrets are only read by server modules marked `import "server-only"` (`lib/env.ts`, `lib/storage/*`, `lib/auth/*`). If a client component imports one of them, the build fails.

> Contact details in the footer are baked in at build time, so rebuild after changing them. Payment details on the registration pages are read on every request.

---

## 5. PostgreSQL setup

Any PostgreSQL 14+ works (local, Docker, Supabase Postgres, Neon, RDS…). Local example:

```bash
createuser illuminate --pwprompt
createdb illuminate --owner illuminate
# DATABASE_URL="postgresql://illuminate:<password>@localhost:5432/illuminate?schema=public"
```

With Docker:

```bash
docker run -d --name illuminate-db -e POSTGRES_USER=illuminate -e POSTGRES_PASSWORD=change-me \
  -e POSTGRES_DB=illuminate -p 5432:5432 postgres:16
```

If you use **Supabase Postgres**, use the connection string from *Project Settings → Database*.

---

## 6. Prisma setup

```bash
npx prisma generate   # runs automatically after npm install and in npm run build
npx prisma studio     # optional: browse the data
```

### Schema overview

| Model | Purpose / key constraints |
| --- | --- |
| `Event` | `slug` unique; `format` TEAM/INDIVIDUAL; `teamSize`; `feePerPersonInr`; `registrationOpen` |
| `Registration` | `registrationCode` **unique** (`ILM-XXXXXX`); FK → `Event`; contact fields; `createdAt`/`updatedAt` |
| `Team` / `TeamMember` | team events; `TeamMember` unique `(teamId, position)` |
| `Participant` | individual events (1:1 with registration) |
| `Payment` | 1:1 with registration; `utr` **unique**; `amountInr`; `screenshotPath` (storage key only, never the image bytes); `status` enum `PENDING/VERIFIED/REJECTED`; `verifiedAt`/`verifiedById`; `rejectedAt`/`rejectedById`/`rejectionReason` |
| `PaymentAuditLog` | append-only history of every verify/reject decision |
| `QuizConfiguration` | per event (`eventId` unique): `quizLink`, `enabled`, `accessRule`, `updatedAt`, `updatedById` |
| `AdminUser` / `AdminSession` | bcrypt password hash; sessions store only an HMAC of the token |

A second migration adds **CHECK constraints**: positive amounts, a UTR format check, consistency between `status` and `verifiedAt`/`rejectedAt`, a registration-code format check, and valid team sizes.

---

## 7. Database migrations

```bash
npm run db:migrate    # development: apply + create migrations (prisma migrate dev)
npm run db:deploy     # production/CI: apply pending migrations (prisma migrate deploy)
npm run db:seed       # create/update the 4 events and the (disabled) Deja Vu quiz config
```

The seed is safe to run in production. It **never** creates registrations, payments or admin accounts, and it never overwrites a quiz link that an admin has set.

---

## 8. Admin account setup

There are no default or hard-coded admin credentials. Create each admin with:

```bash
npm run admin:create -- --email head@your-college.edu --name "Event Head"
# prompts for the password (hidden). For CI/non-interactive use:
ADMIN_PASSWORD='…' npm run admin:create -- --email … --name …
```

- The password must have at least 8 characters, including upper-case and lower-case letters and a number. It is stored as a bcrypt hash (cost 12).
- Running the command again for the same email resets that admin's password and signs them out everywhere.
- To disable an admin, set `isActive = false` on their `AdminUser` row. Their sessions stop working immediately.
- Passwords can't be looked up; they're stored only as hashes. If an admin forgets theirs, reset it with the command above.
- Admins sign in at `/login`, the same page participants use.

---

## 9. Supabase / storage setup

1. Create a Supabase project.
2. Go to **Storage → New bucket**, name it `payment-screenshots`, and keep **Public bucket OFF**. The bucket must be private.
3. Copy the **Project URL** into `SUPABASE_URL` and the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY` (server env only).
4. Set `STORAGE_PROVIDER="supabase"`.

Files are stored at `payment-screenshots/{registrationId}/payment.{jpg|png|webp}`, and the database stores only that key.

**How screenshots stay private**

- The bucket is private, and the service-role key never reaches the browser.
- Admins view screenshots through `GET /api/admin/payments/{paymentId}/screenshot`. The route checks the admin session, then streams the image with `Cache-Control: private, no-store`. There is no public URL.
- Uploads are checked by their **magic bytes** (JPEG, PNG or WEBP) and must be 4 MB or smaller. The declared MIME type and file name are not trusted.
- If saving to the database fails after an upload, the uploaded object is deleted so nothing is left orphaned.

**Development:** `STORAGE_PROVIDER="local"` writes files to `./storage/` (git-ignored, outside `public/`, so they are never served statically). The app refuses to use local storage under `next start` unless you set `ALLOW_LOCAL_STORAGE_IN_PRODUCTION="true"`.

**Other providers:** implement `ObjectStorage` (`lib/storage/types.ts`: `upload`, `download`, `remove`) for S3, R2, GCS or similar, and register it in `lib/storage/index.ts`.

---

## 10. Local development

```bash
npm install
cp .env.example .env         # set DATABASE_URL, ADMIN_SESSION_SECRET, STORAGE_PROVIDER="local"
npm run db:migrate
npm run db:seed
npm run admin:create -- --email you@example.edu --name "Your Name"
npm run dev                  # http://localhost:3000
```

Checks:

```bash
npm run lint
npm run typecheck
npm test                     # unit tests: pricing, validation, file sniffing, quiz rule, CSV
```

End-to-end API tests run against a running server. **They write registrations, so use a development database only**:

```bash
npm run build && npm start   # in one terminal
E2E_ALLOW_WRITES=true E2E_BASE_URL=http://localhost:3000 \
E2E_ADMIN_EMAIL=you@example.edu E2E_ADMIN_PASSWORD='…' npm run test:e2e
```

The E2E suite covers every acceptance test: Deja Vu, AI Debate, IPL Auction and Illuminate registrations with the correct amounts; duplicate UTRs (including re-formatted ones); invalid files; VERIFY and REJECT; quiz access rules; CSV export; unauthenticated access; forged cookies; cross-origin blocking; and private screenshots.

---

## 11. Production build

```bash
npm ci
npm run db:deploy
npm run db:seed
npm run build
npm start
```

**Vercel:**
1. Import the GitHub repo in Vercel. The framework (Next.js) is detected automatically; keep the default build command (`npm run build`).
2. Add the environment variables from `.env.example` in *Settings → Environment Variables*. Use `STORAGE_PROVIDER=supabase`, the Supabase **transaction pooler** URL (port 6543, `?pgbouncer=true&connection_limit=1`) for `DATABASE_URL`, the **session pooler** URL (port 5432) for `DIRECT_URL`, a new random `ADMIN_SESSION_SECRET`, and `NEXT_PUBLIC_SITE_URL` set to the live URL.
3. Run migrations and the seed against the production database from your machine (`npm run db:deploy && npm run db:seed` with the production `DIRECT_URL`/`DATABASE_URL` in `.env`), and create admin accounts with `npm run admin:create`.
4. In *Settings → Functions*, pick the region closest to your Supabase project (e.g. Mumbai `bom1` for `ap-south-1`).
5. Vercel limits request bodies to 4.5 MB. Payment screenshots are therefore capped at 4 MB (`MAX_SCREENSHOT_BYTES` in `lib/site-config.ts`); don't raise it on Vercel.
6. Contact details (`CONTACT_*`) are read at build time, so redeploy after changing them. Payment details (`PAYMENT_*`) apply on the next request.

**Rate limiting** is in-memory and per instance: 10 registrations per 10 minutes and 10 logins per 15 minutes per IP. That is enough for a single server. On serverless or multi-instance hosting, back `lib/http/rate-limit.ts` with a shared store such as Redis/Upstash.

Security headers are set in `next.config.ts`: `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP and `frame-ancestors`. Admin pages also get `noindex` and `no-store`.

---

## 12. Configuring event information

All event content lives in **`lib/events/catalog.ts`**: names, dates, descriptions, themes, topics, benefits, team sizes and fees. The pages render from it, and `npm run db:seed` copies pricing and format into the `Event` table. The **backend always computes the payable amount from the database record** (`feePerPersonInr × teamSize`).

To change a fee or team size, edit the catalog and run `npm run db:seed`.

FAQs live in **`lib/faq.ts`**. Add only confirmed information: no invented timings, rules, prizes, speakers or goodie contents.

To close registrations for an event, set `registrationOpen = false` on its `Event` row. The API then refuses new registrations for it.

**Visuals:** the homepage hero runs a live WebGL black hole (`components/ui/optimized-black-hole.tsx` plus `components/ui/optimized-black-hole-utils/`). It ray-traces light bending around the hole over a turbulent accretion disk and a star field. To stay light it renders below native resolution, uses fewer steps on phones, lowers its resolution automatically if frames are slow, caps at 30 fps, pauses when off-screen or when the tab is hidden, and draws a single still frame for `prefers-reduced-motion`. Internal pages use still frames from the same renderer (`public/images/black-hole*.jpg`) through `components/visual/BlackHole.tsx`. The same still frame is shown while WebGL loads, or if it isn't available. To change the look, edit the camera in `renderer.ts` (distance, elevation, roll, framing) or the disk in `shader.ts` (radii, texture, tint, exposure), then regenerate the still frames by screenshotting the component.

---

## 13. Configuring the Deja Vu quiz link

1. Sign in and open **`/admin/hackathon`**.
2. In **Deja Vu qualification quiz**, paste the quiz URL (it must be a full `http(s)://…` URL).
3. Choose **who can see the link**:
   - *After payment proof is submitted*: PENDING and VERIFIED registrations see it.
   - *Only after payment is VERIFIED*: stricter; PENDING registrations see "will appear once your payment has been verified".
4. Tick **Quiz enabled** and click **Save changes**. You can also use **Enable quiz** / **Disable quiz**.

Registrants see the quiz on their confirmation screen and on `/registration/{their ID}`. Until a link is set and enabled, they see *"Quiz link will appear here once it is made available."* REJECTED payments never get the link. The URL is stored only in the database (`QuizConfiguration`) and is not hard-coded anywhere.

---

## 14. How admin verification works

The system **never decides on its own that a payment is genuine**. An admin checks it by hand:

1. On **`/admin/dashboard`**, the *Payments to review* list shows every **PENDING** payment with its registration ID, event, participant or team, amount, UTR, a screenshot thumbnail, and **VERIFY** / **REJECT** buttons.
2. Click the registration ID or the thumbnail to open the detail panel. It shows the amount and UTR, a large screenshot (zoom, or open in a new tab), full team or participant details and the decision history.
3. Compare the UTR and screenshot with the organisers' actual payment account records.
4. Click **VERIFY**. The browser sends an authenticated request with no status value in it. The server checks the admin session and the request origin, then sets `status = VERIFIED`, `verifiedAt = now`, `verifiedBy = <admin>` and writes an audit entry. The row updates to **VERIFIED** straight away.
5. Or click **REJECT**. A small dialog asks for an optional reason. The server sets `status = REJECTED`, `rejectionReason`, `verifiedAt = null`, `rejectedAt` and `rejectedBy`. The registrant sees the status and the reason on their status page.

Admins never type a status. Each state change is an atomic conditional update, so two admins clicking at the same time can't both apply a change. To fix a mistake, *Mark REJECTED* and *Mark VERIFIED* are available on decided payments, and every change is logged.

**Search** covers registration ID, team name, participant or member name, phone, email, college and UTR. **Filters** cover event, payment status and registration date range (IST). **Export CSV** downloads the current filtered view from the database: one row per registration, with up to 4 member column groups, amounts, statuses and verification timestamps. The export protects against spreadsheet formula injection.

---

## Security summary

- Server-side Zod validation on every input. Unknown fields such as `amount` or `status` are dropped.
- The amount is always calculated on the server.
- UTR uniqueness is enforced by a database unique constraint on the normalised UTR (upper-cased, spaces and dashes removed), with a clear 409 message: *"This transaction ID has already been submitted."*
- Only authenticated admins can verify or reject. Registrants have no endpoint that changes payment status.
- Admin routes are checked on the server: the layout guard and every API route validate the session against the database. `proxy.ts` only adds an early redirect.
- Origin checks on state-changing admin requests, plus a SameSite=Lax, httpOnly and (in production) Secure cookie.
- Login timing is the same for unknown emails, and error messages are generic.
- API errors never include stack traces.
- The public status endpoint returns no personal data.
- Uploads are checked by their real file content, and screenshots are stored privately.
