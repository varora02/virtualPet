# Deployment

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Auth | Firebase Authentication (email/password) |
| Database | Cloud Firestore |
| Hosting / CI/CD | Vercel (auto-deploy on GitHub push) |
| Source control | GitHub |

---

## Stack Pros, Cons, and Scaling Challenges

### React 18 + Vite

**Pros:** Extremely fast local dev server (HMR in milliseconds). Vite produces content-hashed JS/CSS bundles, so browsers can cache assets forever and only re-fetch when code actually changes. React's component model keeps the game UI manageable as features grow.

**Cons:** Vite's build step (`npm run build`) is required before production deployment. In this project it hangs indefinitely in the Cowork VM environment — always skip it there. Vercel runs it fine in their own build environment. Single-page app means `index.html` itself has no hash, which causes browser caching problems if cache headers are misconfigured (see Browser Caching section below).

**Scaling:** Fine indefinitely for a small app. If bundle size grows, Vite's code-splitting and dynamic `import()` can chunk it.

---

### Firebase Authentication

**Pros:** Zero-config email/password auth. SDK handles session persistence (localStorage), token refresh, and re-auth. Works seamlessly with Firestore security rules.

**Cons:** Currently no email verification enforced. Auth rules are open during development — must be locked down before any public access (see Security Rules section).

**Scaling:** Firebase Auth scales to millions of users. No action needed at current scale.

---

### Cloud Firestore

**Pros:** Real-time `onSnapshot()` listeners give both users instant sync without polling. Atomic `increment()` prevents race conditions on coin/XP writes. `arrayUnion()` prevents overwritten activity log entries. No backend server needed.

**Cons:** Entire pet state lives in one shared document (`pets/shared-pet`). This is intentional for a couple app but means all users see the same world state — no per-user isolation. The `activities` array in `workouts/shared-workouts` is unbounded and will grow forever.

**Scaling challenges:**
- The `activities` array: append-only with no TTL. Before it gets large (>1000 entries), move to a subcollection or add a Cloud Function that prunes entries older than 30 days.
- `onSnapshot` on a single shared doc means every write (including coin ticks and stat decays) triggers a re-render for all connected clients. At 2 users this is fine. At 10+ concurrent users with frequent writes, consider batching writes or using Firestore's server-side aggregation.
- Security rules are open (dev mode). Must restrict to approved emails before any public-facing use.

---

### Vercel (Hosting + CI/CD)

**Pros:** Push to GitHub → live in ~60 seconds with zero config. Handles the Vite build in their cloud environment. Global CDN means fast load times anywhere. Preview deployments on non-main branches for safe testing.

**Cons:** Environment variables must be set in the Vercel dashboard separately from `.env.local`. Free tier has limits on build minutes (generous for this project). `vercel.json` is required to control cache headers (see below) — without it, `index.html` can be cached by browsers and partners won't see updates.

**Scaling:** Vercel CDN scales automatically. Firestore is the actual bottleneck at scale, not Vercel.

---

## Browser Caching — Why Partners Don't See Updates

When Vite builds the app it produces content-hashed JS and CSS files (e.g. `index-BrmAq44e.js`). The hash changes every build, so browsers always fetch fresh JS. But `index.html` itself has no hash — browsers can cache it and keep serving the old version, which points to old JS bundle filenames.

**The symptom:** You push new code, you see the update (your browser fetches fresh), but your partner's browser serves cached `index.html` → old JS → old app. A normal refresh doesn't fix it. Only clearing browser history (which clears the disk cache) works.

**The fix:** `vercel.json` at the project root tells Vercel to never cache `index.html` and to cache hashed assets forever:

```json
{
  "headers": [
    {
      "source": "/index.html",
      "headers": [{ "key": "Cache-Control", "value": "no-store" }]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

This file is committed to the repo. Vercel picks it up automatically on next deploy. After this, any browser will always get fresh `index.html` on every visit, and JS/CSS assets are cached forever (safe because their filenames change when code changes).

---

## Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.example .env.local   # or create .env.local manually

# 3. Start dev server
npm run dev
# → http://localhost:5173
```

### Environment Variables

Create `.env.local` in the project root with your Firebase project credentials:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

All variables must be prefixed with `VITE_` to be accessible in the browser via `import.meta.env`.

**Note:** `npm run build` hangs indefinitely in the Cowork VM environment. Never run it there. Vercel builds the app in their own cloud environment when you push to GitHub — this works correctly.

---

## Deployment Pipeline

**GitHub push → Vercel auto-deploy (zero config needed).**

1. Push to `main` branch on GitHub.
2. Vercel detects the push, runs `npm run build` (Vite build) in their cloud environment.
3. Output is deployed to the production URL automatically.
4. Preview deployments are created for non-main branches (useful for testing).

