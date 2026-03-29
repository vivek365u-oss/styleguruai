# Implementation Plan: Premium Tier (Freemium Model)

## Overview

Implement a freemium model for StyleGuru AI with a Free tier (default) and a Pro tier (₹31/month via Razorpay). The implementation is additive — existing components are wrapped or extended. Work proceeds from the data layer outward: Firestore API functions → React context → UI gates → locked sections → payment flow → backend endpoints → security rules.

## Tasks

- [x] 1. Add Firestore service functions to `styleApi.js`
  - Add `getSubscription(uid)` — reads `users/{uid}/subscription`, returns `{ plan, valid_until }` or `null`
  - Add `getUsage(uid, monthKey)` — reads `users/{uid}/usage/{YYYY-MM}`, returns `{ analyses_count, outfit_checks_count }` or `{ analyses_count: 0, outfit_checks_count: 0 }`
  - Add `incrementUsage(uid, field)` — atomically increments `analyses_count` or `outfit_checks_count` in the current month's document using Firestore `increment(1)`; creates the document if it doesn't exist
  - Add `createPaymentOrder()` — POSTs to `/api/payment/create-order` with Firebase Auth token, returns `{ order_id, amount, currency }`
  - Add `verifyPayment(payload)` — POSTs `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }` to `/api/payment/verify` with Firebase Auth token, returns `{ status, valid_until }`
  - Import `increment` from `firebase/firestore` alongside existing imports
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 11.2, 14.1_

  - [ ]* 1.1 Write unit tests for `getSubscription` and `getUsage`
    - Test null/missing document returns correct defaults
    - Test existing document returns correct shape
    - _Requirements: 1.2, 1.3, 2.1_

  - [ ]* 1.2 Write unit tests for `incrementUsage`
    - Test that `analyses_count` increments by 1 on each call
    - Test that `outfit_checks_count` increments by 1 on each call
    - Test document creation when month document doesn't exist
    - _Requirements: 2.2, 2.3, 2.4_

- [x] 2. Create `PlanContext.jsx` and `usePlan` hook
  - Create `frontend/src/context/PlanContext.jsx`
  - On mount (when `auth.currentUser` is set), read `users/{uid}/subscription` via `getSubscription` and `users/{uid}/usage/{YYYY-MM}` via `getUsage`
  - Derive `isPro` using the subscription validity logic: `plan === 'pro' && new Date(valid_until) > new Date()`
  - Expose `{ plan, usage, isPro, validUntil, loading, refreshPlan }` via context
  - `refreshPlan()` re-reads both Firestore documents and updates state
  - Default to `plan: 'free'`, `isPro: false` if Firestore read fails (fail open)
  - Create `frontend/src/hooks/usePlan.js` — thin `useContext(PlanContext)` wrapper that throws if used outside provider
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 2.1 Write property test for plan resolution (Property 1)
    - **Property 1: Plan resolution from subscription document**
    - **Validates: Requirements 1.2, 1.3, 1.4**
    - Use `fast-check` to generate random `{ plan, valid_until }` objects including null, past dates, future dates
    - Assert `isPro` is `true` only when `plan === 'pro'` AND `valid_until` is strictly in the future
    - _Test file: `frontend/src/__tests__/planContext.test.js`_

  - [ ]* 2.2 Write property test for plan cache (Property 3)
    - **Property 3: Plan cache does not re-read Firestore on repeated access**
    - **Validates: Requirements 1.5**
    - Assert that after initial load, repeated `usePlan()` calls do not trigger additional Firestore reads
    - _Test file: `frontend/src/__tests__/planContext.test.js`_

  - [ ]* 2.3 Write property test for `refreshPlan` (Property 4)
    - **Property 4: refreshPlan reflects updated subscription state**
    - **Validates: Requirements 1.6, 11.5**
    - Assert that calling `refreshPlan()` after a Firestore subscription change causes `isPro` to reflect the new state
    - _Test file: `frontend/src/__tests__/planContext.test.js`_

- [x] 3. Wire `PlanContext` into `App.jsx`
  - Import `PlanContext` provider from `frontend/src/context/PlanContext.jsx`
  - Wrap the authenticated portion of the app (inside `LanguageProvider` and `ThemeContext.Provider`) with `<PlanProvider>`
  - The provider should only initialize Firestore reads when `auth.currentUser` is non-null
  - _Requirements: 1.2, 1.5_

