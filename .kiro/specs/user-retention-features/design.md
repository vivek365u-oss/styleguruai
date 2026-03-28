# Design Document — User Retention Features

## Overview

This document describes the technical design for four user retention features added to StyleGuru AI: **User Profile Persistence**, **Virtual Wardrobe**, **Social Sharing (Style Profile Card)**, and **Weekly Style Tips (Scheduled Push Notifications)**.

The goal is to increase return visits and deepen engagement by ensuring users never lose their style data, can save outfits they like, can share their profile socially, and receive personalised weekly nudges to return to the app.

### Design Principles

- **Offline-first, cloud-backed**: localStorage remains the fast read path; Firestore is the source of truth for authenticated users.
- **No new npm packages** unless strictly necessary. Canvas API (native browser), Web Push API (native browser + existing sw.js), and the already-installed Firebase SDK v9+ cover all requirements.
- **Minimal backend surface**: The backend only handles push subscription storage and scheduled delivery. All profile/wardrobe/share logic runs client-side.
- **Theme-aware**: Every new UI component respects the existing `ThemeContext` dark/light toggle.
- **Auth-gated gracefully**: Unauthenticated users see prompts to log in rather than broken UI.

---

## Architecture

The four features map onto three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  React Frontend (Vite)                                      │
│                                                             │
│  Dashboard.jsx ──► WardrobePanel.jsx (new)                  │
│                ──► ShareCard.jsx (new, inline canvas)       │
│                ──► SettingsScreen (updated)                 │
│                                                             │
│  styleApi.js (updated — all new Firestore helpers here)     │
│    saveProfile / loadProfile                                │
│    saveWardrobeItem / getWardrobe / deleteWardrobeItem      │
│    savePushSubscription / deletePushSubscription            │
│    logShareEvent                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ Firestore SDK (client)
┌──────────────────────────▼──────────────────────────────────┐
│  Firestore                                                  │
│  users/{uid}/profile          (Style_Profile doc)           │
│  users/{uid}/wardrobe/{id}    (Wardrobe_Item docs)          │
│  users/{uid}/push_subscriptions/{id}  (PushSubscription)    │
│  users/{uid}/events/{id}      (share / analytics events)    │
│  users/{uid}/history/{id}     (existing analysis history)   │
└──────────────────────────┬──────────────────────────────────┘
                           │ Firebase Admin SDK (server)
┌──────────────────────────▼──────────────────────────────────┐
│  FastAPI Backend (Heroku)                                   │
│  Backend/main.py (updated — push subscription endpoints)    │
│  Backend/push_service.py (new — VAPID send + scheduler)     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow — Profile Persistence

```
Analysis complete
      │
      ▼
handleAnalysisComplete() in Dashboard.jsx
      │
      ├──► localStorage.setItem('sg_last_analysis', ...)   [immediate, offline]
      │
      └──► saveProfile(uid, profileData)  [async, non-blocking]
                │
                ├── success → no-op (localStorage already written)
                └── failure → toast "Profile not synced" (data safe in localStorage)

Login / auth state change
      │
      ▼
loadProfile(uid)
      │
      ├── Firestore doc exists → overwrite localStorage 'sg_last_analysis'
      │                        → apply saved gender mode + language
      └── no doc → keep localStorage as-is
```

### Data Flow — Virtual Wardrobe

```
"Save to Wardrobe" tap
      │
      ▼
saveWardrobeItem(uid, item)
      │
      ├── success → toast "Saved ✓", mark button saved
      └── failure → queue in localStorage 'sg_wardrobe_queue'
                  → retry on next app open with network

Wardrobe tab open
      │
      ▼
getWardrobe(uid)  [Firestore query, ordered by timestamp desc]
      │
      ├── success → render WardrobePanel list
      └── loading > 3s → error state
```

### Data Flow — Push Notifications

```
User enables notifications (Settings)
      │
      ▼
Notification.requestPermission()
      │
      ▼
navigator.serviceWorker.ready
      │
      ▼
registration.pushManager.subscribe({ userVisibleOnly, applicationServerKey })
      │
      ▼
POST /api/push/subscribe  (FastAPI)
      │
      ├── saves PushSubscription to Firestore users/{uid}/push_subscriptions
      └── sends welcome push via web-push library

Monday 09:00 IST (cron)
      │
      ▼
Tip_Scheduler.send_weekly_tips()
      │
      ├── reads all push_subscriptions from Firestore
      ├── for each: select tip filtered by skin_tone + color_season
      └── web-push.sendNotification(subscription, payload)
            ├── 410/404 → delete subscription from Firestore
            └── success → no-op
```

