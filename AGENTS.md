# AGENTS.md

Luxury villa booking platform ("Solscape Stays"). Two packages under `villa-booking/`: a Next.js App Router frontend and an Express + Mongoose backend. They run as separate dev servers. The frontend lives at `villa-booking/frontend/` (its `package.json` `name` is `frontend-next` — the dir is `frontend`, not `frontend-next`) and is wired to the backend API.

There is **no root tooling**: no root `package.json`/lockfile, README, or CI (root `.gitignore` only ignores nothing repo-wide). Run all `npm` commands inside `villa-booking/backend` or `villa-booking/frontend`; the git repo root is this directory.

## Running the app

- Backend: `cd villa-booking/backend && npm run dev` (nodemon `server.js`), listens on port `5000`.
- Frontend: `cd villa-booking/frontend && npm run dev`, listens on `3000`. Run both. CORS is wide-open, so origin port doesn't matter.
- Frontend reaches the API at `http://localhost:5000/api` via `src/services/api.js` (axios, baseURL overridable with `NEXT_PUBLIC_API_URL`).
- Health check: `GET /api/health`.

## Seeding (non-obvious)

- DB seed is `node utils/seed.js` (run from `villa-booking/backend`). It is NOT an npm script. Running it **wipes** all `Villa` and `Amenity` collections.
- Creates sample villas/amenities and default accounts if missing: `admin@villabooking.com` / `admin123` (role `admin`), `sales@villabooking.com` / `sales123` (role `sales`). All are in the **`Admin` collection** (model `Admin.js`) with a `role` field — not as a `User` with a `role`. For an existing DB where the admin only exists in `User`, create the `Admin` doc manually (e.g. a one-off script) or re-seed.
- `config/db.js` and `utils/seed.js` both hardcode `dns.setServers(['8.8.8.8','1.1.1.1'])` to resolve the Atlas SRV host. Leave this in place or seeding/DB bootstrap will fail on hosts with restrictive DNS.

## Config / secrets

- `villa-booking/backend/.env` exists locally but is **gitignored / not committed**; it holds the real Atlas `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`. Keep existing values as-is and do not introduce new secrets. Cloudinary values are stubbed placeholders.
- Payments: `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` (names in `.env.example`). Razorpay is **Test-Mode only** — `utils/razorpay.js` `isTestMode()` requires the key to start `rzp_test_` and is the only gate against real charges. If unset or live keys are present, payment-link features fail cleanly (400 on approve / 503 on webhook) with `setupError()`. Do not "fix" this by allowing live keys.
- Image uploads (villa images AND Landing CMS images) go through `multer` **memory** storage → Cloudinary (`utils/cloudinary.js`), and return a clear 500 error if `CLOUDINARY_*` env vars are unset/stubbed (they are stubs in local `.env`). The disk-storage `middleware/upload.js` and the statically-served `backend/uploads/` dir are **dead/unused** — do not route new uploads through them.

## Auth: fully separate user / admin / sales systems

- Three independent auth systems share **nothing**: separate models (`User`, `Admin`), guards (`middleware/userAuth.js` → `userProtect`, `middleware/adminAuth.js` → `adminProtect` + `salesProtect`), controllers, routes, and frontend sessions. There is no `role` field on `User` anymore.
- **`Admin` model has a `role` field** (`'admin'` | `'sales'`, default `'admin'`). JWT payload carries `{ id, type: 'admin', role }`. `adminProtect` requires `role === 'admin'`; `salesProtect` requires `role === 'sales'`. Both load/reload the admin doc and check the role server-side (a sales member cannot hit `/api/admin/*` and an admin cannot hit `/api/sales/*`; a `user` token hits neither).
- JWTs carry a `type` claim (`'user'`/`'admin'`); each guard verifies the token and looks up the doc in its own model, so a user token can never authenticate an admin endpoint and vice versa. All sign with the same `JWT_SECRET`/`JWT_EXPIRE` — do not add new secrets. Guards attach `req.user` (User) or `req.admin` (Admin); controllers must read the right one.
- User endpoints: `/api/auth/*` (register/login/profile/wishlist) + user-protected `/api/bookings` (own bookings only, `internalNotes`/`history` stripped via `select('-internalNotes -history')`; customer can cancel REQUESTED/UNDER_REVIEW/APPROVED/PAYMENT_PENDING/CONFIRMED) + `/api/notifications` + `/api/reviews` (create, delete own).
- Admin endpoints: `/api/admin-auth/*` (login/me — returns `role`) + `/api/admin/*` (CMS only, Sales Team management, review delete — **no booking routes**) + admin-only `/api/users` (user management) + villa write routes (`POST/PUT/DELETE /api/villas`, `/upload-images`).
- Sales endpoints: `/api/sales/*` (all booking management — list/get/update/approve/reject/confirm-payment/cancel/complete/custom-create + payment-link + notifications), guarded by `salesProtect`.