- [x] 4. Create `PaywallModal.jsx`
  - Create `frontend/src/components/PaywallModal.jsx`
  - Props: `{ isOpen, onClose, triggerMessage }`
  - Render as bottom sheet on mobile (`fixed bottom-0 w-full`) and centred modal on desktop (`fixed inset-0 flex items-center justify-center`)
  - Show `triggerMessage` at the top
  - Show Free vs Pro feature comparison table (analyses, outfit checks, accessories, makeup, wardrobe limit, outfit combos, history, ads)
  - Primary CTA: "Upgrade to Pro — ₹31/month" button
  - Secondary: "Maybe later" link/button that calls `onClose`
  - Implement `loadRazorpay()` helper that injects the Razorpay Checkout script on demand
  - On CTA click: call `createPaymentOrder()`, open `new window.Razorpay(...)` with `key`, `amount: 3100`, `currency: 'INR'`, user name/email from `auth.currentUser`
  - In Razorpay `handler`: call `verifyPayment(...)`, on success call `refreshPlan()` and `onClose()`
  - Handle all error scenarios per the design's error handling table (toast messages)
  - _Requirements: 11.1, 11.2, 11.3, 11.5, 11.6, 11.7, 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [ ]* 4.1 Write unit tests for `PaywallModal`
    - Test that Razorpay Checkout is called with `amount: 3100`, `currency: 'INR'`
    - Test that `refreshPlan` is called after successful `verifyPayment` response
    - Test that Razorpay dismissal does not change subscription state
    - Test that correct `triggerMessage` is displayed
    - _Requirements: 11.1, 11.5, 11.7, 12.1_

- [x] 5. Create `LockOverlay.jsx`
  - Create `frontend/src/components/LockOverlay.jsx`
  - Props: `{ onUpgrade }`
  - Render `position: absolute; inset: 0` over a `position: relative` parent
  - Show lock icon (🔒) and "Upgrade to Pro ₹31/month" button centred
  - Clicking the button calls `onUpgrade()`
  - _Requirements: 5.2, 6.2, 7.3_

  - [ ]* 5.1 Write property test for `LockOverlay` render (Property 8)
    - **Property 8: Locked sections render blur and overlay for free users, clean for pro users**
    - **Validates: Requirements 5.1, 5.2, 5.4, 6.1, 6.2, 6.4**
    - Use `fast-check` to generate random `isPro` boolean
    - Assert blur filter and `LockOverlay` present when `isPro` is `false`, absent when `true`
    - _Test file: `frontend/src/__tests__/lockOverlay.test.js`_

- [x] 6. Add Plan_Gate to `UploadSection.jsx` / `Dashboard.jsx` (analysis limit)
  - In the component that dispatches `analyzeImage` (the analyze button handler), import `usePlan`
  - Before dispatching, check `!isPro && usage.analyses_count >= 6`
  - If blocked: set `paywallMessage` to `"6 analyses used this month. Upgrade to Pro for unlimited."` and open `PaywallModal`
  - If allowed: proceed with analysis as before
  - After a successful analysis response, call `incrementUsage(uid, 'analyses_count')` (only for free users)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 2.2, 2.6_

  - [ ]* 6.1 Write property test for usage gate — analyses (Property 7)
    - **Property 7: Usage gate allows when under limit, blocks when at or over limit**
    - **Validates: Requirements 3.1, 3.2, 4.1, 4.2**
    - Use `fast-check` to generate random `analyses_count` in [0, 20] and `isPro` boolean
    - Assert gate allows when `isPro` is `true` (any count) or count < 6
    - Assert gate blocks when `isPro` is `false` and count >= 6
    - _Test file: `frontend/src/__tests__/planGate.test.js`_

  - [ ]* 6.2 Write property test for usage increment atomicity (Property 5)
    - **Property 5: Usage increments atomically on successful completion**
    - **Validates: Requirements 2.2, 2.3, 2.6**
    - Use `fast-check` to generate random starting counts
    - Assert count is exactly N+1 after one successful analysis for free users
    - Assert pro users' counts remain unchanged
    - _Test file: `frontend/src/__tests__/usageTracker.test.js`_

  - [ ]* 6.3 Write property test for usage document key (Property 6)
    - **Property 6: Usage document key matches current calendar month**
    - **Validates: Requirements 2.1, 2.5**
    - Use `fast-check` to generate random UTC timestamps
    - Assert derived key equals `YYYY-MM` format for that timestamp
    - _Test file: `frontend/src/__tests__/usageTracker.test.js`_

- [x] 7. Add Plan_Gate to `OutfitChecker.jsx` (outfit check limit)
  - Import `usePlan` in `OutfitChecker.jsx`
  - In `handleCheck`, before the API call, check `!isPro && usage.outfit_checks_count >= 10`
  - If blocked: open `PaywallModal` with message `"10 checks used this month. Upgrade to Pro for unlimited."`
  - If allowed: proceed with outfit check as before
  - After a successful outfit check response, call `incrementUsage(uid, 'outfit_checks_count')` (only for free users)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 2.3, 2.6_