---

## Components and Interfaces

### Frontend — styleApi.js additions

All new Firestore service functions are added to `frontend/src/api/styleApi.js`.

```js
// Profile
saveProfile(uid: string, profile: StyleProfile): Promise<void>
loadProfile(uid: string): Promise<StyleProfile | null>

// Wardrobe
saveWardrobeItem(uid: string, item: WardrobeItem): Promise<string>  // returns docId
getWardrobe(uid: string): Promise<WardrobeItem[]>
deleteWardrobeItem(uid: string, itemId: string): Promise<void>
getWardrobeCount(uid: string): Promise<number>

// Push subscriptions
savePushSubscription(uid: string, sub: PushSubscriptionJSON, skinTone: string, colorSeason: string): Promise<void>
deletePushSubscription(uid: string, subId: string): Promise<void>

// Analytics
logShareEvent(uid: string, skinTone: string): Promise<void>
```

### Frontend — WardrobePanel.jsx (new component)

Props: `{ onShowResult: (data) => void }`

Responsibilities:
- Fetches wardrobe items via `getWardrobe(uid)` on mount
- Renders skeleton loading state (3 cards) while fetching
- Renders scrollable list of `WardrobeItemCard` sub-components
- Handles delete with optimistic UI removal
- Shows "Login to save outfits" when unauthenticated
- Shows 50-item cap warning when count ≥ 50

### Frontend — ShareCard.jsx (new component, used inline in ResultsDisplay)

Props: `{ analysisData: object, userName: string, theme: 'dark' | 'light' }`

Responsibilities:
- Renders a hidden `<canvas>` element (1080×1080)
- `generateCard()` draws: background, skin swatch, labels, color row, branding
- `shareCard()` calls Web Share API or falls back to download
- Exposes a "Share My Style" button with loading/disabled state

### Frontend — Dashboard.jsx changes

- Add `wardrobe` to `navItems` array (👗 icon, between outfit and history)
- Import and render `<WardrobePanel>` for `activeTab === 'wardrobe'`
- Pass `onSaveToWardrobe` callback down to `ResultsDisplay` and `OutfitChecker`
- On `handleAnalysisComplete`: call `saveProfile()` after localStorage write
- On auth state change (in `App.jsx`): call `loadProfile()` and apply preferences

### Frontend — SettingsScreen changes

- Replace the existing notification button logic with full `Notification_Service` flow:
  - Subscribe via `pushManager.subscribe()`
  - POST to `/api/push/subscribe`
  - Show "Enabled ✓ / Blocked / Not yet enabled" status
  - When status is "Blocked": show link to `chrome://settings/content/notifications` (or equivalent)
  - "Disable" button calls `deletePushSubscription()` + unsubscribes from push manager

### Backend — main.py additions

```python
POST /api/push/subscribe    # save subscription + send welcome push
DELETE /api/push/unsubscribe  # delete subscription from Firestore
POST /api/push/send-weekly  # manual trigger (admin/cron)
```

### Backend — push_service.py (new file)

```python
class PushService:
    def __init__(self, vapid_private_key, vapid_public_key, vapid_claims)
    def send_notification(subscription_info: dict, payload: dict) -> bool
    def send_weekly_tips(db: FirestoreClient) -> dict  # returns {sent, failed, deleted}
    def get_tip_for_user(skin_tone: str, color_season: str) -> str
    def _delete_stale_subscription(db, uid, sub_id)

TIPS_POOL: list[dict]  # 20+ tips with skin_tone and color_season tags
```

---

## Data Models

### StyleProfile (Firestore: `users/{uid}/profile`)

```typescript
{
  skin_tone: string,          // "fair" | "light" | "medium" | "olive" | "brown" | "dark"
  undertone: string,          // "warm" | "cool" | "neutral"
  color_season: string,       // "Spring" | "Summer" | "Autumn" | "Winter"
  skin_hex: string,           // e.g. "#C68642"
  confidence: number,         // 0–100
  best_colors: Array<{ name: string, hex: string, reason: string }>,
  gender_mode: "male" | "female",
  language: "en" | "hinglish",
  analyzed_at: string,        // ISO 8601 UTC timestamp
  updated_at: string          // ISO 8601 UTC timestamp
}
```

### WardrobeItem (Firestore: `users/{uid}/wardrobe/{itemId}`)

```typescript
{
  id: string,                 // Firestore doc ID (auto)
  source: "analysis" | "outfit_checker",
  outfit_data: {
    shirt?: string, pant?: string, dress?: string,
    shoes?: string, occasion?: string,
    colors?: Array<{ name: string, hex: string }>
  },
  skin_tone: string,          // skin tone at time of save
  skin_hex: string,           // skin hex at time of save
  compatibility_score?: number, // only for outfit_checker source
  saved_at: string            // ISO 8601 UTC timestamp
}
```