Vercel environment variables are set in the Vercel project dashboard — same `VITE_*` keys as `.env.local`.

---

## Firestore Structure

### `pets/shared-pet`

Single document shared by all users. All pet state lives here.

| Field | Type | Notes |
|-------|------|-------|
| `hunger` | number (0–100) | Decays over time, restored by feeding |
| `thirst` | number (0–100) | Decays over time, restored by watering |
| `energy` | number (0–100) | Decays during study, restored by rest |
| `happiness` | number (0–100) | Restored by play/study, decays if stats low |
| `level` | number | Pet level (1+) |
| `exp` | number | Total XP accumulated |
| `coins` | number | Current coin balance |
| `unlockedAreas` | array\<number\> | Area IDs unlocked (e.g. `[0, 1, 3]`) |
| `areaTiers` | map | `{ "0": 2, "4": 1 }` — tier per area |
| `activePet` | string | `"harold"` or `"bubby"` |
| `ghostBudActive` | boolean | Ghost Bud ability state |
| `purchasedAnimations` | array\<string\> | e.g. `["dumbbell_lift", "happy_hop"]` |
| `mood` | string | Current mood label (10 possible moods) |
| `lastInteraction` | timestamp | Last action time (drives mood decay) |
| `activeSession` | map \| null | Shared Pomodoro session state (see below) |

### `activeSession` fields

| Field | Type | Notes |
|-------|------|-------|
| `startedBy` | string | `userName` of whoever started the session |
| `startedAt` | timestamp | Firestore server timestamp — used as timer anchor |
| `durationMin` | number | Session length in minutes (default 25) |
| `participants` | array\<string\> | `["varun", "leena"]` — grows as partners join |
| `pausedAt` | timestamp \| null | Set when paused, cleared on resume |
| `totalPausedMs` | number | Accumulated pause time — deducted from elapsed |
| `status` | string | `"running"` \| `"paused"` \| `"completed"` |

### `workouts/shared-workouts`

Single document. Stores the activity feed and per-user workout state.

| Field | Type | Notes |
|-------|------|-------|
| `activities` | array\<object\> | Append-only log of all actions from all users |
| `activities[].user` | string | `"varun"` or `"leena"` |
| `activities[].type` | string | `"feed"`, `"water"`, `"play"`, `"rest"`, `"study"`, `"workout"` |
| `activities[].timestamp` | timestamp | When the action occurred |
| `activities[].coins` | number | Coins earned by this action |
| `workoutDoneToday` | map | `{ varun: bool, leena: bool }` — resets daily |
| `loginStreak` | map | Per-user consecutive login counts |

---

## Real-Time Sync

Two users see the same pet state in real time.

**How it works:**
1. On mount, `Game.jsx` subscribes to `pets/shared-pet` with `onSnapshot()`. Any Firestore write by either user instantly triggers a re-render for both.
2. Coin increments and XP updates use Firestore's `increment()` atomic operation to avoid race conditions when both users act simultaneously.
3. Activity log appends use `arrayUnion()` so concurrent appends don't overwrite each other.
4. `areaTiers` and `unlockedAreas` are written as full field updates (rare operations, low contention).

---

## User Model

**Two primary users:** Varun and Leena.
**One tester user:** supported (tester email pattern recognized, may have different permissions).
`userName` is derived from the Firebase Auth email — the part before `@` is used as the display name.

Currently hardcoded to 2 users. Firebase Auth rules should be updated before any public launch to restrict access to approved accounts only.

---

## Scaling Considerations

| Concern | Current State | Action Needed |
|---------|---------------|---------------|
| Shared pet doc | Fine for 2–3 users | No action now |
| `activities` array | Append-only, unbounded | Move to subcollection or add TTL cleanup before >1000 entries |
| `areaTiers` | Shared map in shared-pet | Intentional for a couple app |
| Concurrent writes | `increment()` / `arrayUnion()` | Safe for 2–3 users; fine as-is |
| Auth rules | Open (dev mode) | Lock to approved emails before public access |
| Browser caching | Fixed via `vercel.json` | Done — no-store on index.html |

---

## Firebase Security Rules

**Current state: open (development mode).** Rules must be tightened before public launch.

Minimum production rules:
- Only authenticated users can read/write.
- Restrict write access to `pets/shared-pet` and `workouts/shared-workouts` to approved user emails (or a known user group).
- Validate numeric fields stay within expected bounds (0–100 for stats, non-negative for coins).

```javascript
// Minimal example (not production-ready):
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.auth.token.email in ['varun@example.com', 'leena@example.com'];
    }
  }
}
```