## Booking ownership & workflow

- **Booking management belongs ONLY to the Sales Team** (`/sales` dashboard, `/api/sales/*`). The Admin dashboard has **no** bookings tab, no "Custom Review Pending", no booking review. The Admin only does CMS/Villas/Users/Sales Team.
- Customer submits a booking request via user-protected `POST /api/bookings` → saved with `reviewStatus: 'PENDING'`, `bookingStatus: 'REQUESTED'`, `paymentStatus: 'UNPAID'` — dates are NOT held yet. Immediately visible in `/sales`; when Sales opens/edits it, status moves to `UNDER_REVIEW`.
- Guest composition stored as `adults`/`kids`/`infants`/`pets`; `guests` = adults + kids + infants. Over-capacity (guests > `villa.capacity`) is **never rejected** — it is flagged `requiresManualReview: true`, `isCustomBooking: true`, plus `standardCapacity`/`requestedGuests`/`extraGuests`, and shows a "⚠ Over Capacity" badge in `/sales`. `reviewStatus` stays `PENDING` until sales decides.
- Booking statuses are now **three independent axes** in `models/Booking.js` (a legacy `status` field is still derived by a pre-save hook for backward compat — new code should read the three axes). `bookingStatus` is now the **canonical lifecycle** powering the "first payment wins" system:
  - `reviewStatus` — `PENDING` | `APPROVED` | `REJECTED`. Controlled only by Sales.
  - `bookingStatus` — `REQUESTED` | `UNDER_REVIEW` | `APPROVED` | `PAYMENT_PENDING` | `CONFIRMED` | `CANCELLED` | `EXPIRED` | `COMPLETED`. Single source of truth for date holds.
  - `paymentStatus` — `UNPAID` | `PENDING` | `LINK_SENT` | `LINK_EXPIRED` | `PAID` | `FAILED` | `REFUNDED`.
  - Review and booking are **never mixed**: a rejection is a reviewStatus, cancellation/completion are bookingStatus, payment is paymentStatus.
- **Date-payment calendar states**: only `PAYMENT_PENDING` (yellow), `CONFIRMED`/`COMPLETED` (red), and admin-blocked dates (black) hold a date. `REQUESTED`/`UNDER_REVIEW`/`APPROVED` do **NOT** hold dates, so many requests can coexist until the first one pays. A payment link send sets `bookingStatus: PAYMENT_PENDING` and starts a configurable hold window — `config/payment.js` + `PAYMENT_HOLD_MINUTES` env (default 30 min). `utils/reaper.js expirePaymentHolds()` flips stale holds → `EXPIRED`; runs on an interval in `server.js` and mirrors the webhook's `expired`/`failed` release.
- **First-payment-wins** (`controllers/paymentController.js` `firstPaymentWins()`): wrapped in a **MongoDB transaction** — re-checks the winning booking is still eligible, cross-checks no overlapping CONFIRMED exists, then confirms it and cancels every overlapping `PAYMENT_PENDING` booking for the same villa in one commit. Idempotency via `paymentProcessedId` (the Razor scheduled payment id) so duplicate webhook deliveries can't double-confirm. `payment.failed`/`expired`/`cancelled` webhooks release the dates (→ `EXPIRED`/`FAILED`). Manual sales `confirm-payment` applies the same cancel-others logic. **Transaction sessions need a replica set** (Atlas). On a single-node MongoDB this path throws; the per-booking guards + reaper keep single-payer correctness for the normal flow.
- Sales Team actions (in `SalesBookingReview` modal): approve (→ `reviewStatus: APPROVED`, then `bookingStatus: PAYMENT_PENDING`, **auto-creates a Razorpay payment link** + hold window unless an explicit link is passed), reject (requires reason), edit dates/guests (`REQUESTED`→`UNDER_REVIEW`), confirm payment (`confirm-payment` → CONFIRMED + PAID + cancels overlaps), cancel, complete, custom pricing (base, extra-guest fee, cleaning, additional services, extra bundles, reducing totals, etc., override total), internal notes (never exposed), offer message, "Send Offer", payment link generate/clear (clearing a link releases the hold → `APPROVED`). Custom bookings from scratch via `POST /api/sales/bookings`.
- `internalNotes` **and** the `history` array are sales-only; customer-facing responses select them out (`.select('-internalNotes -history')`).

