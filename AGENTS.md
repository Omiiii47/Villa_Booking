# AGENTS.md

Luxury villa booking platform. Three independent packages under `villa-booking/`:
a Create React App frontend, a Next.js migration in progress, and an Express +
Mongoose backend. They run as separate dev servers (no root workspace tooling).

## Running the app

- Backend: `cd villa-booking/backend && npm run dev` (nodemon `server.js`), listens on port `5000`.
- Frontend (the live CRA app): `cd villa-booking/frontend && npm start`, listens on `3000`.
- `villa-booking/frontend-next/` is an early, **untracked** Next.js 16.2.12 migration — still create-next-app boilerplate, NOT wired to the backend/API. Don't treat it as the active app. Its default dev port (3000) conflicts with the CRA app; use `next dev -p <port>` if running both.
- Run backend + CRA frontend. CORS is wide-open, so origin port doesn't matter.
- Frontend reaches the API at `http://localhost:5000/api` via `src/services/api.js` (`axios`, baseURL overridable with `REACT_APP_API_URL`).
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

- CommonJS (`require`/`module.exports`), Express 5 + Mongoose 9. Routes are wired in `server.js`; one file per resource under `routes/`, `controllers/`, `models/`, `middleware/` (contact + site-content share `adminController`).
- Villa routes: `/featured` and `/slug/:slug` are registered before `/:id` — keep that order or they'll be shadowed (`routes/villaRoutes.js`).
- `SiteContent` (hero/gallery/showcase) is lazily created with defaults on first read via `adminController.getOrCreateContent`. `GET /api/site-content` is public; `GET|PUT /api/admin/site-content` is admin-only.

## Frontend conventions

- CRA + React 19, Tailwind CSS 3, `react-router-dom` v7, framer-motion/GSAP/@studio-freight/lenis for animation. Mixes `src/pages/`, `src/components/`, `src/services/` (axios API layer), `src/context/` (AuthContext, WishlistContext), `src/hooks/`, `src/layouts/`.
- Do NOT run `npm run eject`.
- If you touch `frontend-next/`: its own `AGENTS.md` warns this Next.js major has breaking conventions vs. typical training data — read `node_modules/next/dist/docs/` there before writing code. It isn't wired to the API, so don't add API/backend code to it yet.

## Verification

- No lint or typecheck script on the backend. Frontend: `npm test` (react-scripts, watch mode) — run with `CI=true` to run once. `npm run build` for production.
- An agent-generated change should at minimum pass `npm run build` in the frontend; backend has no checks, so verify manually against the running API.
