# Requirements Document

## Introduction

This document defines requirements for four user retention features for StyleGuru AI — an Indian skin tone AI fashion app. The features address the core retention gaps identified in the product review: profile data is lost across devices, users have no way to save outfits they like, there is no social sharing mechanism, and push notifications are never actually delivered. Together these four features — User Profile Persistence, Virtual Wardrobe, Social Sharing, and Weekly Style Tips — are designed to increase return visits, deepen engagement, and grow organic reach through sharing.

The app is built on React + Vite (frontend), Python FastAPI on Heroku (backend), Firebase Auth + Firestore (auth and database), and a service worker at `/public/sw.js` (push notifications). The existing localStorage keys `sg_analysis_history` (last 5 entries) and `sg_last_analysis` (most recent result) remain in use for offline-first speed; Firestore is the source of truth for authenticated users.

---

## Glossary

- **Profile_Service**: The frontend module responsible for reading and writing user profile data to Firestore under `users/{uid}/profile`.
- **Wardrobe_Service**: The frontend module responsible for managing saved outfit entries in Firestore under `users/{uid}/wardrobe`.
- **Share_Service**: The frontend module responsible for generating and exporting the style profile card image.
- **Notification_Service**: The combined frontend + backend module responsible for scheduling and delivering weekly push notifications.
- **Style_Profile**: A Firestore document containing a user's skin tone category, undertone, color season, best colors, and style preferences.
- **Wardrobe_Item**: A Firestore document representing one saved outfit, containing outfit combination data, source (analysis or outfit checker), skin tone at time of save, and a timestamp.
- **Style_Card**: A canvas-rendered PNG image showing the user's skin tone swatch, color palette, season label, and app branding, suitable for sharing on WhatsApp or Instagram.
- **Push_Subscription**: A Web Push API `PushSubscription` object stored in Firestore under `users/{uid}/push_subscriptions`.
- **Tip_Scheduler**: The FastAPI background task or cron endpoint that sends weekly push notifications to subscribed users.
- **VAPID**: Voluntary Application Server Identification — the key pair used to authenticate web push messages from the server.
- **Canvas_Renderer**: The browser `<canvas>` API used to compose the Style_Card image client-side.
- **Firestore**: Google Cloud Firestore NoSQL database used as the persistent data store for all user data.
- **sw.js**: The existing service worker at `/public/sw.js` that handles push event reception and notification display.

---

## Requirements

### Requirement 1: User Profile Persistence

**User Story:** As a StyleGuru AI user, I want my skin tone, undertone, color season, and best colors to be saved to my account, so that I do not have to re-analyze every time I open the app on a new device or browser.

#### Acceptance Criteria

1. WHEN a skin tone analysis completes successfully, THE Profile_Service SHALL save the resulting Style_Profile (skin tone category, undertone, color season, best shirt/dress colors, skin hex, confidence score, and analysis timestamp) to Firestore at `users/{uid}/profile`.

2. WHEN an authenticated user opens the Dashboard and a Style_Profile exists in Firestore, THE Profile_Service SHALL load the Style_Profile and display it on the Home screen within 2 seconds of page load.

3. WHEN a Style_Profile is loaded from Firestore, THE Dashboard SHALL display the user's skin tone swatch, undertone badge, and color season label in the "Last Analysis" card without requiring a new photo upload.

4. WHEN a user completes a new analysis, THE Profile_Service SHALL overwrite the existing Style_Profile in Firestore with the new result, preserving the previous entry in the `users/{uid}/history` subcollection.

5. WHILE a user is not authenticated, THE Profile_Service SHALL read from `localStorage` key `sg_last_analysis` as the fallback source of truth and SHALL NOT attempt any Firestore reads or writes.

6. IF a Firestore write fails during profile save, THEN THE Profile_Service SHALL retain the data in `localStorage` and SHALL display a non-blocking toast notification informing the user that the profile could not be synced.

7. WHEN a user logs in on a new device and a Style_Profile exists in Firestore, THE Profile_Service SHALL populate `localStorage` key `sg_last_analysis` with the Firestore data so that offline-first components continue to function correctly.

8. THE Profile_Service SHALL store style preferences (preferred gender mode: male/female, preferred language: en/hinglish) alongside the Style_Profile in Firestore so that preferences are restored on new devices.

9. WHEN style preferences are restored from Firestore on login, THE Dashboard SHALL apply the saved gender mode and language preference before rendering, so that the user sees their preferred configuration immediately.

---

### Requirement 2: Virtual Wardrobe

