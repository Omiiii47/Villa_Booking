# AGENTS.md

Luxury villa booking platform ("Solscape Stays"). Two packages under `villa-booking/`: a Next.js App Router frontend and an Express + Mongoose backend. They run as separate dev servers (no root workspace tooling). The legacy CRA app (`frontend/`) has been removed — `frontend-next/` is the active frontend and is wired to the backend API.

## Running the app

- Backend: `cd villa-booking/backend && npm run dev` (nodemon `server.js`), listens on port `5000`.
- Frontend: `cd villa-booking/frontend-next && npm run dev`, listens on `3000`. Run both. CORS is wide-open, so origin port doesn't matter.
- Frontend reaches the API at `http://localhost:5000/api` via `src/services/api.js` (axios, baseURL overridable with `NEXT_PUBLIC_API_URL`).
- Health check: `GET /api/health`.

## Seeding (non-obvious)

- DB seed is `node utils/seed.js` (run from `villa-booking/backend`). It is NOT an npm script. Running it **wipes** all `Villa` and `Amenity` collections.
- Creates sample villas/amenities and a default admin account if missing: `admin@villabooking.com` / `admin123`.
- `config/db.js` and `utils/seed.js` both hardcode `dns.setServers(['8.8.8.8','1.1.1.1'])` to resolve the Atlas SRV host. Leave this in place or seeding/DB bootstrap will fail on hosts with restrictive DNS.

## Config / secrets

- `villa-booking/backend/.env` exists locally but is **gitignored / not committed**; it holds the real Atlas `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`. Keep existing values as-is and do not introduce new secrets. Cloudinary values are stubbed placeholders.
- Backend uploads to a local `uploads/` dir via `multer` disk storage (5MB image limit); served statically at `/uploads`. Cloudinary is installed but not actually used for uploads.

## Auth & roles

- JWT auth: `protect` middleware requires a `Bearer <token>` header; `admin` middleware enforces `req.user.role === 'admin'` (`backend/middleware/auth.js`). Use `{ protect, admin }` for protected routes.
- Frontend stores the session in `localStorage` under key `villaUser`; `src/services/api.js` attaches its token as the Bearer header and redirects to `/login` on a 401 response.

## Backend notes

- CommonJS (`require`/`module.exports`), Express 5 + Mongoose 9. Routes are wired in `server.js`; one file per resource under `routes/`, `controllers/`, `models/`, `middleware/`. Note: `POST /api/contact` is handled inline in `contactRoutes.js` (no controller); site-content is the only resource served from `adminController`.
- Villa routes: `/featured` and `/slug/:slug` are registered before `/:id` — keep that order or they'll be shadowed (`routes/villaRoutes.js`). `POST /api/villas/upload-images` is admin-only, `upload.array('images', 10)` — max 10 images, 5MB each.
- `SiteContent` (hero/gallery/showcase) is lazily created with defaults on first read via `adminController.getOrCreateContent`. `GET /api/site-content` is public; `GET|PUT /api/admin/site-content` is admin-only.

## Frontend (frontend-next) notes

- Next.js **16.2.12** App Router + React 19, Tailwind CSS **v4** (via `@tailwindcss/postcss` — no `tailwind.config.js`), framer-motion/GSAP/@studio-freight/lenis for animation.
- Next 16 has breaking conventions vs. typical training data. `frontend-next/AGENTS.md` (also referenced by `CLAUDE.md`) requires reading the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
- Structure: thin `page.jsx` files in `app/` are `'use client'` wrappers that render views from `src/views/` (e.g. `app/(site)/villas/[slug]/page.jsx` → `VillaDetails`). Shared code lives in `src/components/`, `src/context/` (AuthContext, WishlistContext), `src/hooks/` (useSiteContent), `src/services/` (axios layer). Route groups `(site)` and `(auth)` each define their own animated client layout with Navbar.
- Code is plain JS (`.js`/`.jsx`), not TSX, despite the tsconfig.

## Verification

- Backend has no lint/typecheck/test — verify manually against the running API.
- Frontend: `npm run lint` (eslint) and `npm run build` (next build) in `frontend-next`. No test suite.
- An agent-generated frontend change should at minimum pass `npm run build` in `frontend-next`.