### PushSubscription (Firestore: `users/{uid}/push_subscriptions/{subId}`)

```typescript
{
  endpoint: string,
  keys: { p256dh: string, auth: string },
  skin_tone: string,
  color_season: string,
  created_at: string          // ISO 8601 UTC timestamp
}
```

### ShareEvent (Firestore: `users/{uid}/events/{eventId}`)

```typescript
{
  type: "share",
  skin_tone: string,
  timestamp: string           // ISO 8601 UTC timestamp
}
```

### Firestore Security Rules (additions)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### Backend Environment Variables

| Variable | Purpose |
|---|---|
| `VAPID_PRIVATE_KEY` | VAPID private key (base64url) |
| `VAPID_PUBLIC_KEY` | VAPID public key (sent to client) |
| `VAPID_CLAIMS_EMAIL` | mailto: claim for VAPID |
| `FIREBASE_CREDENTIALS_JSON` | existing Firebase Admin credentials |

### Canvas Layout — Style_Card (1080×1080)

```
┌─────────────────────────────────────────┐  1080px
│  [background: #1e1b4b dark / #fff light]│
│                                         │
│  ┌──────────────────────────────────┐   │  y=80
│  │  "{Name}'s Style Profile"  bold  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────┐  Skin Tone: Medium Warm   │  y=200
│  │ 200×200  │  Season: Autumn           │
│  │ skin hex │  Undertone: Warm          │
│  └──────────┘                           │
│                                         │
│  Best Colors:                           │  y=480
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│  │   │ │   │ │   │ │   │ │   │        │  120×120 swatches
│  └───┘ └───┘ └───┘ └───┘ └───┘        │
│  #hex  #hex  #hex  #hex  #hex          │
│                                         │
│  StyleGuru AI  ·  styleguruai.in        │  y=950
└─────────────────────────────────────────┘
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Profile Round-Trip

*For any* valid StyleProfile object (containing skin_tone, undertone, color_season, skin_hex, best_colors, gender_mode, language, and timestamps), calling `saveProfile(uid, profile)` followed by `loadProfile(uid)` should return an object that is deeply equal to the original profile.

This covers the save-on-analysis path (Req 1.1), the overwrite-on-new-analysis path (Req 1.4), the cross-device restore path (Req 1.7), and the preferences persistence path (Req 1.8).

**Validates: Requirements 1.1, 1.4, 1.7, 1.8, 5.2**

---

### Property 2: Profile Data Drives UI Rendering

*For any* valid StyleProfile loaded from Firestore, the rendered Home screen component should contain the skin tone swatch color (skin_hex), the undertone string, the color season label, the gender_mode value, and the language value — without requiring a new photo upload.

**Validates: Requirements 1.3, 1.9**

---

### Property 3: Unauthenticated State Never Touches Firestore

*For any* call to `saveProfile`, `loadProfile`, `saveWardrobeItem`, `getWardrobe`, `savePushSubscription`, or `deletePushSubscription` when `auth.currentUser` is null, the function should return early (or return a null/empty result) and should never invoke any Firestore SDK method.

**Validates: Requirements 1.5, 2.10**

---

### Property 4: Wardrobe CRUD Round-Trip

*For any* valid WardrobeItem, calling `saveWardrobeItem(uid, item)` and then `getWardrobe(uid)` should return a list that contains an item with equivalent outfit_data, source, skin_tone, and skin_hex fields. Subsequently calling `deleteWardrobeItem(uid, itemId)` and then `getWardrobe(uid)` should return a list that does not contain that item.

**Validates: Requirements 2.3, 2.8**

---

### Property 5: Wardrobe Ordering Invariant

*For any* collection of WardrobeItems with distinct `saved_at` timestamps, `getWardrobe(uid)` should return them ordered by `saved_at` descending (newest first).

**Validates: Requirements 2.5**

---

### Property 6: Save-to-Wardrobe Button Visibility by Compatibility Score

*For any* outfit checker result, the "Save to Wardrobe" button should be rendered if and only if the `compatibility_score` is greater than or equal to 70.

**Validates: Requirements 2.2**

---

### Property 7: Wardrobe Item Detail Renders All Fields

*For any* valid WardrobeItem, the detail view component should render the outfit combination data (shirt/pant/dress/shoes/occasion), the skin tone swatch (skin_hex), and the source label — with no required field missing or undefined in the output.

**Validates: Requirements 2.7**

---

### Property 8: Style_Card Contains All Required Fields

*For any* valid analysis result and user display name, calling `generateCard(analysisData, userName, theme)` should produce a canvas whose drawn content includes: the user's first name, the skin tone hex color fill, the skin tone label, the color season label, up to 5 best color swatches, and the tagline "styleguruai.in".

**Validates: Requirements 3.2, 3.9**

---

### Property 9: Style_Card Dimensions Invariant

*For any* valid input to `generateCard()`, the resulting canvas element should have `width === 1080` and `height === 1080`.

**Validates: Requirements 3.3**

---

### Property 10: Style_Card Theme Background

*For any* valid analysis result, when `theme === 'dark'` the canvas background fill should be `#1e1b4b`, and when `theme === 'light'` the canvas background fill should be `#ffffff`.

