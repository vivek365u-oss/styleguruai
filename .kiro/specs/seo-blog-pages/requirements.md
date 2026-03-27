# Requirements Document

## Introduction

This feature adds SEO-optimized static pages (/about, /privacy, /contact, /terms), a blog system (/blog, /blog/skin-tone-colors, /blog/outfit-guide, /blog/ai-fashion), a site-wide footer, and per-page SEO meta tags to the existing StyleGuru AI (ToneFit) React + Vite frontend. The new pages must be publicly accessible without login, match the existing dark purple theme, be mobile-responsive, and be structured for Google AdSense eligibility.

## Glossary

- **App**: The StyleGuru AI / ToneFit React + Vite single-page application.
- **Router**: The `react-router-dom` v6 client-side routing layer to be added to the App.
- **Static_Page**: A publicly accessible, non-authenticated page (/about, /privacy, /contact, /terms).
- **Blog_System**: The collection of pages comprising the blog list (/blog) and individual blog post pages.
- **Blog_Post**: A single article page under /blog/:slug.
- **Footer**: The site-wide navigation footer rendered on all public pages.
- **SEO_Head**: A reusable component that injects `<title>` and `<meta name="description">` tags into the document `<head>` for each page.
- **Landing_Page**: The existing public home page rendered at /.
- **Auth_Guard**: The logic that redirects unauthenticated users away from protected routes (Dashboard).
- **Theme**: The existing dark background (#050816) with purple/pink gradient visual style.

---

## Requirements

### Requirement 1: Client-Side Routing

**User Story:** As a user, I want to navigate between pages using URLs, so that I can share links and use the browser back/forward buttons.

#### Acceptance Criteria

1. THE App SHALL use `react-router-dom` v6 to manage all client-side navigation.
2. WHEN a user navigates to /, THE Router SHALL render the Landing_Page without requiring authentication.
3. WHEN a user navigates to /about, /privacy, /contact, or /terms, THE Router SHALL render the corresponding Static_Page without requiring authentication.
4. WHEN a user navigates to /blog, THE Router SHALL render the blog list page without requiring authentication.
5. WHEN a user navigates to /blog/:slug, THE Router SHALL render the matching Blog_Post page without requiring authentication.
6. WHEN a user navigates to /dashboard, THE Auth_Guard SHALL redirect unauthenticated users to / and render the Dashboard for authenticated users.
7. WHEN a user navigates to an undefined route, THE Router SHALL render a 404 not-found page.
8. THE App SHALL configure the Vite dev server and production build to support direct URL access (history API fallback).

---

### Requirement 2: Static Pages

**User Story:** As a visitor, I want to read information about the service, privacy policy, contact details, and terms of use, so that I can make informed decisions about using the app.

#### Acceptance Criteria

1. THE About_Page SHALL display the following content: "Style Guru AI is an AI-powered fashion advisor that helps users choose the best outfits based on their skin tone. Users can upload their photo and receive personalized recommendations for colors, outfits, and styling tips. Our goal is to simplify fashion decisions using AI."
2. THE Privacy_Page SHALL display the following content: "We respect your privacy. Style Guru AI does not store or share your uploaded images. Images are processed securely for analysis purposes only. We may use cookies to improve user experience. Third-party services like Google AdSense may use cookies. By using our website, you agree to this policy."
3. THE Contact_Page SHALL display a contact email address rendered as a clickable `mailto:` link.
4. THE Terms_Page SHALL display the following content: "By using this website, you agree to use the service responsibly. All recommendations are for informational purposes only. We are not responsible for decisions made based on suggestions."
5. WHEN a Static_Page is rendered, THE Static_Page SHALL apply the Theme (dark background #050816, purple/pink gradient accents) consistently with the Landing_Page.
6. WHEN a Static_Page is rendered on a viewport narrower than 768px, THE Static_Page SHALL reflow content into a single-column layout without horizontal overflow.

---

### Requirement 3: Blog System

**User Story:** As a visitor, I want to read fashion and AI-related blog articles, so that I can learn about style tips and discover the app through search engines.

#### Acceptance Criteria

1. THE Blog_List_Page SHALL display a card for each available Blog_Post, showing the post title, a short excerpt, and a link to the full post.
2. WHEN a user clicks a blog card, THE Router SHALL navigate to the corresponding /blog/:slug URL.
3. THE Blog_Post for slug `skin-tone-colors` SHALL contain an article explaining which colors suit fair, medium, and dark skin tones.
4. THE Blog_Post for slug `outfit-guide` SHALL contain an article explaining outfit selection based on occasion, color, and season.
5. THE Blog_Post for slug `ai-fashion` SHALL contain an article explaining how AI assists in outfit recommendation.
6. WHEN a Blog_Post page is rendered, THE Blog_Post SHALL display the article title, publication date, and full article body.
7. WHEN a Blog_Post page is rendered on a viewport narrower than 768px, THE Blog_Post SHALL reflow into a single-column readable layout without horizontal overflow.
8. WHEN a user navigates to /blog/:slug with a slug that does not match any Blog_Post, THE Router SHALL render the 404 not-found page.

---

### Requirement 4: Site-Wide Footer

**User Story:** As a visitor, I want a footer on every public page, so that I can easily navigate to legal, informational, and blog pages.

#### Acceptance Criteria

1. THE Footer SHALL render on the Landing_Page, all Static_Pages, and all Blog_System pages.
2. THE Footer SHALL contain navigation links to: / (Home), /about, /privacy, /contact, /terms, and /blog.
3. WHEN a Footer link is clicked, THE Router SHALL navigate to the target page without a full page reload.
4. THE Footer SHALL display a copyright notice: "© 2025 StyleGuru AI. All rights reserved."
5. WHEN the Footer is rendered on a viewport narrower than 768px, THE Footer SHALL stack navigation links vertically without horizontal overflow.
6. THE Footer SHALL apply the Theme consistently with the rest of the App.

---

### Requirement 5: SEO Meta Tags

**User Story:** As a site owner, I want each page to have a unique title and meta description, so that search engines can index and display the pages correctly.

#### Acceptance Criteria

1. THE SEO_Head component SHALL accept `title` and `description` props and inject them into the document `<head>` using `document.title` and a `<meta name="description">` tag.
2. WHEN the / route is active, THE SEO_Head SHALL set title to "StyleGuru AI – AI-Powered Fashion Advisor" and description to "Get personalized outfit recommendations based on your skin tone using AI. Upload a selfie and discover your perfect colors."
3. WHEN the /about route is active, THE SEO_Head SHALL set title to "About – StyleGuru AI" and description to "Learn about StyleGuru AI, the AI-powered fashion advisor that helps you choose outfits based on your skin tone."
4. WHEN the /privacy route is active, THE SEO_Head SHALL set title to "Privacy Policy – StyleGuru AI" and description to "Read the StyleGuru AI privacy policy. We do not store or share your uploaded images."
5. WHEN the /contact route is active, THE SEO_Head SHALL set title to "Contact – StyleGuru AI" and description to "Get in touch with the StyleGuru AI team."
6. WHEN the /terms route is active, THE SEO_Head SHALL set title to "Terms of Use – StyleGuru AI" and description to "Read the StyleGuru AI terms of use before using the service."
7. WHEN the /blog route is active, THE SEO_Head SHALL set title to "Fashion Blog – StyleGuru AI" and description to "Read fashion tips, skin tone guides, and AI styling articles on the StyleGuru AI blog."
8. WHEN a /blog/:slug route is active, THE SEO_Head SHALL set the title and description to values specific to that Blog_Post.
9. WHEN the user navigates between routes, THE SEO_Head SHALL update the document title and meta description to reflect the current page within the same browser session.

---

### Requirement 6: AdSense Readiness

**User Story:** As a site owner, I want the site to meet Google AdSense eligibility requirements, so that I can monetize the blog and static pages.

#### Acceptance Criteria

1. THE App SHALL serve all public pages over HTTPS in the production deployment.
2. THE Blog_Post pages SHALL each contain a minimum of 300 words of original article content.
3. THE App SHALL include a `<meta name="viewport" content="width=device-width, initial-scale=1">` tag in the root `index.html`.
4. THE Contact_Page SHALL display a valid, human-readable contact method (email address).
5. THE Privacy_Page SHALL explicitly state the App's data collection and cookie usage policy.
6. THE App's `index.html` SHALL include a placeholder `<script>` comment indicating where the Google AdSense script tag should be inserted.
