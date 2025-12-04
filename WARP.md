# Ecolumina – Warp Agent Rules

## Overview

- This repo is a **React 19 + TypeScript PWA** built with **Vite**.
- The app is an AI-powered waste upcycling assistant:
  - Image analysis and DIY guides are powered by **Google Gemini** via `@google/genai` (see `services/gemini.ts`).
  - Auth and persistent leaderboard are handled by **Firebase** (see `services/firebase.ts`).
  - There is a LocalStorage-based “DB” for hack/demo scenarios (see `services/db.ts`).

When generating or editing code, assume this is a modern SPA that should stay fast, mobile‑friendly, and PWA‑compatible.

---

## Tech stack and entrypoints

- Build tool: **Vite**
  - Config: `vite.config.ts`
- Language: **TypeScript** (browser-targeted; `tsconfig.json` with `"moduleResolution": "bundler"`).
- UI:
  - React function components only.
  - Routing via `react-router-dom`:
    - Router and routes are defined in `App.tsx` using `HashRouter`.
    - Pages live in `pages/` (e.g. `Home.tsx`, `Scan.tsx`, `Result.tsx`, `Leaderboard.tsx`, `Workshop.tsx`).
    - Shared layout is in `components/Layout.tsx`.
  - Styling is via Tailwind‑style utility classes embedded in `className` strings (no CSS‑in‑JS).

**Agent rules:**

- When adding a new screen:
  - Put it under `pages/` as a React FC.
  - Wire it into routing in `App.tsx` (with `HashRouter` paths).
- Prefer TypeScript `.tsx` components and reuse existing types from `types.ts` instead of introducing ad‑hoc types.

---

## Environment & secrets

Environment variables are accessed from both Vite (`import.meta.env`) and `process.env` via helpers like `getEnv` in:

- `services/gemini.ts`
- `services/firebase.ts`

Important keys:

- `VITE_GEMINI_API_KEY` (recommended) or `GEMINI_API_KEY` – Gemini access.
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_PUBLIC_APP_URL` – optional explicit public app URL used in `utils/share.ts`.

**Agent rules:**

- Never hard‑code secrets or API keys.
- When suggesting config:
  - Use **Vite‑style env vars** (prefixed with `VITE_`) for anything used in the browser.
  - Follow the existing `getEnv` pattern (check `import.meta.env` first, then `process.env`).
- When showing examples, prefer `.env.local` with those keys.

---

## Development commands

Use the existing NPM scripts from `package.json`:

- `npm install` – install dependencies.
- `npm run dev` or `npm start` – start Vite dev server.
- `npm run build` – create production build.
- `npm run preview` – preview the production build.

**Agent rules:**

- When generating commands for local dev, use these scripts.
- Assume Node.js is installed; do **not** introduce other build systems or CLIs unless explicitly requested.

---

## Data & state conventions

### User & leaderboard

- **Source of truth (production):** Firebase Firestore (`services/firebase.ts`).
  - Anonymous auth: `signInAnonymously` + user doc setup in `signInAnonymousUser`.
  - Points & scan counts updated via `addPoints(uid, amount)`.
  - Realtime updates via `subscribeToUser` and `subscribeToLeaderboard`.
- **Local fallback (demo):** `services/db.ts` uses `localStorage` and mock leaderboard entries.

**Agent rules:**

- For any new **persistent user or leaderboard features**, prefer Firebase (Firestore) patterns from `services/firebase.ts`.
- Treat `services/db.ts` as a **demo fallback**, not the primary persistence layer.
- Keep types in sync with `UserProfile` from `types.ts` when extending user data.

### Gemini integration

Located in `services/gemini.ts`:

- Uses `GoogleGenAI` from `@google/genai`.
- Models:
  - `gemini-2.5-flash` for image analysis (`analyzeImage`) and DIY guide generation (`getDIYGuide`).
  - `verifyUpcycle` for validating completed projects.
- Responses are enforced via **typed JSON schemas** (`Type.OBJECT`, `Type.ARRAY`, etc.).
- Helper `cleanJSON` strips ```json fences before parsing.

**Agent rules:**

- When adding new Gemini calls:
  - Reuse the existing `ai` client and `getEnv` pattern.
  - Define **explicit `responseSchema`** objects to ensure typed JSON responses.
  - Prefer `responseMimeType: "application/json"` for structured outputs.
- Handle failures gracefully with user‑friendly fallbacks (see existing error handling in `analyzeImage`, `getDIYGuide`, `verifyUpcycle`).

---

## UI & UX conventions

- Components use React function components with `React.FC` and hooks (`useState`, `useEffect`).
- Layout:
  - The app is a **phone‑style viewport** (`max-w-md` container, full‑height layout, bottom nav in `Layout.tsx`).
- Loading / async:
  - Use centered spinners with utility classes (see:
    - `Home.tsx` loading state,
    - `Scan.tsx` analyzing state,
    - `Workshop.tsx` loading and verifying states).
- Feedback:
  - Prefer clear toasts or alerts for errors (current code uses `alert` in a few places).
  - Celebratory effects (e.g. confetti) use `canvas-confetti` as in `Workshop.tsx`.

**Agent rules:**

- When introducing new async flows, include:
  - A loading state + friendly message.
  - Error handling with human‑readable messages.
- Keep visual language consistent:
  - Tailwind‑style `className` utilities.
  - Material icons via `material-icons-round` spans.
- Do not introduce new styling systems (e.g. CSS Modules, styled‑components) unless specifically requested.

---

## Routing & navigation

- Router: `HashRouter` in `App.tsx` with routes:
  - `/` → `Home`
  - `/scan` → `Scan`
  - `/result` → `Result`
  - `/workshop` → `Workshop`
  - `/leaderboard` → `Leaderboard`
- `Layout.tsx` wraps routed pages and manages:
  - Safe full‑height container.
  - Bottom nav hidden on `/scan`.

**Agent rules:**

- For new pages:
  - Export a default React FC from `pages/<Name>.tsx`.
  - Register it in `App.tsx` with a corresponding `<Route path="..." element={<NewPage />} />`.
  - Respect bottom nav behavior; `/scan` should remain full‑screen.

---

## Sharing and PWA behavior

- Web Share API usage is centralized in `utils/share.ts` (`shareSuccess`).
- PWA and manifest configuration live in `vite.config.ts` via `VitePWA`.

**Agent rules:**

- When adding sharing or PWA‑related behavior:
  - Reuse `shareSuccess` instead of new direct `navigator.share` calls.
  - Update `VitePWA` manifest in `vite.config.ts` for new icons or metadata rather than creating separate manifest files.

---

## General coding standards

- TypeScript:
  - Prefer explicit types for public functions and exported values.
  - Reuse shared interfaces from `types.ts`.
- Code style:
  - Follow existing import style (absolute/relative as used; alias `@/*` is configured but not heavily used—stay consistent with nearby files).
  - Keep files focused: pages in `pages/`, services in `services/`, small helpers in `utils/`.

**Agent rules:**

- When refactoring:
  - Avoid large architecture changes; keep current directories and responsibilities.
  - Prefer small, focused helpers extracted into `services/` or `utils/` when logic is reused.
- When adding new dependencies:
  - Justify them in comments if they overlap with existing functionality.