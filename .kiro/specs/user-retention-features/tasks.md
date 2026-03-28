# Implementation Plan: User Retention Features

## Overview

Implement four retention features for StyleGuru AI in sequential order: User Profile Persistence, Virtual Wardrobe, Social Sharing (Style Profile Card), and Weekly Style Tips (Push Notifications). Each feature builds on the previous, with Firestore service functions in `styleApi.js` as the shared foundation.

## Tasks

- [x] 1. Add Firestore service functions to styleApi.js
  - [x] 1.1 Implement profile service functions
    - Add `saveProfile(uid, profile)` — writes to `users/{uid}/profile` using `setDoc`
    - Add `loadProfile(uid)` — reads from `users/{uid}/profile`, returns null if not found
    - Both functions must return early without any Firestore call when `auth.currentUser` is null
    - _Requirements: 1.1, 1.4, 1.5, 5.4_

  - [ ]* 1.2 Write property tests for profile service (P1, P3, P18)
    - Create `frontend/src/__tests__/profileService.property.test.js`
    - **Property 1: Profile Round-Trip** — `saveProfile` then `loadProfile` returns deeply equal object
    - **Property 3: Unauthenticated State Never Touches Firestore** — all service fns return early when `auth.currentUser` is null
    - **Property 18: All Firestore Paths Scoped to uid** — every path begins with `users/{uid}/`
    - Mock Firestore SDK; run 100 iterations via fast-check
    - _Requirements: 1.1, 1.4, 1.5, 5.4_

  - [x] 1.3 Implement wardrobe service functions
    - Add `saveWardrobeItem(uid, item)` — `addDoc` to `users/{uid}/wardrobe`, returns docId
    - Add `getWardrobe(uid)` — query ordered by `saved_at` desc
    - Add `deleteWardrobeItem(uid, itemId)` — `deleteDoc` from `users/{uid}/wardrobe/{itemId}`
    - Add `getWardrobeCount(uid)` — returns count of docs in `users/{uid}/wardrobe`
    - All functions return early when `auth.currentUser` is null
    - _Requirements: 2.3, 2.5, 2.8, 2.11, 5.4_

  - [ ]* 1.4 Write property tests for wardrobe service (P4, P5)
    - Create `frontend/src/__tests__/wardrobeService.property.test.js`
    - **Property 4: Wardrobe CRUD Round-Trip** — save then get contains item; delete then get does not
    - **Property 5: Wardrobe Ordering Invariant** — `getWardrobe` returns items ordered by `saved_at` desc
    - Mock Firestore SDK; run 100 iterations via fast-check
    - _Requirements: 2.3, 2.5, 2.8_

  - [x] 1.5 Implement push subscription and analytics service functions
    - Add `savePushSubscription(uid, sub, skinTone, colorSeason)` — writes to `users/{uid}/push_subscriptions/{subId}`
    - Add `deletePushSubscription(uid, subId)` — deletes the document
    - Add `logShareEvent(uid, skinTone)` — `addDoc` to `users/{uid}/events` with `type: "share"`, `skin_tone`, ISO timestamp
    - _Requirements: 4.1, 4.7, 3.10, 5.4_

  - [ ]* 1.6 Write property tests for push subscription and share event (P11, P15, P18)
    - Extend `frontend/src/__tests__/pushService.property.test.js`
    - **Property 15: Push Subscription Round-Trip** — save then read returns equivalent endpoint/keys/skin_tone/color_season
    - **Property 11: Share Event Logged to Firestore** — `logShareEvent` writes doc with correct shape
    - **Property 18** (extended): verify push/share paths also begin with `users/{uid}/`
    - _Requirements: 4.1, 4.7, 3.10_

