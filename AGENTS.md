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
- Creates sample villas/amenities and a default admin account if missing: `admin@villabooking.com` / `admin123`. The admin is created in the **`Admin` collection** (model `Admin.js`) — not as a `User` with a `role`. For an existing DB where the admin only exists in `User`, create the `Admin` doc manually (e.g. a one-off script) or re-seed.
- `config/db.js` and `utils/seed.js` both hardcode `dns.setServers(['8.8.8.8','1.1.1.1'])` to resolve the Atlas SRV host. Leave this in place or seeding/DB bootstrap will fail on hosts with restrictive DNS.

## Config / secrets

- `villa-booking/backend/.env` exists locally but is **gitignored / not committed**; it holds the real Atlas `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`. Keep existing values as-is and do not introduce new secrets. Cloudinary values are stubbed placeholders.
- Backend uploads to a local `uploads/` dir via `multer` disk storage (5MB image limit); served statically at `/uploads`. Cloudinary is installed but not actually used for uploads.

## Auth: fully separate user & admin systems

- Two independent auth systems share **nothing**: separate models (`User`, `Admin`), guards (`middleware/userAuth.js` → `userProtect`, `middleware/adminAuth.js` → `adminProtect`), controllers, routes, and frontend sessions. There is no `role` field on `User` anymore.
- JWTs carry a `type` claim (`'user'`/`'admin'`); each guard verifies the token and looks up the doc in its own model, so a user token can never authenticate an admin endpoint and vice versa (verified: 401 both directions). Both sign with the same `JWT_SECRET`/`JWT_EXPIRE` — do not add new secrets. Guards attach `req.user` (User) or `req.admin` (Admin); controllers must read the right one.
- User endpoints: `/api/auth/*` (register/login/profile/wishlist) + user-protected `/api/bookings` (own bookings only) + `/api/reviews` (create, delete own).
- Admin endpoints: `/api/admin-auth/*` (login/me) + `/api/admin/*` (CMS, all bookings, booking status/delete, review delete) + admin-only `/api/users` (user management) + villa write routes (`POST/PUT/DELETE /api/villas`, `/upload-images`).

## Frontend sessions & guards

- User session in `localStorage` key `solscapeUser`; admin in `solscapeAdmin`. Logging out of one never touches the other.
- `src/services/userApi.js` attaches the user token and redirects to `/login` on 401; `src/services/adminApi.js` does the same for admin → `/admin`. `src/services/api.js` is a plain public instance (no token logic). Login requests skip the 401 redirect (checked by URL in the interceptor) so a bad password surfaces the error instead of bouncing.
- Contexts: `src/context/UserAuthContext.js` (`useUserAuth`), `src/context/AdminAuthContext.js` (`useAdminAuth`). Route guards: `src/components/guards/UserGuard.jsx` → `/login`, `AdminGuard.jsx` → `/admin`.
- Routes: `/login` + `/register` are user auth; `/admin` is the admin login; `/admin/dashboard` is admin-protected. Admin pages live under `app/admin/` (no site Navbar/Footer); user auth pages under the `(auth)` route group.

## Backend notes

- CommonJS (`require`/`module.exports`), Express 5 + Mongoose 9. Routes are wired in `server.js`; one file per resource under `routes/`, `controllers/`, `models/`, `middleware/`. Note: `POST /api/contact` is handled inline in `contactRoutes.js` (no controller); admin controllers are `cmsController`, `adminBookingController`, `adminReviewController`.
- Villa routes: `/featured` and `/slug/:slug` are registered before `/:id` — keep that order or they'll be shadowed (`routes/villaRoutes.js`). `POST /api/villas/upload-images` is admin-only, `upload.array('images', 10)` — max 10 images, 5MB each.
- **Landing CMS** (`controllers/cmsController.js`, `models/CmsSection.js`): scalable module+section+platform keyed docs — `{ module: 'landing', section, platform: 'desktop'|'mobile', data }`. Landing sections: `hero`, `showcase`, `gallery`, `amenities`, `experiences`, `testimonials`, `faqs`, `newsletter`. All 16 docs (8 sections × 2 platforms) are lazily created from `DEFAULT_LANDING` in `cmsController.js` on first read — no explicit seed step. Public `GET /api/cms/landing` returns `{ desktop: {...}, mobile: {...} }`; admin `GET|PUT /api/admin/cms` reads/upserts it. Admin image upload: `POST /api/admin/cms/upload` (multer **memory** storage → Cloudinary, returns `{ url, publicId }`); delete: `DELETE /api/admin/cms/image` `{ publicId }`. Cloudinary is configured in `utils/cloudinary.js` from env vars; the upload routes return a clear error if `CLOUDINARY_*` are unset/stubbed (they are stubs in local `.env`). `middleware/upload.js` (disk storage) is used only by the villa upload route; `middleware/uploadMemory.js` is the CMS one.

## Frontend (frontend-next) notes

- Next.js **16.2.12** App Router + React 19, Tailwind CSS **v4** (via `@tailwindcss/postcss` — no `tailwind.config.js`), framer-motion/GSAP/@studio-freight/lenis for animation.
- Next 16 has breaking conventions vs. typical training data. `villa-booking/frontend/AGENTS.md` (also referenced by `CLAUDE.md`) requires reading the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
- Structure: thin `page.jsx` files in `app/` are `'use client'` wrappers that render views from `src/views/` (e.g. `app/(site)/villas/[slug]/page.jsx` → `VillaDetails`). Shared code lives in `src/components/`, `src/context/` (UserAuthContext, AdminAuthContext, WishlistContext, LandingCmsContext), `src/hooks/` (useIsMobile), `src/services/` (axios layer). Route groups `(site)` and `(auth)` each define their own animated client layout with Navbar; `app/admin/` has its own bare layout.
- Landing page components consume CMS data via `LandingCmsProvider` (wraps `src/views/Home.js` only) → `useLandingCms()` returns `{ landing: { desktop, mobile }, loading, refetch }`; components pick `isMobile ? landing.mobile : landing.desktop` using `useIsMobile()` and fall back to hardcoded defaults if CMS is empty. Amenity/experience icons are stored as string names resolved through `src/constants/landingIcons.js` (`getLandingIcon`). Admin CMS UI lives in `src/components/admin/LandingCmsEditor.jsx` (Desktop/Mobile toggle, per-section editors, upload/preview/delete/reorder, save) wired to the `Landing CMS` tab in `src/views/AdminDashboard.js`.
- Code is plain JS (`.js`/`.jsx`), not TSX, despite the tsconfig.

## Verification

- Backend has no lint/typecheck/test — verify manually against the running API.
- Frontend: `npm run lint` (eslint) and `npm run build` (next build) in `villa-booking/frontend`. No test suite.
- An agent-generated frontend change should at minimum pass `npm run build` in `villa-booking/frontend`.
