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

---

## Deployment Pipeline

**GitHub push → Vercel auto-deploy (zero config needed).**

1. Push to `main` branch on GitHub.
2. Vercel detects the push, runs `npm run build` (Vite build).
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

| Concern | Current State | Notes |
|---------|---------------|-------|
| Shared pet doc | Fine for 2–3 users | Single doc with `onSnapshot` — no contention at this scale |
| `activities` array | Append-only, unbounded | Will grow indefinitely. Before launch: move to a subcollection (`workouts/shared-workouts/activities/`) or add a TTL/cleanup Cloud Function |
| `areaTiers` | Shared map in shared-pet | Everyone shares world progression — intentional for a couple app |
| Concurrent writes | `increment()` / `arrayUnion()` | Safe for 2–3 concurrent users; fine as-is |
| Auth at scale | Currently open rules | Must lock down before any public-facing deployment |

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