- [x] 2. Integrate profile persistence into Dashboard and App
  - [x] 2.1 Call `saveProfile` after analysis completes in Dashboard.jsx
    - In `handleAnalysisComplete`, after the localStorage writes, call `saveProfile(uid, profileData)` asynchronously
    - On Firestore write failure, show a non-blocking toast "Profile not synced"
    - Build `profileData` from the enriched analysis result (skin_tone, undertone, color_season, skin_hex, confidence, best_colors, gender_mode, language, analyzed_at, updated_at)
    - _Requirements: 1.1, 1.4, 1.6_

  - [x] 2.2 Call `loadProfile` on auth state change in App.jsx
    - In the Firebase `onAuthStateChanged` handler in `App.jsx`, after user is confirmed logged in, call `loadProfile(uid)`
    - If a profile is returned, overwrite `localStorage` key `sg_last_analysis` with the Firestore data
    - Apply saved `gender_mode` and `language` preference before the Dashboard renders
    - _Requirements: 1.2, 1.7, 1.8, 1.9, 5.2_

  - [ ]* 2.3 Write unit tests for profile integration
    - Create `frontend/src/__tests__/profileService.unit.test.js`
    - Test: `handleAnalysisComplete` calls both `localStorage.setItem` and `saveProfile`
    - Test: login handler calls `loadProfile` and overwrites localStorage
    - Test: Firestore write failure triggers toast and leaves localStorage intact
    - _Requirements: 1.1, 1.6, 1.7_

  - [ ]* 2.4 Write property test for profile UI rendering (P2)
    - Create `frontend/src/__tests__/profileUI.property.test.js`
    - **Property 2: Profile Data Drives UI Rendering** — for any valid StyleProfile, rendered HomeScreen contains skin_hex swatch, undertone, color_season, gender_mode, and language
    - Use fast-check to generate arbitrary valid StyleProfile objects; run 100 iterations
    - _Requirements: 1.3, 1.9_

- [ ] 3. Checkpoint — Profile persistence complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Build WardrobePanel component and wire Save to Wardrobe
  - [x] 4.1 Create WardrobePanel.jsx
    - Create `frontend/src/components/WardrobePanel.jsx`
    - On mount, call `getWardrobe(uid)` and render skeleton (3 placeholder cards) while loading
    - After 3 seconds without a response, show error state
    - Render scrollable list of wardrobe item cards showing outfit_data, skin_hex swatch, source label, and saved_at date
    - Each card has a "Delete" button: call `deleteWardrobeItem`, remove item from local state optimistically; on failure show toast and restore item
    - When `auth.currentUser` is null, render "Login to save outfits" prompt instead of the list
    - When `getWardrobeCount >= 50`, show cap warning banner
    - _Requirements: 2.5, 2.6, 2.7, 2.8, 2.10, 2.11_

  - [ ]* 4.2 Write property tests for WardrobePanel (P7)
    - Create `frontend/src/__tests__/wardrobePanel.property.test.js`
    - **Property 7: Wardrobe Item Detail Renders All Fields** — for any valid WardrobeItem, the rendered card contains outfit_data fields, skin_hex swatch, and source label with no undefined values
    - Use fast-check to generate arbitrary WardrobeItem objects; run 100 iterations
    - _Requirements: 2.7_

  - [x] 4.3 Add "Save to Wardrobe" button to ResultsDisplay outfit combination cards
    - In `ResultsDisplay.jsx` (or wherever outfit combination cards are rendered), add a "Save to Wardrobe" button to each outfit combination card
    - When tapped, call `saveWardrobeItem(uid, item)` with source `"analysis"`, outfit_data, skin_tone, skin_hex, and UTC timestamp
    - On success: show toast "Saved to Wardrobe ✓" and update button state to "Saved ✓" (disabled)
    - On failure: queue item in `localStorage` key `sg_wardrobe_queue`; show toast "Saved offline — will sync when connected"
    - When `auth.currentUser` is null, render "Login to save outfits" prompt instead of the button
    - _Requirements: 2.1, 2.3, 2.4, 2.9, 2.10_

  - [x] 4.4 Add "Save to Wardrobe" button to OutfitChecker results
    - In `OutfitChecker.jsx`, add "Save to Wardrobe" button to the result view
    - Button is rendered if and only if `compatibility_score >= 70`
    - When tapped, call `saveWardrobeItem` with source `"outfit_checker"` and `compatibility_score`
    - Same success/failure/auth-gated behavior as 4.3
    - _Requirements: 2.2, 2.3, 2.4, 2.9, 2.10_

  - [ ]* 4.5 Write property test for Save button visibility (P6)
    - Create `frontend/src/__tests__/outfitChecker.property.test.js`
    - **Property 6: Save-to-Wardrobe Button Visibility by Compatibility Score** — button rendered iff `compatibility_score >= 70`
    - Use fast-check to generate arbitrary integer scores 0–100; run 100 iterations
    - _Requirements: 2.2_

  - [x] 4.6 Add wardrobe tab to Dashboard.jsx and wire offline retry
    - Add `{ id: 'wardrobe', emoji: '👗', label: 'Wardrobe' }` to `navItems` in Dashboard.jsx (between outfit and history)
    - Render `<WardrobePanel>` when `activeTab === 'wardrobe'`
    - On app startup (in `App.jsx` or Dashboard mount), check `localStorage` key `sg_wardrobe_queue`; if non-empty and `navigator.onLine`, retry each queued item via `saveWardrobeItem` and clear the queue on success
    - _Requirements: 2.5, 2.9_

  - [ ]* 4.7 Write unit tests for wardrobe service
    - Create `frontend/src/__tests__/wardrobeService.unit.test.js`
    - Test: save failure queues to `sg_wardrobe_queue`
    - Test: 50-item cap triggers modal prompt
    - Test: delete failure restores item in UI state
    - Test: offline retry clears queue on success
    - _Requirements: 2.9, 2.11_