**Validates: Requirements 3.8**

---

### Property 11: Share Event Logged to Firestore

*For any* share or download action triggered by `shareCard()`, a document should be written to `users/{uid}/events` with `type === "share"`, a non-empty `skin_tone` string, and a valid ISO 8601 `timestamp`.

**Validates: Requirements 3.10**

---

### Property 12: Tip Selection Matches User Profile

*For any* user with a non-null `skin_tone` and `color_season`, `get_tip_for_user(skin_tone, color_season)` should return a tip string that is tagged for that skin_tone or color_season (i.e. the tip is not from a pool entry whose tags explicitly exclude that skin_tone/season).

**Validates: Requirements 4.4**

---

### Property 13: Generic Tip When No Profile

*For any* call to `get_tip_for_user(None, None)` (or with empty strings), the function should return a non-empty tip string from the generic tips pool rather than raising an exception or returning null.

**Validates: Requirements 4.10**

---

### Property 14: Notification Permission Status Displayed Correctly

*For any* value of `Notification.permission` (`"granted"`, `"denied"`, `"default"`), the Settings screen component should render the corresponding status label ("Enabled ✓", "Blocked", or "Not yet enabled") and should render the browser settings link if and only if the status is `"denied"`.

**Validates: Requirements 4.11**

---

### Property 15: Push Subscription Round-Trip

*For any* valid PushSubscription JSON object, calling `savePushSubscription(uid, sub, skinTone, colorSeason)` and then reading the document from Firestore should return an object with equivalent `endpoint`, `keys.p256dh`, `keys.auth`, `skin_tone`, and `color_season` fields. Subsequently calling `deletePushSubscription(uid, subId)` should result in the document no longer existing in Firestore.

**Validates: Requirements 4.1, 4.7**

---

### Property 16: Notification Display Fields

*For any* push payload delivered to sw.js, the displayed notification should have `title === "StyleGuru AI 🎨"`, a non-empty `body` string, `icon === "/favicon.svg"`, and `data.url === "/dashboard"`.

**Validates: Requirements 4.5**

---

### Property 17: Logout Preserves localStorage

*For any* app state where `localStorage` contains `sg_analysis_history` and `sg_last_analysis`, calling the logout function should clear in-memory React state but should leave both localStorage keys intact with their original values.

**Validates: Requirements 5.1**

---

### Property 18: All Firestore Paths Scoped to uid

*For any* uid string, every Firestore document path constructed by `saveProfile`, `loadProfile`, `saveWardrobeItem`, `getWardrobe`, `deleteWardrobeItem`, `savePushSubscription`, `deletePushSubscription`, and `logShareEvent` should begin with `users/{uid}/` — ensuring data is always scoped to the authenticated user.

**Validates: Requirements 5.4**

---

## Error Handling

### Profile Service

| Scenario | Handling |
|---|---|
| Firestore write fails on save | Retain data in localStorage; show non-blocking toast "Profile not synced — will retry on next login" |
| Firestore read fails on login | Fall back to localStorage `sg_last_analysis`; no error shown to user |
| `auth.currentUser` is null | Return early; no Firestore call; no error |

### Wardrobe Service

| Scenario | Handling |
|---|---|
| Save fails (network error) | Queue item in `localStorage` key `sg_wardrobe_queue`; show toast "Saved offline — will sync when connected" |
| Fetch fails | Show error state in WardrobePanel after 3s skeleton timeout |
| Delete fails | Show toast "Delete failed — please try again"; restore item in UI |
| 50-item cap reached | Show modal: "Wardrobe full (50/50). Delete the oldest item to make space?" with confirm/cancel |

### Share Service

| Scenario | Handling |
|---|---|
| Canvas render fails | Show error toast "Could not generate card"; log error to console; do not crash |
| Web Share API not supported | Fall back to `<a download>` PNG download |
| Web Share API rejects (user cancels) | Silently ignore `AbortError`; re-enable button |
| Firestore event log fails | Log to console; do not block the share action |

