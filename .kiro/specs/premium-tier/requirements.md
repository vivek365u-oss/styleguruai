# Requirements Document

## Introduction

StyleGuru AI currently offers all features for free with no limits. This document defines requirements for introducing a freemium model — a Free tier (default for all users) and a Pro tier (₹31/month) — with Razorpay payment integration.

The Free tier imposes monthly usage limits on photo analyses (6/month) and outfit checks (10/month), locks the Accessories tab and Makeup Suggestions behind a blur/lock UI, caps the Virtual Wardrobe at 10 items, limits outfit combinations to 2 visible, restricts history to the last 5 analyses, and shows AdSense ads. The Pro tier removes all limits, unlocks all features, raises the wardrobe cap to 50 items, shows all outfit combinations, expands history to 20 analyses, and removes ads.

Usage counts are tracked in Firestore at `users/{uid}/usage/{YYYY-MM}`. Subscription state is stored at `users/{uid}/subscription` with fields `plan` (`'free'` | `'pro'`) and `valid_until` (ISO timestamp). Payment is processed via Razorpay: the frontend opens Razorpay Checkout, and on success the backend verifies the signature and upgrades the plan in Firestore.

---

## Glossary

- **App**: The StyleGuru AI React + Firebase + FastAPI application.
- **User**: An authenticated Firebase Auth user.
- **Free_User**: A User whose Firestore subscription document has `plan: 'free'` or no subscription document exists.
- **Pro_User**: A User whose Firestore subscription document has `plan: 'pro'` and a `valid_until` timestamp that is in the future.
- **Usage_Tracker**: The frontend subsystem that reads and writes monthly usage counts in Firestore at `users/{uid}/usage/{YYYY-MM}`.
- **Subscription_Service**: The backend subsystem that reads and writes `users/{uid}/subscription` in Firestore.
- **Plan_Gate**: The frontend logic that checks a User's plan and usage before allowing access to a gated feature.
- **Paywall_Modal**: The modal UI component that displays plan comparison and the upgrade CTA when a limit is hit.
- **Lock_Overlay**: The blur + lock icon + upgrade button UI rendered over locked feature content.
- **Razorpay_Client**: The Razorpay Checkout JavaScript SDK loaded in the frontend.
- **Payment_API**: The FastAPI backend endpoint `POST /api/payment/verify`.
- **Wardrobe**: The Virtual Wardrobe feature that stores saved outfit items in Firestore at `users/{uid}/wardrobe`.
- **History_Panel**: The component that displays past analysis results from `users/{uid}/history`.
- **Outfit_Combinations**: The list of outfit combo suggestions returned by the analysis API and displayed in ResultsDisplay.
- **Settings_Screen**: The existing settings page in Dashboard where plan status and usage are displayed.

---

## Requirements

### Requirement 1: Subscription State Management

**User Story:** As a User, I want my subscription plan to be stored and retrieved reliably, so that the correct tier experience is applied every time I open the app.

#### Acceptance Criteria

1. THE Subscription_Service SHALL store subscription data in Firestore at `users/{uid}/subscription` with fields `plan` (string: `'free'` or `'pro'`) and `valid_until` (ISO 8601 date string).
2. WHEN a User opens the App and is authenticated, THE Plan_Gate SHALL read the `users/{uid}/subscription` document from Firestore to determine the active plan.
3. IF the `users/{uid}/subscription` document does not exist for a User, THEN THE Plan_Gate SHALL treat that User as a Free_User.
4. IF the `users/{uid}/subscription` document has `plan: 'pro'` but the `valid_until` date is in the past, THEN THE Plan_Gate SHALL treat that User as a Free_User.
5. WHILE a User is authenticated, THE Plan_Gate SHALL cache the subscription state in memory for the duration of the session to avoid redundant Firestore reads on every feature interaction.
6. WHEN the subscription state is updated in Firestore (e.g., after payment), THE Plan_Gate SHALL refresh the cached subscription state within the same session without requiring a page reload.

---

### Requirement 2: Monthly Usage Tracking

**User Story:** As a Free_User, I want my monthly usage to be tracked accurately, so that limits are enforced fairly and reset each calendar month.

#### Acceptance Criteria

