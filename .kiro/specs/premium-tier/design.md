# Design Document — Premium Tier (Freemium Model)

## Overview

StyleGuru AI currently serves all features to every authenticated user with no limits. This design introduces a freemium model: a **Free** tier (default) and a **Pro** tier (₹31/month via Razorpay). The implementation spans three layers:

- **Frontend**: React context + hooks for plan/usage state, gated UI components (blur/lock overlays, paywall modal), and Razorpay Checkout integration.
- **Backend**: Two new FastAPI endpoints (`POST /api/payment/create-order`, `POST /api/payment/verify`) using the `razorpay` Python SDK.
- **Firestore**: New subcollections for subscription and usage data, with updated security rules.

The design is intentionally additive — existing components are wrapped or extended rather than rewritten.

---

## Architecture

```mermaid
graph TD
    subgraph Frontend
        A[App.jsx] --> B[PlanContext / usePlan]
        B --> C[Plan_Gate checks]
        C -->|blocked| D[PaywallModal]
        C -->|allowed| E[Feature Components]
        D --> F[Razorpay Checkout JS]
        F -->|payment success| G[POST /api/payment/verify]
        E --> H[LockOverlay on gated sections]
    end

    subgraph Backend
        G --> I[Verify Razorpay HMAC-SHA256]
        I -->|valid| J[Write Firestore subscription]
        I -->|invalid| K[HTTP 400]
        L[POST /api/payment/create-order] --> M[Razorpay SDK create_order]
    end

    subgraph Firestore
        J --> N[users/{uid}/subscription]
        B --> N
        B --> O[users/{uid}/usage/{YYYY-MM}]
        C --> O
    end
```

### Key Design Decisions

1. **Razorpay loaded via CDN script tag** — avoids bundling the SDK, keeps bundle size small, and matches Razorpay's recommended integration pattern for SPAs.
2. **PlanContext as single source of truth** — all components read `{ plan, usage, isPro, refreshPlan }` from context; no prop-drilling.
3. **Usage check happens before the API call** — the Plan_Gate reads Firestore usage counts before dispatching the analysis/outfit-check request, preventing wasted API calls.
4. **Subscription writes are backend-only** — the `users/{uid}/subscription` document is never written from the client; only the Firebase Admin SDK (via the payment verify endpoint) can write it.
5. **Monthly reset is implicit** — usage documents are keyed by `YYYY-MM`; a new month automatically starts a fresh document with zero counts.

---

## Components and Interfaces

### Frontend

#### `PlanContext` (new — `frontend/src/context/PlanContext.jsx`)

```jsx
// Context shape
{
  plan: 'free' | 'pro',          // current plan
  usage: {
    analyses_count: number,       // current month
    outfit_checks_count: number,
  },
  isPro: boolean,                 // derived: plan === 'pro' && valid_until > now
  validUntil: string | null,      // ISO date string for pro users
  loading: boolean,
  refreshPlan: () => Promise<void>
}
```

Provided at the root of `App.jsx`, wrapping all authenticated routes. Reads `users/{uid}/subscription` and `users/{uid}/usage/{YYYY-MM}` on mount and caches in memory for the session.

#### `usePlan` hook (new — `frontend/src/hooks/usePlan.js`)

```js
// Returns the PlanContext value
const { plan, usage, isPro, refreshPlan } = usePlan();
```

Thin wrapper around `useContext(PlanContext)`. Throws if used outside the provider.

#### `PaywallModal` (new — `frontend/src/components/PaywallModal.jsx`)

Props:
```ts
{
  isOpen: boolean,
  onClose: () => void,
  triggerMessage: string,   // e.g. "6 analyses used this month. Upgrade to Pro for unlimited."
}
```

Renders as a bottom sheet on mobile (`fixed bottom-0`) and a centred modal on desktop (`fixed inset-0 flex items-center justify-center`). Contains:
- Trigger message at top
- Free vs Pro feature comparison table
- Primary CTA: "Upgrade to Pro — ₹31/month" → triggers Razorpay flow
- Secondary: "Maybe later" → calls `onClose`