## Payments (Razorpay payment links) & Notifications

- Payments use Razorpay **Payment Links** (not the Checkout SDK). Approve or `POST /api/sales/bookings/:id/payment-link` calls `utils/razorpay.js` `createPaymentLink()` (amount in **paise**), stores `paymentLink` (short URL), `paymentLinkId`, `paymentLinkExpiresAt`, `paymentStatus: LINK_SENT`, and appends to `paymentHistory`.
- Webhook: `POST /api/payments/razorpay/webhook` uses `express.raw({ type: 'application/json' })` and `verifyWebhookSignature()` (HMAC over the raw body). **This route must stay registered before the global `express.json()` in `server.js`** or the raw body/signature check breaks. Handles `payment_link.paid` (→ transactional `firstPaymentWins()` confirm + cancel overlaps) and `expired`/`cancelled`/`payment.failed` (→ `EXPIRED`/`FAILED`, dates released). `GET /api/payments/bookings/:id/payment-status` (sales) and `POST /api/payments/bookings/:id/sync` (user) poll Razorpay and apply the same confirm logic.
- Notifications (`models/Notification.js`, `utils/notify.js`): docs keyed by `recipientType` (`user`|`sales`|`admin`) + `recipient` via `refPath`. Created on booking submit/cancel (to all sales), approve/reject/confirm/complete/payment (to the user). Read via `GET /api/notifications` (user) and `GET /api/sales/notifications` (sales); mark-read at `PUT .../notifications/read`.
- Gotcha: `notify()` **requires a single object arg** (`{ recipientType, recipient, type, title, ... }`) and swallows errors; always call it in the object form (`notify({ recipientType: 'user', recipient: booking.user, ... })`) as every current call does. `utils/bookingHistory.js` `notifyAllSales(payload)` fans out `notify({...payload, recipientType: 'sales', recipient: id})` to all `role: 'sales'` admins.
- `utils/bookingHistory.js` `addHistory(booking, { actor, actorType, action, note, changes })` appends to the booking `history` array — use it for auditable sales/system actions.

## Frontend sessions, guards & routes

- User session in `localStorage` key `solscapeUser`; admin in `solscapeAdmin`; **sales in `solscapeSales`**. Logging out of one never touches the others.
- `src/services/userApi.js` attaches the user token and redirects to `/login` on 401; `adminApi.js` → `/admin`; `salesApi.js` → `/sales`. `src/services/api.js` is a plain public instance (no token logic). Login requests skip the 401 redirect (checked by URL in the interceptor) so a bad password surfaces the error instead of bouncing.
- Contexts: `src/context/UserAuthContext.js` (`useUserAuth`), `AdminAuthContext.js` (`useAdminAuth`), `SalesAuthContext.js` (`useSalesAuth`). Guards: `UserGuard.jsx` → `/login`, `AdminGuard.jsx` → `/admin`, `SalesGuard.jsx` → `/sales`.
- Routes: `/login` + `/register` are user auth; `/admin` + `/admin/dashboard` (admin-protected); `/sales` + `/sales/dashboard` (sales-protected). Admin and sales pages live under `app/admin/` and `app/sales/` (bare layouts, no site Navbar/Footer); user auth pages under the `(auth)` route group, public/site pages under `(site)`.

## Backend notes