- [ ] 5. Checkpoint — Virtual Wardrobe complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Build ShareCard component
  - [x] 6.1 Create ShareCard.jsx with canvas renderer
    - Create `frontend/src/components/ShareCard.jsx`
    - Render a hidden `<canvas>` element sized 1080×1080
    - Implement `generateCard(analysisData, userName, theme)`:
      - Fill background: `#1e1b4b` (dark) or `#ffffff` (light)
      - Draw `"{firstName}'s Style Profile"` bold text at y=80
      - Draw 200×200 skin hex color swatch at y=200 with skin tone label, season label, undertone label alongside
      - Draw "Best Colors:" label at y=480, then up to 5 color swatches (120×120 each) with hex codes below
      - Draw "StyleGuru AI · styleguruai.in" tagline at y=950
    - Implement `shareCard()`:
      - Call `generateCard()`, show loading indicator, disable button
      - If `navigator.canShare` with files is supported: call `navigator.share({ files: [pngFile] })`
      - Otherwise: trigger `<a download="style-profile.png">` fallback
      - On `AbortError` from Web Share API: silently re-enable button
      - On canvas failure: show error toast, log to console, do not crash
      - After share/download: call `logShareEvent(uid, skinTone)`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 6.2 Write property tests for ShareCard (P8, P9, P10, P11)
    - Create `frontend/src/__tests__/shareCard.property.test.js`
    - **Property 8: Style_Card Contains All Required Fields** — canvas draw calls include firstName, skin_hex fill, skin tone label, color season label, up to 5 swatches, and "styleguruai.in"
    - **Property 9: Style_Card Dimensions Invariant** — canvas width === 1080 and height === 1080 for any valid input
    - **Property 10: Style_Card Theme Background** — dark theme fills `#1e1b4b`, light theme fills `#ffffff`
    - **Property 11: Share Event Logged** — `logShareEvent` called with correct skin_tone after share/download
    - Mock canvas context; use fast-check to generate arbitrary analysis data and usernames; run 100 iterations
    - _Requirements: 3.2, 3.3, 3.8, 3.9, 3.10_

  - [x] 6.3 Add "Share My Style" button to ResultsDisplay
    - Import and render `<ShareCard>` in the results view (visible without scrolling)
    - Pass `analysisData`, `userName` (from Firebase Auth `displayName`), and current `theme`
    - Button shows loading state while canvas renders and is disabled to prevent duplicate renders
    - _Requirements: 3.1, 3.6_

  - [ ]* 6.4 Write unit tests for ShareCard
    - Create `frontend/src/__tests__/shareCard.unit.test.js`
    - Test: Web Share API not supported → falls back to `<a download>`
    - Test: `AbortError` from Web Share API → button re-enabled, no error shown
    - Test: canvas failure → error toast shown, app does not crash
    - Test: `logShareEvent` failure → does not block share action
    - _Requirements: 3.5, 3.7, 3.10_