**User Story:** As a StyleGuru AI user, I want to save outfits I like from my analysis results and outfit checker to a personal digital wardrobe, so that I can revisit and manage my favourite looks without re-analyzing.

#### Acceptance Criteria

1. WHEN a skin tone analysis result is displayed, THE Dashboard SHALL render a "Save to Wardrobe" button on each outfit combination card.

2. WHEN an outfit checker result is displayed, THE Dashboard SHALL render a "Save to Wardrobe" button if the compatibility score is 70 or above.

3. WHEN a user taps "Save to Wardrobe", THE Wardrobe_Service SHALL write a Wardrobe_Item document to Firestore at `users/{uid}/wardrobe/{itemId}` containing: outfit combination data, source type (`analysis` or `outfit_checker`), skin tone category at time of save, skin hex at time of save, and a UTC timestamp.

4. WHEN a Wardrobe_Item is saved successfully, THE Dashboard SHALL display a confirmation toast ("Saved to Wardrobe ✓") and SHALL update the save button state to indicate the item is already saved.

5. WHEN a user navigates to the Wardrobe tab, THE Wardrobe_Service SHALL fetch all Wardrobe_Item documents for the authenticated user from Firestore, ordered by timestamp descending, and SHALL display them in a scrollable list.

6. WHEN the Wardrobe tab is loading, THE Dashboard SHALL display a skeleton loading state for up to 3 seconds before showing an error state if the fetch has not completed.

7. WHEN a user taps a Wardrobe_Item in the list, THE Dashboard SHALL display the full outfit combination details (shirt, pant/dress, shoes, occasion) and the skin tone swatch from the time of save.

8. WHEN a user taps "Delete" on a Wardrobe_Item, THE Wardrobe_Service SHALL delete the document from Firestore and SHALL remove the item from the displayed list without requiring a full page reload.

9. IF a Wardrobe_Item save fails due to a network error, THEN THE Wardrobe_Service SHALL queue the item in `localStorage` under key `sg_wardrobe_queue` and SHALL retry the save the next time the user opens the app with an active network connection.

10. WHILE a user is not authenticated, THE Dashboard SHALL display a "Login to save outfits" prompt in place of the "Save to Wardrobe" button and SHALL NOT render the Wardrobe tab.

11. THE Wardrobe_Service SHALL enforce a maximum of 50 Wardrobe_Item documents per user. WHEN a user attempts to save a 51st item, THE Dashboard SHALL display a message informing the user that the wardrobe limit has been reached and SHALL offer to delete the oldest item to make space.

---

### Requirement 3: Social Sharing — Style Profile Card

**User Story:** As a StyleGuru AI user, I want to share my style profile as a visual card on WhatsApp and Instagram, so that I can show my friends my skin tone and best colors and grow awareness of the app.

#### Acceptance Criteria

1. WHEN a skin tone analysis result is displayed, THE Dashboard SHALL render a "Share My Style" button visible without scrolling on the results screen.

2. WHEN a user taps "Share My Style", THE Share_Service SHALL use the Canvas_Renderer to compose a Style_Card image containing: the user's skin tone swatch (hex color fill), skin tone label (e.g. "Medium Warm"), color season label, a row of up to 5 best color swatches with hex codes, the StyleGuru AI logo/wordmark, and the tagline "Find your style at styleguruai.in".

3. THE Share_Service SHALL render the Style_Card at a resolution of 1080 × 1080 pixels to meet Instagram square post requirements.

4. WHEN the Style_Card has been rendered, THE Share_Service SHALL invoke the Web Share API (`navigator.share`) with the card as a PNG file attachment if the browser supports the Web Share API with file sharing.

5. WHERE the Web Share API with file sharing is not supported by the browser, THE Share_Service SHALL fall back to triggering a PNG file download of the Style_Card using an anchor element with the `download` attribute.

6. WHEN the Style_Card is being rendered, THE Dashboard SHALL display a loading indicator and SHALL disable the "Share My Style" button to prevent duplicate renders.

7. IF the Canvas_Renderer fails to produce a valid image (e.g. canvas is tainted or memory error), THEN THE Share_Service SHALL display an error toast and SHALL log the error to the browser console without crashing the app.

8. THE Style_Card SHALL render correctly in both dark and light theme contexts, using a dark background (`#1e1b4b`) for dark theme and a white background (`#ffffff`) for light theme, so that the card looks polished regardless of the user's current theme setting.

9. THE Share_Service SHALL include the user's first name on the Style_Card (e.g. "Priya's Style Profile") using the display name from Firebase Auth, so that the card feels personal when shared.