- [ ] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add `LockOverlay` to Accessories tab and Makeup Suggestions in `ResultsDisplay.jsx`
  - Import `usePlan` and `LockOverlay` in `ResultsDisplay.jsx`
  - For the Accessories tab content: wrap the content container in a `position: relative` div; when `!isPro`, apply `filter: blur(4px); pointer-events: none` to the content and render `<LockOverlay onUpgrade={() => setPaywallOpen(true)} />` as a sibling
  - For the Makeup Suggestions section: apply the same blur + `LockOverlay` pattern when `!isPro`
  - When `isPro`, render both sections without blur or overlay
  - Add local `paywallOpen` state and render `<PaywallModal>` in `ResultsDisplay`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 9.1 Write property test for locked sections render (Property 8 — accessories/makeup)
    - **Property 8: Locked sections render blur and overlay for free users, clean for pro users**
    - **Validates: Requirements 5.1, 5.2, 5.4, 6.1, 6.2, 6.4**
    - _Test file: `frontend/src/__tests__/lockOverlay.test.js`_

- [x] 10. Add `LockOverlay` to outfit combos 3–5 in `ResultsDisplay.jsx`
  - In the outfit combinations rendering section, map over combos
  - For index 0 and 1 (combos 1–2): render `<OutfitCard>` as normal for all users
  - For index 2–4 (combos 3–5): when `!isPro`, wrap in a `position: relative` container with blur on `<OutfitCard>` and `<LockOverlay>` overlay; when `isPro`, render normally
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 10.1 Write property test for outfit combo visibility (Property 9)
    - **Property 9: Outfit combination visibility based on plan**
    - **Validates: Requirements 7.1, 7.2, 7.5**
    - Use `fast-check` to generate random combo arrays of length 0–10 and `isPro` boolean
    - Assert free users see exactly `min(N, 2)` unblurred and `max(0, min(N, 5) - 2)` blurred
    - Assert pro users see all N unblurred with no `LockOverlay`
    - _Test file: `frontend/src/__tests__/resultsDisplay.test.js`_

- [x] 11. Update `WardrobePanel.jsx` with plan-aware save limit
  - Import `usePlan` in `WardrobePanel.jsx`
  - Update the wardrobe count display from hardcoded `/50` to `isPro ? '/50' : '/10'`
  - In `saveWardrobeItem` call sites (in `OutfitChecker.jsx` and `ResultsDisplay.jsx`), before saving, call `getWardrobeCount(uid)` and check against the plan limit
  - If free user has ≥ 10 items: show inline error `"Wardrobe full. Upgrade to Pro to save up to 50 items."` and do not save
  - If pro user has ≥ 50 items: show inline error `"Wardrobe limit of 50 items reached."` and do not save
  - Update the `capWarning` threshold in `WardrobePanel.jsx` to use `isPro ? 50 : 10`
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 11.1 Write property test for wardrobe save gate (Property 10)
    - **Property 10: Wardrobe save gate based on plan and item count**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
    - Use `fast-check` to generate random item counts and plan values
    - Assert free users blocked at ≥ 10, pro users blocked at ≥ 50
    - _Test file: `frontend/src/__tests__/wardrobeGate.test.js`_

- [x] 12. Update `HistoryPanel.jsx` with plan-aware history limit
  - Import `usePlan` in `HistoryPanel.jsx`
  - Update the Firestore query `limit()` call to use `isPro ? 20 : 5`
  - After the 5th item in the list (for free users), render an upgrade prompt: "Older history available with Pro"
  - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 12.1 Write property test for history limit (Property 11)
    - **Property 11: History limit based on plan**
    - **Validates: Requirements 9.1, 9.2**
    - Use `fast-check` to generate random history arrays of length 0–30 and `isPro` boolean
    - Assert free users see at most 5 records, pro users at most 20, both ordered by date descending
    - _Test file: `frontend/src/__tests__/historyPanel.test.js`_

- [x] 13. Update `AdSense` rendering in `Dashboard.jsx`
  - Import `usePlan` in `Dashboard.jsx`
  - In `HomeScreen`, conditionally render `<AdSense />` only when `!isPro`
  - _Requirements: 10.1, 10.2_

  - [ ]* 13.1 Write property test for AdSense visibility (Property 12)
    - **Property 12: AdSense visibility based on plan**
    - **Validates: Requirements 10.1, 10.2**
    - Use `fast-check` to generate random `isPro` boolean
    - Assert `<AdSense />` is rendered when `isPro` is `false` and not rendered when `true`
    - _Test file: `frontend/src/__tests__/adControl.test.js`_