1. THE Usage_Tracker SHALL store monthly usage in Firestore at `users/{uid}/usage/{YYYY-MM}` where `{YYYY-MM}` is the current calendar month in UTC, with fields `analyses_count` (integer) and `outfit_checks_count` (integer).
2. WHEN a Free_User successfully completes a photo analysis, THE Usage_Tracker SHALL increment `analyses_count` in the current month's usage document by 1.
3. WHEN a Free_User successfully completes an outfit check, THE Usage_Tracker SHALL increment `outfit_checks_count` in the current month's usage document by 1.
4. IF the usage document for the current month does not exist, THEN THE Usage_Tracker SHALL create it with `analyses_count: 0` and `outfit_checks_count: 0` before incrementing.
5. THE Usage_Tracker SHALL derive the monthly reset from the document key (`YYYY-MM`), so that usage automatically resets when the calendar month changes without any scheduled job.
6. WHEN a Pro_User completes a photo analysis or outfit check, THE Usage_Tracker SHALL NOT increment usage counts.

---

### Requirement 3: Photo Analysis Limit (Free Tier)

**User Story:** As a Free_User, I want to perform up to 6 photo analyses per month, so that I can try the core feature before deciding to upgrade.

#### Acceptance Criteria

1. WHILE a User is a Free_User and `analyses_count` for the current month is less than 6, THE Plan_Gate SHALL allow the photo analysis to proceed.
2. WHEN a Free_User attempts to start a photo analysis and `analyses_count` for the current month is 6 or greater, THE Plan_Gate SHALL block the analysis and display the Paywall_Modal.
3. WHEN the Paywall_Modal is displayed due to the analysis limit, THE Paywall_Modal SHALL show the message "6 analyses used this month. Upgrade to Pro for unlimited."
4. THE Paywall_Modal SHALL display a primary CTA button labelled "Upgrade to Pro — ₹31/month".
5. IF a Free_User closes the Paywall_Modal without upgrading, THEN THE App SHALL return the User to the previous screen without performing the analysis.

---

### Requirement 4: Outfit Checker Limit (Free Tier)

**User Story:** As a Free_User, I want to perform up to 10 outfit checks per month, so that I can use the outfit checker feature before deciding to upgrade.

#### Acceptance Criteria

1. WHILE a User is a Free_User and `outfit_checks_count` for the current month is less than 10, THE Plan_Gate SHALL allow the outfit check to proceed.
2. WHEN a Free_User attempts to start an outfit check and `outfit_checks_count` for the current month is 10 or greater, THE Plan_Gate SHALL block the check and display the Paywall_Modal.
3. WHEN the Paywall_Modal is displayed due to the outfit check limit, THE Paywall_Modal SHALL show the message "10 checks used this month. Upgrade to Pro for unlimited."
4. THE Paywall_Modal SHALL display a primary CTA button labelled "Upgrade to Pro — ₹31/month".
5. IF a Free_User closes the Paywall_Modal without upgrading, THEN THE App SHALL return the User to the previous screen without performing the outfit check.

---

### Requirement 5: Locked Feature UI — Accessories Tab

**User Story:** As a Free_User, I want to see that the Accessories tab exists but is locked, so that I understand what I would gain by upgrading.

#### Acceptance Criteria

1. WHILE a User is a Free_User, THE App SHALL render the Accessories tab content with a blur filter applied over the content area.
2. WHILE a User is a Free_User, THE Lock_Overlay SHALL display a lock icon and an "Upgrade to Pro ₹31/month" button centred over the blurred Accessories content.
3. WHEN a Free_User taps the "Upgrade to Pro ₹31/month" button on the Lock_Overlay, THE App SHALL open the Paywall_Modal.
4. WHILE a User is a Pro_User, THE App SHALL render the Accessories tab content without any blur or lock overlay.

---

### Requirement 6: Locked Feature UI — Makeup Suggestions

**User Story:** As a Free_User, I want to see that Makeup Suggestions exist but are locked, so that I understand what I would gain by upgrading.

#### Acceptance Criteria

1. WHILE a User is a Free_User, THE App SHALL render the Makeup Suggestions section with a blur filter applied over the content area.
2. WHILE a User is a Free_User, THE Lock_Overlay SHALL display a lock icon and an "Upgrade to Pro ₹31/month" button centred over the blurred Makeup Suggestions content.
3. WHEN a Free_User taps the "Upgrade to Pro ₹31/month" button on the Lock_Overlay, THE App SHALL open the Paywall_Modal.
4. WHILE a User is a Pro_User, THE App SHALL render the Makeup Suggestions section without any blur or lock overlay.

---

### Requirement 7: Outfit Combinations Limit (Free Tier)

**User Story:** As a Free_User, I want to see 2 outfit combinations from my analysis, so that I get value from the feature while being shown what more is available with Pro.

#### Acceptance Criteria