### Push Notification Service

| Scenario | Handling |
|---|---|
| `pushManager.subscribe()` fails | Show toast "Could not enable notifications"; log error |
| POST `/api/push/subscribe` fails | Show toast "Subscription not saved — please try again" |
| 410/404 from push service (backend) | Delete stale subscription from Firestore; log to server console |
| Browser does not support Push API | Hide notification UI entirely; no error shown |
| Notification permission "denied" | Show "Blocked" status + link to browser settings |

### Cross-Feature

| Scenario | Handling |
|---|---|
| Firestore security rule rejection | Show user-facing error in current language (English/Hinglish); log rejection to console |
| Firebase Auth token expired mid-session | Axios interceptor will call `getIdToken(true)` to force refresh; if that fails, redirect to login |

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- **Unit tests** cover specific examples, integration points, and error conditions.
- **Property-based tests** verify universal correctness across all valid inputs.

### Property-Based Testing

**Library**: [fast-check](https://github.com/dubzzz/fast-check) (JavaScript/TypeScript, works with Vitest — already in the Vite ecosystem; no new test runner needed).

**Backend (Python)**: [Hypothesis](https://hypothesis.readthedocs.io/) for `push_service.py` tip selection properties.

**Configuration**: Each property test must run a minimum of **100 iterations** (fast-check default is 100; set explicitly via `{ numRuns: 100 }`).

**Tag format**: Each test must include a comment:
```
// Feature: user-retention-features, Property N: <property_text>
```

**Property test mapping**:

| Property | Test file | Library |
|---|---|---|
| P1 Profile round-trip | `__tests__/profileService.property.test.js` | fast-check |
| P2 Profile data drives UI | `__tests__/profileUI.property.test.js` | fast-check |
| P3 Unauthenticated no Firestore | `__tests__/profileService.property.test.js` | fast-check |
| P4 Wardrobe CRUD round-trip | `__tests__/wardrobeService.property.test.js` | fast-check |
| P5 Wardrobe ordering | `__tests__/wardrobeService.property.test.js` | fast-check |
| P6 Save button by score | `__tests__/outfitChecker.property.test.js` | fast-check |
| P7 Wardrobe item detail | `__tests__/wardrobePanel.property.test.js` | fast-check |
| P8 Card contains all fields | `__tests__/shareCard.property.test.js` | fast-check |
| P9 Card dimensions | `__tests__/shareCard.property.test.js` | fast-check |
| P10 Card theme background | `__tests__/shareCard.property.test.js` | fast-check |
| P11 Share event logged | `__tests__/shareCard.property.test.js` | fast-check |
| P12 Tip matches profile | `Backend/tests/test_push_service.py` | Hypothesis |
| P13 Generic tip when no profile | `Backend/tests/test_push_service.py` | Hypothesis |
| P14 Notification status display | `__tests__/settingsScreen.property.test.js` | fast-check |
| P15 Push subscription round-trip | `__tests__/pushService.property.test.js` | fast-check |
| P16 Notification display fields | `__tests__/sw.property.test.js` | fast-check |
| P17 Logout preserves localStorage | `__tests__/dashboard.property.test.js` | fast-check |
| P18 Firestore paths scoped to uid | `__tests__/styleApi.property.test.js` | fast-check |

### Unit Tests

Unit tests focus on:
- **Specific examples**: welcome notification sent on first subscription, share event document structure
- **Integration points**: `handleAnalysisComplete` calls both localStorage and `saveProfile`; login handler calls `loadProfile` and applies preferences
- **Error conditions**: Firestore write failure queues to localStorage; canvas failure shows toast; 410 response deletes subscription
- **Edge cases**: 50-item wardrobe cap prompt; compatibility score exactly 70 shows button; score 69 does not; empty profile returns generic tip

**Test files**:
- `frontend/src/__tests__/profileService.unit.test.js`
- `frontend/src/__tests__/wardrobeService.unit.test.js`
- `frontend/src/__tests__/shareCard.unit.test.js`
- `frontend/src/__tests__/pushService.unit.test.js`
- `Backend/tests/test_push_service.py`

### Firestore Security Rules

Test Firestore security rules using the **Firebase Emulator Suite** (`firebase emulators:start`):
- Verify a user can read/write `users/{uid}/**` when authenticated as that uid
- Verify a user cannot read/write `users/{other_uid}/**`
- Verify unauthenticated requests are rejected for all paths under `users/`

These are example-based tests run against the local emulator, not property tests.