10. WHEN the Style_Card is shared or downloaded, THE Share_Service SHALL record a share event in Firestore at `users/{uid}/events` with fields `type: "share"`, `skin_tone`, and `timestamp`, so that share activity can be tracked for analytics.

---

### Requirement 4: Weekly Style Tips — Scheduled Push Notifications

**User Story:** As a StyleGuru AI user, I want to receive a weekly personalized push notification with a style tip based on my saved skin tone and color season, so that I am reminded to come back to the app and discover new outfit ideas.

#### Acceptance Criteria

1. WHEN a user grants browser notification permission and a service worker is registered, THE Notification_Service SHALL call the Web Push API to generate a `PushSubscription` and SHALL save it to Firestore at `users/{uid}/push_subscriptions/{subscriptionId}` along with the user's current skin tone category and color season.

2. WHEN a Push_Subscription is saved, THE Notification_Service SHALL send an immediate welcome push notification via the Tip_Scheduler with the message "StyleGuru AI notifications are on! Your weekly style tips start now 🎨".

3. THE Tip_Scheduler SHALL send one push notification per subscribed user per week, delivered on Monday between 09:00 and 10:00 IST (UTC+5:30).

4. WHEN the Tip_Scheduler sends a weekly notification, THE Tip_Scheduler SHALL select a tip from a curated pool of at least 20 tips that are filtered to match the recipient user's saved skin tone category and color season, so that each notification is relevant to the individual user.

5. WHEN a push notification is received by sw.js, THE sw.js SHALL display the notification with the title "StyleGuru AI 🎨", the tip text as the body, the app favicon as the icon, and a `data.url` pointing to `/dashboard` so that tapping the notification opens the app.

6. WHEN a user taps a push notification, THE sw.js SHALL call `clients.openWindow('/dashboard')` so that the app opens or is brought to the foreground.

7. WHEN a user disables notifications from the Settings screen, THE Notification_Service SHALL delete the user's Push_Subscription document from Firestore so that the Tip_Scheduler stops sending notifications to that subscription.

8. IF a push notification delivery fails with a 410 Gone or 404 Not Found HTTP status from the push service, THEN THE Tip_Scheduler SHALL delete the corresponding Push_Subscription document from Firestore to prevent repeated failed delivery attempts.

9. THE Tip_Scheduler SHALL use VAPID authentication when sending push messages to the Web Push API, with the VAPID private key stored as a server-side environment variable and never exposed to the client.

10. WHEN a user has not completed a skin tone analysis (no Style_Profile in Firestore), THE Notification_Service SHALL still allow notification opt-in and SHALL send generic weekly style tips (not skin-tone-personalised) until a Style_Profile is available.

11. THE Notification_Service SHALL display the current notification permission status ("Enabled ✓", "Blocked", or "Not yet enabled") in the Settings screen, and SHALL provide a direct link to browser notification settings when the status is "Blocked", so that users can re-enable notifications without searching through browser menus.

12. WHERE the user's browser does not support the Web Push API or service workers, THE Notification_Service SHALL hide the notification opt-in UI entirely and SHALL NOT display an error, so that unsupported browsers have a clean experience.

---

### Requirement 5: Cross-Feature Data Consistency

**User Story:** As a StyleGuru AI user, I want all my saved data — profile, wardrobe, and notification preferences — to stay consistent when I log out and log back in or switch devices, so that I never lose my style history.

#### Acceptance Criteria

1. WHEN a user logs out, THE Dashboard SHALL clear all in-memory state (results, wardrobe cache, profile cache) but SHALL NOT clear `localStorage` keys `sg_analysis_history` or `sg_last_analysis`, so that the app remains usable in a logged-out state.

2. WHEN a user logs back in, THE Profile_Service SHALL re-fetch the Style_Profile from Firestore and SHALL overwrite the corresponding `localStorage` keys with the Firestore data, so that the most recent authenticated data takes precedence over any stale local data.

3. WHEN a user logs in on a second device, THE Wardrobe_Service SHALL fetch the full wardrobe from Firestore and SHALL display it correctly without requiring any manual sync action from the user.

4. THE Profile_Service, Wardrobe_Service, and Notification_Service SHALL each use the Firebase Auth `uid` as the Firestore document path root, so that data is always scoped to the authenticated user and never shared between accounts.

5. IF a Firestore security rule rejects a read or write operation, THEN THE affected service SHALL display a user-facing error message in the current language (English or Hinglish) and SHALL log the rejection details to the browser console for debugging.

6. THE Firestore security rules SHALL permit a user to read and write only documents under `users/{uid}` where `{uid}` matches the authenticated user's Firebase Auth uid, so that no user can access another user's profile, wardrobe, or notification subscriptions.