- [ ] 7. Checkpoint — Social Sharing complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Create push_service.py backend module
  - [x] 8.1 Create Backend/push_service.py with VAPID send and tip pool
    - Create `Backend/push_service.py`
    - Define `TIPS_POOL`: list of 20+ dicts with fields `text`, `skin_tones` (list or `"all"`), `color_seasons` (list or `"all"`)
    - Implement `PushService.__init__(vapid_private_key, vapid_public_key, vapid_claims)`
    - Implement `get_tip_for_user(skin_tone, color_season)`:
      - Filter `TIPS_POOL` to tips matching `skin_tone` and `color_season`
      - If no match or inputs are None/empty, return a tip from the generic pool
      - Never raise an exception or return None
    - Implement `send_notification(subscription_info, payload)` using `pywebpush`; return bool success
    - Implement `_delete_stale_subscription(db, uid, sub_id)` — deletes Firestore doc on 410/404
    - Implement `send_weekly_tips(db)` — reads all `push_subscriptions` across all users, selects tip per user, calls `send_notification`, handles 410/404 cleanup; returns `{sent, failed, deleted}` counts
    - _Requirements: 4.3, 4.4, 4.8, 4.9, 4.10_

  - [ ]* 8.2 Write Hypothesis property tests for push_service.py (P12, P13)
    - Create `Backend/tests/test_push_service.py`
    - **Property 12: Tip Selection Matches User Profile** — for any non-null skin_tone and color_season, `get_tip_for_user` returns a tip tagged for that skin_tone or color_season
    - **Property 13: Generic Tip When No Profile** — `get_tip_for_user(None, None)` returns a non-empty string, never raises
    - Use Hypothesis `@given` with `st.sampled_from` for valid skin tones/seasons and `st.none()` for null cases
    - _Requirements: 4.4, 4.10_

- [x] 9. Add push subscription endpoints to Backend/main.py
  - [x] 9.1 Implement POST /api/push/subscribe
    - Add Pydantic model `PushSubscribeRequest` with fields `endpoint`, `keys` (p256dh, auth), `skin_tone`, `color_season`
    - Implement `POST /api/push/subscribe` (auth-required): save subscription to `users/{uid}/push_subscriptions/{subId}` via Firebase Admin Firestore, then send welcome push via `PushService.send_notification`
    - Welcome message: "StyleGuru AI notifications are on! Your weekly style tips start now 🎨"
    - _Requirements: 4.1, 4.2_

  - [x] 9.2 Implement DELETE /api/push/unsubscribe and POST /api/push/send-weekly
    - Implement `DELETE /api/push/unsubscribe` (auth-required): delete the user's push subscription document from Firestore
    - Implement `POST /api/push/send-weekly` (admin/cron trigger): call `push_service.send_weekly_tips(db)` and return counts
    - Read `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_CLAIMS_EMAIL` from environment variables; never expose private key in responses
    - _Requirements: 4.7, 4.8, 4.9_

  - [ ]* 9.3 Write unit tests for push endpoints
    - Extend `Backend/tests/test_push_service.py`
    - Test: `POST /api/push/subscribe` saves to Firestore and sends welcome push
    - Test: `DELETE /api/push/unsubscribe` deletes the correct Firestore document
    - Test: 410 response from push service triggers `_delete_stale_subscription`
    - Mock `pywebpush` and Firebase Admin Firestore client
    - _Requirements: 4.1, 4.2, 4.7, 4.8_

- [x] 10. Update SettingsScreen for full push notification flow
  - [x] 10.1 Replace stub notification logic with full Notification_Service flow
    - In `SettingsScreen` inside `Dashboard.jsx`:
      - On "Enable" tap: call `Notification.requestPermission()`, then `navigator.serviceWorker.ready`, then `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_PUBLIC_KEY })`
      - POST the resulting `PushSubscription` JSON to `/api/push/subscribe` with current `skin_tone` and `color_season` from `sg_last_analysis`
      - On success: update `notifStatus` to `"granted"`; on failure: show toast "Subscription not saved — please try again"
      - "Disable" button: call `deletePushSubscription(uid, subId)` + `pushManager.getSubscription().then(sub => sub?.unsubscribe())`; update status to `"default"`
      - When `notifStatus === "denied"`: show "Blocked" label + link to browser notification settings
      - When Push API not supported: hide the entire notification section (no error shown)
    - _Requirements: 4.1, 4.7, 4.11, 4.12_

  - [ ]* 10.2 Write property test for notification status display (P14)
    - Create `frontend/src/__tests__/settingsScreen.property.test.js`
    - **Property 14: Notification Permission Status Displayed Correctly** — for each of `"granted"`, `"denied"`, `"default"`, the rendered SettingsScreen shows the correct label; browser settings link rendered iff status is `"denied"`
    - Use fast-check `fc.constantFrom("granted", "denied", "default")`; run 100 iterations
    - _Requirements: 4.11_

