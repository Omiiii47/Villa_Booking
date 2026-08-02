# AGENTS.md

Luxury villa booking platform. Two independent packages under `villa-booking/`: a
Create React App frontend and an Express + Mongoose backend. They run as two
separate dev servers (no root workspace tooling).

## Running the app

- Backend: `cd villa-booking/backend && npm run dev` (nodemon `server.js`), listens on port `5000`.
- Frontend: `cd villa-booking/frontend && npm start`, listens on `3000`.
- Run both. CORS is wide-open, so origin port doesn't matter.
- Frontend reaches the API at `http://localhost:5000/api` via `src/services/api.js` (`axios`, baseURL overridable with `REACT_APP_API_URL`).
- Health check: `GET /api/health`.

## Seeding (non-obvious)

- DB seed is `node utils/seed.js` (run from `villa-booking/backend`, Redis-backed Mongoose). It is NOT an npm script. Running it **wipes** all `Villa` and `Amenity` collections.
- Creates sample villas/amenities and a default admin account if missing: `admin@villabooking.com` / `admin123`.
- `config/db.js` and `utils/seed.js` both hardcode `dns.setServers(['8.8.8.8','1.1.1.1'])` to resolve the Atlas SRV host. Leave this in place or seeding/DB bootstrap will fail on hosts with restrictive DNS.

## Config / secrets

- `villa-booking/backend/.env` holds the real Atlas `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`. It is committed/checked in — do not introduce new secrets; keep existing ones as-is. Cloudinary values are stubbed placeholders.
- Backend uploads to a local `uploads/` dir via `multer` disk storage (5MB image limit); served statically at `/uploads`. Cloudinary is installed but not actually used for uploads.

## Auth & roles

- JWT auth: `protect` middleware requires a `Bearer <token>` header; `admin` middleware enforces `req.user.role === 'admin'` (`backend/middleware/auth.js`). Use `{ protect, admin }` for protected routes.
- Backend is CommonJS (`require`/`module.exports`). Routes are wired in `server.js`; one file per resource under `routes/`, `controllers/`, `models/`, `middleware/`.

## Frontend conventions

- CRA + React 19, Tailwind CSS 3, `react-router-dom` v7, framer-motion/GSAP/@studio-freight/lenis for animation. Mixes `src/pages/`, `src/components/`, `src/services/` (axios API layer), `src/context/` (AuthContext, WishlistContext), `src/hooks/`.
- Do NOT run `npm run eject`.

## Verification

- No lint or typecheck script on the backend. Frontend: `npm test` (react-scripts, watch mode) — run with `CI=true` to run once. `npm run build` for production.
- An agent-generated change should at minimum pass `npm run build` in the frontend; backend has no checks, so verify manually against the running API.