1. WHILE a User is a Free_User, THE App SHALL display the first 2 outfit combinations from the analysis result without restriction.
2. WHILE a User is a Free_User and the analysis result contains more than 2 outfit combinations, THE App SHALL render outfit combinations 3 through 5 with a blur filter and a Lock_Overlay.
3. THE Lock_Overlay on locked outfit combinations SHALL display a lock icon and an "Upgrade to Pro ₹31/month" button.
4. WHEN a Free_User taps the "Upgrade to Pro ₹31/month" button on a locked outfit combination, THE App SHALL open the Paywall_Modal.
5. WHILE a User is a Pro_User, THE App SHALL display all outfit combinations without any blur or lock overlay.

---

### Requirement 8: Virtual Wardrobe Item Limit

**User Story:** As a User, I want to save outfit items to my Virtual Wardrobe within my plan's limit, so that I can build a personal style collection.

#### Acceptance Criteria

1. WHILE a User is a Free_User and the Wardrobe contains fewer than 10 items, THE App SHALL allow the User to save new items to the Wardrobe.
2. WHEN a Free_User attempts to save a new Wardrobe item and the Wardrobe already contains 10 or more items, THE Plan_Gate SHALL block the save and display a message: "Wardrobe full. Upgrade to Pro to save up to 50 items."
3. WHILE a User is a Pro_User and the Wardrobe contains fewer than 50 items, THE App SHALL allow the User to save new items to the Wardrobe.
4. WHEN a Pro_User attempts to save a new Wardrobe item and the Wardrobe already contains 50 or more items, THE App SHALL block the save and display a message: "Wardrobe limit of 50 items reached."
5. THE App SHALL check the current Wardrobe item count from Firestore before each save attempt to ensure the limit is enforced accurately.

---

### Requirement 9: History Panel Limit

**User Story:** As a User, I want to view my analysis history within my plan's limit, so that I can refer back to past results.

#### Acceptance Criteria

1. WHILE a User is a Free_User, THE History_Panel SHALL fetch and display only the 5 most recent analysis records from `users/{uid}/history`, ordered by date descending.
2. WHILE a User is a Pro_User, THE History_Panel SHALL fetch and display up to the 20 most recent analysis records from `users/{uid}/history`, ordered by date descending.
3. WHILE a User is a Free_User and the history list contains more than 5 records, THE History_Panel SHALL display a prompt below the 5th record indicating that older history is available with Pro.

---

### Requirement 10: Ad Display Control

**User Story:** As a Pro_User, I want to use the app without ads, so that I have an uninterrupted premium experience.

#### Acceptance Criteria

1. WHILE a User is a Free_User, THE App SHALL render the AdSense component on the Home screen and any other screens where it currently appears.
2. WHILE a User is a Pro_User, THE App SHALL NOT render the AdSense component on any screen.

---

### Requirement 11: Razorpay Payment Flow

**User Story:** As a Free_User, I want to pay ₹31/month via Razorpay to upgrade to Pro, so that I can unlock all features immediately.

#### Acceptance Criteria

