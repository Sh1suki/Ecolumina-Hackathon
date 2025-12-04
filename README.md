# EcoLumina — AI Waste Upcycling

Transform waste into wonder — an AI-assisted app for identifying waste, following DIY upcycle guides, earning points, and sharing projects.

This repository contains the frontend (Vite + React + TypeScript) and helper services used during development.

**Quick links**
- Local dev: `npm run dev`
- Build: `npm run build`
- Preview production build: `npm run preview`

---

## Prerequisites
- Node.js (16+ recommended)
- A Firebase project if you want remote Auth/Firestore (optional: app supports a `localStorage` fallback during development)

## Environment variables
Create a `.env.local` at the project root with these keys (Vite requires `VITE_` prefix):

```
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_USE_LOCAL_DB=false  # set `true` to use localStorage fallback
VITE_PUBLIC_APP_URL=https://your-deployed-app.example.com
```

If you set `VITE_USE_LOCAL_DB=true` the app will use a localStorage-backed DB for development (no Firestore required).

---

## PWA icons & manifest
To ensure the installed app uses the correct icon, place your icons in the `public/` folder (project root):

- `public/pwa-192x192.png` (recommended size 192×192)
- `public/pwa-512x512.png` (recommended size 512×512)
- `public/favicon.svg` (SVG favicon)

The project is configured to include these assets in the PWA manifest. The `index.html` already links the manifest and icons, but to be sure:

- `index.html` should include:

```html
<link rel="manifest" href="/manifest.json">
<link rel="icon" href="/favicon.svg">
<link rel="apple-touch-icon" href="/pwa-192x192.png">
```

- `vite.config.ts` (via `vite-plugin-pwa`) should include these files in `includeAssets` and list the same icons in `manifest.icons`.

Important: after you change icons or manifest, the browser may serve a cached service worker. To ensure the new icons are used when installing the PWA, perform these steps on your device:

1. Open DevTools → Application → Service Workers → click "Unregister" for the current service worker.
2. Application → Clear storage → choose your site → Clear site data.
3. Remove the installed app from the device (if present), then open the site and install again.

On mobile, uninstall the app from home screen, clear site data, then reinstall.

---

## Firestore rules (recommended)
If you want shared project links to be viewable by anyone (public), apply the following Firestore rules in the Firebase Console → Firestore → Rules.

These rules:
- allow authenticated reads on `/users` (so leaderboard queries work),
- allow public reads on `/sharedProjects` so anyone can open a share link,
- allow authenticated creates on `/sharedProjects` only when `createdByUid == request.auth.uid`, and
- allow updates/deletes only by the original creator.

```js
rules_version = '2';
service cloud.firestore {
   match /databases/{database}/documents {

      match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
      }

      match /leaderboard/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
      }

      match /sharedProjects/{projectId} {
         allow read: if true;  // public read for share links

         allow create: if request.auth != null
            && request.resource.data.keys().hasAll(['title','projectName','createdBy','createdByUid','proofImage','originalImage','difficulty','points','createdAt'])
            && request.resource.data.createdByUid == request.auth.uid
            && request.resource.data.createdAt is timestamp;

         allow update, delete: if request.auth != null
            && resource.data.createdByUid == request.auth.uid;
      }
   }
}
```

Apply these rules if you intend share links to be accessible without sign-in. If you prefer to restrict read access, remove `allow read: if true;` and instead provide a server-side endpoint that returns shared projects.

---

## Testing the share & leaderboard flows
1. Start dev server:

```powershell
npm install
npm run dev
```

2. Sign in (Google or anonymous) and complete a Verify & Claim flow to save a shared project.
3. After sharing, copy the generated link — it should look like:

```
https://<host>/#/project/<docId>
```

where `<docId>` is the Firestore document id (usually in the form `uid_timestamp`).

4. Open the link in an Incognito window (not logged-in) — the shared project page should render. If it shows "Project Not Found":

- Confirm the document exists in Firestore `sharedProjects` collection.
- Confirm your Firestore rules allow public reads on `sharedProjects` (see rules above).
- Check browser DevTools → Console for errors.

5. Check leaderboard consistency by creating projects/awarding points under two different user accounts (A and B). Both should appear in `/#/leaderboard` ordered by points.

---

## Build & deploy
To build for production:

```powershell
npm run build
npm run preview  # local preview of production build
```

Deploy the output (the `dist/` folder) to your static hosting of choice.

---

## Troubleshooting tips
- If the installed PWA icon looks wrong, clear the site data and unregister the service worker (see PWA section above).
- If shared links open to Login or show "Project Not Found", check Firestore rules and confirm the shared document id exists.
- If Auth behaves oddly after edits, try sign-out → sign-in to refresh the auth token.

---

## Acknowledgements
EcoLumina uses the Gemini API for image verification in the verify flow and Firebase for Auth & Firestore (optional — local fallback available for dev).

If you'd like I can also add a short section showing how to configure an automated deployment (Netlify / Vercel) and a basic `.github/workflows` deploy pipeline.