- [x] 11. Update sw.js push event handler
  - [x] 11.1 Update push event handler in frontend/public/sw.js
    - Update the `push` event handler to always use `title: "StyleGuru AI 🎨"`
    - Ensure `data.url` defaults to `"/dashboard"` when not provided in the payload
    - Ensure `icon` is set to `"/favicon.svg"`
    - Confirm `notificationclick` handler calls `clients.openWindow(event.notification.data.url || '/dashboard')`
    - _Requirements: 4.5, 4.6_

  - [ ]* 11.2 Write property test for sw.js notification display (P16)
    - Create `frontend/src/__tests__/sw.property.test.js`
    - **Property 16: Notification Display Fields** — for any push payload, displayed notification has `title === "StyleGuru AI 🎨"`, non-empty body, `icon === "/favicon.svg"`, and `data.url === "/dashboard"`
    - Mock `self.registration.showNotification`; use fast-check to generate arbitrary payloads; run 100 iterations
    - _Requirements: 4.5_

- [ ] 12. Checkpoint — Push Notifications complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Add Firestore security rules
  - [x] 13.1 Create firestore.rules with user-scoped access rules
    - Create `firestore.rules` at the workspace root
    - Add rule: `match /users/{uid}/{document=**}` — allow read, write if `request.auth != null && request.auth.uid == uid`
    - _Requirements: 5.6_

  - [ ]* 13.2 Write Firestore security rules tests
    - Create `frontend/src/__tests__/firestoreRules.test.js` (or a dedicated `firestore.rules.test.js`)
    - Test: authenticated user can read/write `users/{uid}/**` for their own uid
    - Test: authenticated user cannot read/write `users/{other_uid}/**`
    - Test: unauthenticated request is rejected for all paths under `users/`
    - Use Firebase Emulator Suite (`@firebase/rules-unit-testing`)
    - _Requirements: 5.6_

- [x] 14. Cross-feature wiring and logout behavior
  - [x] 14.1 Implement logout state clearing in Dashboard.jsx
    - In the `onLogout` handler, clear in-memory React state: `setResults(null)`, wardrobe cache, profile cache
    - Do NOT clear `localStorage` keys `sg_analysis_history` or `sg_last_analysis`
    - _Requirements: 5.1_

  - [ ]* 14.2 Write property test for logout localStorage preservation (P17)
    - Create `frontend/src/__tests__/dashboard.property.test.js`
    - **Property 17: Logout Preserves localStorage** — for any app state with `sg_analysis_history` and `sg_last_analysis` set, calling logout clears React state but leaves both localStorage keys intact
    - Use fast-check to generate arbitrary localStorage values; run 100 iterations
    - _Requirements: 5.1_

  - [x] 14.3 Add Firestore error handling for security rule rejections
    - In each service function in `styleApi.js`, wrap Firestore calls in try/catch
    - On error, check if it is a permission-denied error; if so, display a user-facing message in the current language (English: "Access denied. Please log in again." / Hinglish: "Access nahi mila. Dobara login karein.")
    - Log the rejection details to `console.error`
    - _Requirements: 5.5_

  - [ ]* 14.4 Write property test for Firestore path scoping (P18)
    - Create `frontend/src/__tests__/styleApi.property.test.js`
    - **Property 18: All Firestore Paths Scoped to uid** — for any uid string, every Firestore path constructed by all service functions begins with `users/{uid}/`
    - Spy on Firestore SDK calls; use fast-check to generate arbitrary uid strings; run 100 iterations
    - _Requirements: 5.4_

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests use fast-check (frontend) and Hypothesis (backend) — install with `npm install --save-dev fast-check` and `pip install hypothesis pywebpush`
- The `pywebpush` library is required for `push_service.py` — add to `Backend/requirements.txt`
- Firestore security rules tests require `firebase-tools` and `@firebase/rules-unit-testing`
- VAPID keys can be generated with `npx web-push generate-vapid-keys` and stored as Heroku config vars