#### `LockOverlay` (new — `frontend/src/components/LockOverlay.jsx`)

Props:
```ts
{
  onUpgrade: () => void,   // opens PaywallModal
}
```

Renders `position: absolute; inset: 0` over a `position: relative` parent. Shows a lock icon (🔒) and "Upgrade to Pro ₹31/month" button centred. The parent wraps the blurred content in `filter: blur(4px); pointer-events: none`.

#### `Plan_Gate` logic (inline in existing components)

Not a separate component — a pattern applied inside existing components:

```jsx
// Example: before starting analysis
const { isPro, usage, refreshPlan } = usePlan();

const handleAnalyze = () => {
  if (!isPro && usage.analyses_count >= 6) {
    setPaywallMessage('6 analyses used this month. Upgrade to Pro for unlimited.');
    setPaywallOpen(true);
    return;
  }
  // proceed with analysis...
};
```

#### Razorpay Integration (inside `PaywallModal`)

Razorpay Checkout is loaded via a `<script>` tag injected into `<head>` on demand:

```js
const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.head.appendChild(script);
});
```

Payment flow inside `PaywallModal`:
1. Call `POST /api/payment/create-order` → get `order_id`
2. Open `new window.Razorpay({ key, amount, order_id, ... })` with `handler` callback
3. `handler` receives `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
4. POST those to `/api/payment/verify` with Firebase Auth token
5. On success: call `refreshPlan()`, show success toast, close modal

#### Modified Components

| Component | Change |
|---|---|
| `UploadSection.jsx` / `Dashboard.jsx` | Add Plan_Gate check before dispatching `analyzeImage` |
| `OutfitChecker.jsx` | Add Plan_Gate check before dispatching `checkOutfitCompatibility` |
| `ResultsDisplay.jsx` | Wrap outfit combos 3–5 in blur div + `LockOverlay`; wrap Accessories tab and Makeup section in blur div + `LockOverlay` |
| `WardrobePanel.jsx` | Check wardrobe count before `saveWardrobeItem`; show inline error if limit hit |
| `HistoryPanel.jsx` | Pass `limit(isPro ? 20 : 5)` to Firestore query; show upgrade prompt after 5th item for free users |
| `Dashboard.jsx` (HomeScreen) | Conditionally render `<AdSense />` only when `!isPro` |
| `Dashboard.jsx` (SettingsScreen) | Add plan badge, usage bars, upgrade button / valid-until date |
| `styleApi.js` | Add `getSubscription`, `getUsage`, `incrementUsage`, `createPaymentOrder`, `verifyPayment` |

### Backend

#### `POST /api/payment/create-order`

```python
class CreateOrderRequest(BaseModel):
    pass  # amount is fixed server-side