- CommonJS (`require`/`module.exports`), Express 5 + Mongoose 9. Routes are wired in `server.js`; one file per resource under `routes/`, `controllers/`, `models/`, `middleware/`. Note: `POST /api/contact` is handled inline in `contactRoutes.js` (no controller); admin controllers are `cmsController`, `adminSalesTeamController`, `adminReviewController`; the booking-management controller is `salesController` (routed at `/api/sales`, NOT `/api/admin`).
- Villa routes: `/featured`, `/slug/:slug`, and `/:id/availability` are registered before `/:id` — keep that order or they'll be shadowed (`routes/villaRoutes.js`). `GET /api/villas/:id/availability?days=N` returns `{ availability: { 'YYYY-MM-DD': 'AVAILABLE'|'PAYMENT_PENDING'|'BOOKED'|'BLOCKED' }, dayKeys, start, days }` and powers the booking calendar (`utils/availability.js buildAvailability()`). Admin blocks dates via the villa `blockedDates` array (rendered black). `POST /api/villas/upload-images` is admin-only, `uploadMemory.array('images', 10)` → Cloudinary (`solscape/villas`), max 10 images, 5MB each.
- **Landing CMS** (`controllers/cmsController.js`, `models/CmsSection.js`): scalable module+section+platform keyed docs — `{ module: 'landing', section, platform: 'desktop'|'mobile', data }`. Landing sections: `hero`, `showcase`, `gallery`, `amenities`, `experiences`, `testimonials`, `faqs`, `newsletter`. All 16 docs (8 sections × 2 platforms) are lazily created from `DEFAULT_LANDING` in `cmsController.js` on first read — no explicit seed step. Public `GET /api/cms/landing` returns `{ desktop: {...}, mobile: {...} }`; admin `GET|PUT /api/admin/cms` reads/upserts it. Admin image upload: `POST /api/admin/cms/upload` (multer **memory** storage → Cloudinary, returns `{ url, publicId }`); delete: `DELETE /api/admin/cms/image` `{ publicId }`. Both this and the villa upload use `uploadMemory` and check `cloudinary.isConfigured()`.

## Frontend (frontend-next) notes

- Next.js **16.2.12** App Router + React 19, Tailwind CSS **v4** (via `@tailwindcss/postcss` — no `tailwind.config.js`), framer-motion/GSAP/@studio-freight/lenis for animation.
- Next 16 has breaking conventions vs. typical training data. `villa-booking/frontend/AGENTS.md` (also referenced by `CLAUDE.md`) requires reading the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
- Structure: thin `page.jsx` files in `app/` are `'use client'` wrappers that render views from `src/views/` (e.g. `app/(site)/villas/[slug]/page.jsx` → `VillaDetails`, `app/sales/dashboard/page.jsx` → `SalesDashboard`). Shared code lives in `src/components/`, `src/context/` (UserAuthContext, AdminAuthContext, SalesAuthContext, WishlistContext, LandingCmsContext), `src/hooks/` (useIsMobile), `src/services/` (axios layer). Route groups `(site)` and `(auth)` each define their own animated client layout with Navbar; `app/admin/` and `app/sales/` have their own bare layouts.
- **Booking calendar**: `src/components/AvailabilityCalendar.jsx` is the shared calendar (legend + green/yellow/red/black cells + tooltips). It fetches `/villas/:id/availability` via `getVillaAvailability()` (`src/services/villaService.js`) and drives `checkIn`/`checkOut` through `onChange`. Used on the `VillaDetails` sidebar and the `/booking` form (`src/views/Booking.js`). Tooltips: yellow "Payment in progress. Availability is not guaranteed.", red "Booked."
- Landing page components consume CMS data via `LandingCmsProvider` (wraps `src/views/Home.js` only) → `useLandingCms()` returns `{ landing: { desktop, mobile }, loading, refetch }`; components pick `isMobile ? landing.mobile : landing.desktop` using `useIsMobile()` and fall back to hardcoded defaults if CMS is empty. Amenity/experience icons are stored as string names resolved through `src/constants/landingIcons.js` (`getLandingIcon`). Admin CMS UI lives in `src/components/admin/LandingCmsEditor.jsx` (Desktop/Mobile toggle, per-section editors, upload/preview/delete/reorder, save) wired to the `Landing CMS` tab in `src/views/AdminDashboard.js`.
- Code is plain JS (`.js`/`.jsx`), not TSX, despite the tsconfig.

## Verification

- Backend has no lint/typecheck/test — verify manually against the running API.
- Frontend: `npm run lint` (eslint) and `npm run build` (next build) in `villa-booking/frontend`. No test suite.
- An agent-generated frontend change should at minimum pass `npm run build` in `villa-booking/frontend`.