1. WHEN a User initiates an upgrade from the Paywall_Modal or Settings_Screen, THE Razorpay_Client SHALL open the Razorpay Checkout modal pre-filled with amount 3100 paise (₹31), currency `INR`, and the User's name and email from Firebase Auth.
2. WHEN the User completes payment in Razorpay Checkout, THE App SHALL send `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to `POST /api/payment/verify` with the Firebase Auth ID token in the `Authorization: Bearer` header.
3. WHEN the Payment_API receives a verify request, THE Payment_API SHALL validate the Razorpay signature using the Razorpay secret key.
4. WHEN the Payment_API signature validation succeeds, THE Payment_API SHALL update `users/{uid}/subscription` in Firestore to `plan: 'pro'` and `valid_until` set to exactly 30 days from the current UTC timestamp.
5. WHEN the Payment_API returns a success response, THE App SHALL refresh the Plan_Gate subscription state and display a success confirmation to the User.
6. IF the Payment_API signature validation fails, THEN THE Payment_API SHALL return HTTP 400 and THE App SHALL display an error message: "Payment verification failed. Please contact support."
7. IF the Razorpay Checkout is dismissed by the User without completing payment, THEN THE App SHALL close the Razorpay modal and return the User to the Paywall_Modal without changing the subscription state.

---

### Requirement 12: Paywall Modal UI

**User Story:** As a Free_User, I want to see a clear comparison of Free vs Pro plans when I hit a limit, so that I can make an informed decision about upgrading.

#### Acceptance Criteria

1. THE Paywall_Modal SHALL display the current plan limit context message (e.g., "6 analyses used this month") at the top.
2. THE Paywall_Modal SHALL display a side-by-side or stacked comparison of Free tier and Pro tier features including: analyses per month, outfit checks per month, Accessories tab, Makeup Suggestions, Wardrobe item limit, Outfit combinations, History limit, and Ads.
3. THE Paywall_Modal SHALL display a primary CTA button labelled "Upgrade to Pro — ₹31/month".
4. THE Paywall_Modal SHALL display a secondary dismiss option labelled "Maybe later".
5. WHEN a User taps "Upgrade to Pro — ₹31/month" in the Paywall_Modal, THE App SHALL initiate the Razorpay payment flow as defined in Requirement 11.
6. WHEN a User taps "Maybe later", THE App SHALL close the Paywall_Modal without initiating payment.
7. THE Paywall_Modal SHALL be accessible as a bottom sheet on mobile viewports and as a centred modal on desktop viewports.

---

### Requirement 13: Settings Screen — Plan Status and Usage

**User Story:** As a User, I want to see my current plan and monthly usage in Settings, so that I can monitor my usage and manage my subscription.

#### Acceptance Criteria

1. THE Settings_Screen SHALL display the User's current plan as either "Free" or "Pro" in a dedicated plan status section.
2. WHILE a User is a Free_User, THE Settings_Screen SHALL display current month usage in the format "X/6 analyses used" and "X/10 outfit checks used".
3. WHILE a User is a Free_User, THE Settings_Screen SHALL display an "Upgrade to Pro — ₹31/month" button.
4. WHEN a Free_User taps "Upgrade to Pro — ₹31/month" in Settings, THE App SHALL open the Paywall_Modal.
5. WHILE a User is a Pro_User, THE Settings_Screen SHALL display a "Pro Member ✓" badge.
6. WHILE a User is a Pro_User, THE Settings_Screen SHALL display the subscription expiry date in the format "Valid until DD MMM YYYY".
7. THE Settings_Screen SHALL read usage data from Firestore at `users/{uid}/usage/{YYYY-MM}` for the current calendar month.

---

### Requirement 14: Backend Payment Verification Endpoint

**User Story:** As the system, I need a secure backend endpoint to verify Razorpay payments, so that subscription upgrades cannot be spoofed from the client.

#### Acceptance Criteria

1. THE Payment_API SHALL expose `POST /api/payment/verify` accepting a JSON body with fields `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
2. THE Payment_API SHALL require a valid Firebase Auth ID token in the `Authorization: Bearer` header and reject requests without a valid token with HTTP 401.
3. THE Payment_API SHALL verify the Razorpay payment signature by computing HMAC-SHA256 of `{razorpay_order_id}|{razorpay_payment_id}` using the Razorpay secret key and comparing it to `razorpay_signature`.
4. IF the computed signature does not match `razorpay_signature`, THEN THE Payment_API SHALL return HTTP 400 with a descriptive error message and SHALL NOT update Firestore.
5. WHEN signature verification succeeds, THE Payment_API SHALL write `plan: 'pro'` and `valid_until: <now + 30 days ISO string>` to `users/{uid}/subscription` in Firestore, where `uid` is extracted from the verified Firebase Auth token.
6. WHEN the Firestore write succeeds, THE Payment_API SHALL return HTTP 200 with a JSON body containing `{ "status": "success", "valid_until": "<ISO date>" }`.
7. IF the Firestore write fails, THEN THE Payment_API SHALL return HTTP 500 and log the error.

---

### Requirement 15: Firestore Security Rules

**User Story:** As the system, I need Firestore security rules to protect subscription and usage data, so that users cannot manipulate their own plan or usage counts from the client.

#### Acceptance Criteria

1. THE App's Firestore security rules SHALL allow authenticated Users to read their own `users/{uid}/subscription` document.
2. THE App's Firestore security rules SHALL deny write access to `users/{uid}/subscription` from the client for all Users; writes SHALL only be permitted via the Firebase Admin SDK used by the Payment_API backend.
3. THE App's Firestore security rules SHALL allow authenticated Users to read their own `users/{uid}/usage/{month}` documents.
4. THE App's Firestore security rules SHALL allow authenticated Users to write (increment) their own `users/{uid}/usage/{month}` documents, but SHALL restrict the `analyses_count` field to a maximum value of 6 and `outfit_checks_count` to a maximum of 10 for Free_Users.
5. IF an unauthenticated client attempts to read or write any `users/{uid}/subscription` or `users/{uid}/usage/{month}` document, THEN THE Firestore security rules SHALL deny the request.