- [x] 14. Update `SettingsScreen` in `Dashboard.jsx` with plan status and usage
  - Import `usePlan` in `Dashboard.jsx` (or pass down from parent)
  - In `SettingsScreen`, add a plan status section above the user card:
    - Free users: show "Free Plan" label, usage bars "X/6 analyses used" and "X/10 outfit checks used", and "Upgrade to Pro — ₹31/month" button that opens `PaywallModal`
    - Pro users: show "Pro Member ✓" badge and "Valid until DD MMM YYYY" formatted from `validUntil`
  - Read usage from `usePlan().usage` (already cached in context)
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [ ] 15. Checkpoint — Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Backend: add `razorpay` to `requirements.txt` and create payment endpoints in `main.py`
  - Add `razorpay` to `Backend/requirements.txt`
  - In `Backend/main.py`, import `razorpay` and `hmac`, `hashlib`
  - Read `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from environment variables
  - Initialize `razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))`
  - Add `POST /api/payment/create-order` endpoint:
    - Requires `get_current_user` dependency (Firebase Auth token)
    - Creates a Razorpay order for `amount=3100`, `currency='INR'`
    - Returns `{ "order_id": ..., "amount": 3100, "currency": "INR" }`
    - Returns HTTP 500 with descriptive message on Razorpay SDK error
  - Add `POST /api/payment/verify` endpoint with `VerifyPaymentRequest` Pydantic model:
    - Requires `get_current_user` dependency
    - Computes `HMAC-SHA256(f"{razorpay_order_id}|{razorpay_payment_id}", secret)` using `hmac.compare_digest` for constant-time comparison
    - On mismatch: returns HTTP 400 `{ "detail": "Payment verification failed. Please contact support." }`
    - On match: writes `{ plan: 'pro', valid_until: <now + 30 days ISO> }` to `users/{uid}/subscription` via Firebase Admin Firestore
    - On Firestore write success: returns HTTP 200 `{ "status": "success", "valid_until": ... }`
    - On Firestore write failure: returns HTTP 500 and logs error
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 16.1 Write property test for HMAC signature verification (Property 13)
    - **Property 13: HMAC signature verification correctness**
    - **Validates: Requirements 11.3, 11.6, 14.3, 14.4**
    - Use `hypothesis` to generate random `order_id`/`payment_id` strings
    - Assert valid signatures pass and tampered values return HTTP 400 without Firestore write
    - _Test file: `Backend/tests/test_payment.py`_

  - [ ]* 16.2 Write property test for unauthenticated request rejection (Property 14)
    - **Property 14: Unauthenticated requests are rejected with HTTP 401**
    - **Validates: Requirements 14.2**
    - Use `hypothesis` to generate random invalid/missing/malformed tokens
    - Assert both endpoints return HTTP 401 with no side effects
    - _Test file: `Backend/tests/test_payment.py`_

- [x] 17. Update `firestore.rules` to protect subscription and usage data
  - Replace the current wildcard `allow read, write` rule with granular rules:
    - `users/{uid}/subscription`: allow `read` for own uid; deny all `write` from client (no write rule = denied)
    - `users/{uid}/usage/{month}`: allow `read` for own uid; allow `write` for own uid only when `analyses_count` ≤ 6 and `outfit_checks_count` ≤ 10
    - All other `users/{uid}/**` subcollections: preserve existing `read, write` for own uid
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ]* 17.1 Write property test for Firestore subscription rules (Property 15)
    - **Property 15: Firestore rules deny client writes to subscription**
    - **Validates: Requirements 15.1, 15.2, 15.5**
    - Test with Firebase Local Emulator: own-uid read allowed, own-uid write denied, other-uid read denied, unauthenticated denied
    - _Test file: `Backend/tests/test_firestore_rules.py`_

  - [ ]* 17.2 Write property test for Firestore usage rules (Property 16)
    - **Property 16: Firestore rules enforce usage count maximums**
    - **Validates: Requirements 15.4**
    - Test with Firebase Local Emulator: writes within limits allowed, writes exceeding limits denied
    - _Test file: `Backend/tests/test_firestore_rules.py`_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check` (frontend) and `hypothesis` (backend)
- The `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables must be set in the backend before task 16 can be tested end-to-end
- Firebase Local Emulator Suite is required for tasks 17.1 and 17.2 (`firebase emulators:start --only firestore`)
- The `frontend/src/context/` and `frontend/src/hooks/` directories will be created as part of tasks 2 and 3