# Response
{ "order_id": "order_XXXX", "amount": 3100, "currency": "INR" }
```

Creates a Razorpay order for 3100 paise (₹31). Requires Firebase Auth token. Amount is hardcoded server-side — never trusted from the client.

#### `POST /api/payment/verify`

```python
class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# Success response
{ "status": "success", "valid_until": "2025-09-01T00:00:00Z" }
```

1. Verifies Firebase Auth token → extracts `uid`
2. Computes `HMAC-SHA256(f"{order_id}|{payment_id}", secret)`
3. Compares to `razorpay_signature` (constant-time comparison)
4. On match: writes `users/{uid}/subscription` via Admin SDK
5. Returns `{ status, valid_until }`

---

## Data Models

### Firestore: `users/{uid}/subscription`

```ts
{
  plan: 'free' | 'pro',       // string
  valid_until: string,         // ISO 8601 UTC, e.g. "2025-09-01T00:00:00.000Z"
}
```

Written only by the backend Admin SDK. Read by the frontend `PlanContext`.

### Firestore: `users/{uid}/usage/{YYYY-MM}`

```ts
{
  analyses_count: number,        // integer ≥ 0
  outfit_checks_count: number,   // integer ≥ 0
}
```

Document key is the calendar month in UTC (e.g., `"2025-08"`). Written by the frontend using Firestore `increment()` for atomic updates. Created on first use of the month.

### Plan State (in-memory, React context)

```ts
type PlanState = {
  plan: 'free' | 'pro';
  usage: { analyses_count: number; outfit_checks_count: number };
  isPro: boolean;
  validUntil: string | null;
  loading: boolean;
};
```

### Subscription Validity Logic

```ts
function isPro(subscription: { plan: string; valid_until: string } | null): boolean {
  if (!subscription) return false;
  if (subscription.plan !== 'pro') return false;
  return new Date(subscription.valid_until) > new Date();
}
```

### API Contracts

#### `POST /api/payment/create-order`

Request headers: `Authorization: Bearer <firebase_id_token>`

Response `200`:
```json
{ "order_id": "order_XXXXXXXXXX", "amount": 3100, "currency": "INR" }
```

Response `401`: invalid/missing token.

#### `POST /api/payment/verify`

Request headers: `Authorization: Bearer <firebase_id_token>`

Request body:
```json
{
  "razorpay_order_id": "order_XXXXXXXXXX",
  "razorpay_payment_id": "pay_XXXXXXXXXX",
  "razorpay_signature": "<hmac_hex>"
}
```

Response `200`:
```json
{ "status": "success", "valid_until": "2025-09-01T00:00:00.000Z" }
```

Response `400`:
```json
{ "detail": "Payment verification failed. Please contact support." }
```

Response `401`: invalid/missing token.

Response `500`: Firestore write failure.

---

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Plan resolution from subscription document

*For any* subscription document value (null, missing, `plan: 'free'`, `plan: 'pro'` with future `valid_until`, or `plan: 'pro'` with past `valid_until`), the `isPro` function should return `true` only when `plan === 'pro'` AND `valid_until` is strictly in the future; it should return `false` for all other inputs including null/missing documents.

**Validates: Requirements 1.2, 1.3, 1.4**

---

### Property 2: Subscription data round trip

*For any* valid subscription object `{ plan, valid_until }`, writing it to Firestore and reading it back should produce an object with the same `plan` and `valid_until` values.

**Validates: Requirements 1.1**

---

### Property 3: Plan cache does not re-read Firestore on repeated access

*For any* authenticated session, after the initial Firestore read that populates `PlanContext`, subsequent calls to `usePlan()` within the same session should return the cached value without triggering additional Firestore reads.

**Validates: Requirements 1.5**

---

### Property 4: refreshPlan reflects updated subscription state

*For any* subscription state change in Firestore, calling `refreshPlan()` should cause `PlanContext` to reflect the new state (e.g., `isPro` transitions from `false` to `true` after a successful payment).

**Validates: Requirements 1.6, 11.5**

---

### Property 5: Usage increments atomically on successful completion

*For any* free user with a starting `analyses_count` of N, after one successful photo analysis the count should be exactly N+1. Likewise, for any starting `outfit_checks_count` of M, after one successful outfit check the count should be exactly M+1. Pro users' counts should remain unchanged after any number of completions.

**Validates: Requirements 2.2, 2.3, 2.6**

---

### Property 6: Usage document key matches current calendar month

*For any* UTC timestamp, the usage document key derived from that timestamp should equal the string `YYYY-MM` where YYYY is the four-digit year and MM is the two-digit month of that timestamp.

**Validates: Requirements 2.1, 2.5**

---

### Property 7: Usage gate allows when under limit, blocks when at or over limit

*For any* free user with `analyses_count` in [0, 5], the Plan_Gate should allow a photo analysis to proceed. *For any* free user with `analyses_count` ≥ 6, the Plan_Gate should block the analysis and open the Paywall_Modal. The same property holds for outfit checks with a limit of 10. Pro users should always be allowed regardless of count.

**Validates: Requirements 3.1, 3.2, 4.1, 4.2**

---

### Property 8: Locked sections render blur and overlay for free users, clean for pro users

*For any* component that wraps a gated section (Accessories tab, Makeup Suggestions), when `isPro` is `false` the rendered output should contain a blur filter on the content container and a `LockOverlay` child. When `isPro` is `true`, neither the blur filter nor the `LockOverlay` should be present in the rendered output.

**Validates: Requirements 5.1, 5.2, 5.4, 6.1, 6.2, 6.4**

---

### Property 9: Outfit combination visibility based on plan

*For any* analysis result containing N outfit combinations, a free user should see exactly `min(N, 2)` unblurred combinations and `max(0, min(N, 5) - 2)` blurred combinations with `LockOverlay`. A pro user should see all N combinations unblurred with no `LockOverlay` present.

**Validates: Requirements 7.1, 7.2, 7.5**

---

### Property 10: Wardrobe save gate based on plan and item count

*For any* free user with a wardrobe containing fewer than 10 items, a save attempt should succeed. *For any* free user with 10 or more items, a save attempt should be blocked with the appropriate message. *For any* pro user with fewer than 50 items, a save attempt should succeed. *For any* pro user with 50 or more items, a save attempt should be blocked.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

---

### Property 11: History limit based on plan

*For any* history collection with N records, a free user's History_Panel should display at most 5 records. A pro user's History_Panel should display at most 20 records. In both cases the records should be ordered by date descending.

**Validates: Requirements 9.1, 9.2**

---

### Property 12: AdSense visibility based on plan

*For any* screen where AdSense currently appears, the `<AdSense />` component should be rendered when `isPro` is `false` and should not be rendered when `isPro` is `true`.

**Validates: Requirements 10.1, 10.2**

---

### Property 13: HMAC signature verification correctness

*For any* valid `(order_id, payment_id)` pair and the correct Razorpay secret key, the computed `HMAC-SHA256(f"{order_id}|{payment_id}", secret)` should equal the signature produced by Razorpay. *For any* tampered `order_id`, `payment_id`, or signature value, the comparison should fail and the endpoint should return HTTP 400 without writing to Firestore.

**Validates: Requirements 11.3, 11.6, 14.3, 14.4**

---

### Property 14: Unauthenticated requests are rejected with HTTP 401

*For any* request to `POST /api/payment/create-order` or `POST /api/payment/verify` that lacks a valid Firebase Auth ID token (missing, expired, or malformed), the endpoint should return HTTP 401 and perform no side effects.

**Validates: Requirements 14.2**

---

### Property 15: Firestore rules deny client writes to subscription

*For any* authenticated user, a direct client-side write attempt to `users/{uid}/subscription` should be denied by Firestore security rules. Reads of own subscription should be allowed; reads of another user's subscription should be denied.

**Validates: Requirements 15.1, 15.2, 15.5**

---

### Property 16: Firestore rules enforce usage count maximums

*For any* authenticated free user, a client-side write to `users/{uid}/usage/{month}` that would set `analyses_count` above 6 or `outfit_checks_count` above 10 should be denied by Firestore security rules. Writes within the limits should be allowed.

**Validates: Requirements 15.4**

---

## Error Handling

### Frontend

| Scenario | Handling |
|---|---|
| Firestore read fails on app load | `PlanContext` defaults to `plan: 'free'`, `loading: false`; logs error silently |
| Razorpay script fails to load | Show toast: "Payment service unavailable. Please try again." |
| `POST /api/payment/create-order` returns non-200 | Show toast: "Could not initiate payment. Please try again." |
| `POST /api/payment/verify` returns 400 | Show error: "Payment verification failed. Please contact support." |
| `POST /api/payment/verify` returns 500 | Show error: "Something went wrong. Your payment may have been processed — please contact support." |
| Razorpay Checkout dismissed by user | Close Razorpay modal, return to `PaywallModal` without state change |
| Usage increment fails (Firestore write error) | Log error silently; do not block the user from seeing results |
| Wardrobe count check fails | Default to allowing the save (fail open for UX); log error |

### Backend

| Scenario | HTTP Response |
|---|---|
| Missing or invalid Firebase Auth token | 401 `{ "detail": "Session expired or invalid. Please login again." }` |
| Invalid Razorpay signature | 400 `{ "detail": "Payment verification failed. Please contact support." }` |
| Firestore write failure after valid signature | 500 `{ "detail": "Subscription update failed. Please contact support." }` |
| Razorpay SDK error on order creation | 500 `{ "detail": "Could not create payment order. Please try again." }` |
| Missing required fields in request body | 422 (FastAPI/Pydantic automatic validation) |

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- **Unit tests** verify specific examples, edge cases, and integration points.
- **Property tests** verify universal invariants across randomly generated inputs.

### Property-Based Testing

**Library**: [`hypothesis`](https://hypothesis.readthedocs.io/) for Python backend tests; [`fast-check`](https://fast-check.io/) for JavaScript/React frontend tests.

Each property test must run a minimum of **100 iterations**.

Each test must include a comment referencing the design property it validates:
```
// Feature: premium-tier, Property 7: usage gate allows when under limit, blocks when at or over limit
```

| Property | Test Location | Generator Strategy |
|---|---|---|
| P1: Plan resolution | `frontend/__tests__/planContext.test.js` | Generate random `{ plan, valid_until }` objects including null, past dates, future dates |
| P5: Usage increments atomically | `frontend/__tests__/usageTracker.test.js` | Generate random starting counts, verify count + 1 after completion |
| P6: Usage document key | `frontend/__tests__/usageTracker.test.js` | Generate random UTC timestamps, verify YYYY-MM format |
| P7: Usage gate | `frontend/__tests__/planGate.test.js` | Generate random counts in [0, 20] and plan values |
| P8: Locked sections render | `frontend/__tests__/lockOverlay.test.js` | Generate random `isPro` boolean, verify rendered output |
| P9: Outfit combo visibility | `frontend/__tests__/resultsDisplay.test.js` | Generate random combo arrays of length 0–10 |
| P10: Wardrobe save gate | `frontend/__tests__/wardrobeGate.test.js` | Generate random item counts and plan values |
| P11: History limit | `frontend/__tests__/historyPanel.test.js` | Generate random history arrays of length 0–30 |
| P12: AdSense visibility | `frontend/__tests__/adControl.test.js` | Generate random `isPro` boolean |
| P13: HMAC verification | `Backend/tests/test_payment.py` | Generate random order_id/payment_id strings; test valid and tampered signatures |
| P14: Auth rejection | `Backend/tests/test_payment.py` | Generate random invalid tokens |
| P15: Firestore subscription rules | `Backend/tests/test_firestore_rules.py` | Test with Firebase emulator |
| P16: Firestore usage rules | `Backend/tests/test_firestore_rules.py` | Test with Firebase emulator |

### Unit Tests

Focus on specific examples, integration points, and edge cases:

- **Subscription expiry edge case**: `valid_until` exactly equal to `Date.now()` (boundary condition for `isPro`)
- **First-month usage creation**: Usage document created with `{ analyses_count: 0, outfit_checks_count: 0 }` when none exists
- **PaywallModal renders correct trigger message** for analysis limit vs outfit check limit
- **Razorpay Checkout called with correct parameters** (amount: 3100, currency: 'INR', user name/email)
- **`refreshPlan` called after successful payment verify response**
- **Razorpay dismissal does not change subscription state**
- **Wardrobe count read before save attempt** (ordering assertion)
- **History upgrade prompt appears after 5th item** for free users
- **Settings screen displays "X/6 analyses used"** format correctly
- **Settings screen displays "Valid until DD MMM YYYY"** format correctly
- **Backend returns HTTP 200 with `{ status: "success", valid_until }` on valid payment**
- **Backend returns HTTP 500 when Firestore write fails after valid signature**
- **Backend `create-order` returns `{ order_id, amount: 3100, currency: "INR" }`**

### Firebase Emulator Tests

Firestore security rules (Requirements 15.1–15.5) should be tested using the [Firebase Local Emulator Suite](https://firebase.google.com/docs/emulator-suite):

```bash
firebase emulators:start --only firestore
```

Test scenarios:
- Authenticated user reads own subscription → allowed
- Authenticated user writes own subscription → denied
- Authenticated user reads own usage → allowed
- Authenticated user writes usage within limits → allowed
- Authenticated user writes usage exceeding limits → denied
- Unauthenticated read/write of any subscription or usage → denied
- Authenticated user reads another user's subscription → denied
