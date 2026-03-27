# Implementation Plan: SEO Blog Pages

## Overview

Install react-router-dom, refactor App.jsx to use a router, add static pages, a blog system, a shared Footer, and an SEOHead component. All pages match the dark `bg-[#050816]` theme. Testing uses Vitest + @testing-library/react + fast-check.

## Tasks

- [x] 1. Install dependencies and configure routing infrastructure
  - Run `npm install react-router-dom` inside `frontend/`
  - Update `frontend/vite.config.js` to add `historyApiFallback` support for the dev server (already handled by Vite's default SPA mode; confirm `build.rollupOptions` is not needed)
  - Update `frontend/index.html` to confirm `<meta name="viewport">` exists and add the AdSense placeholder comment
  - _Requirements: 1.1, 1.8, 6.3, 6.6_

- [x] 2. Create SEOHead component
  - [x] 2.1 Implement `frontend/src/components/SEOHead.jsx`
    - Accept `title` and `description` props
    - Set `document.title = title` in a `useEffect`
    - Find or create a `<meta name="description">` tag and set its `content` attribute
    - Clean up on unmount by restoring previous values
    - _Requirements: 5.1, 5.9_

  - [ ]* 2.2 Write property test for SEOHead
    - **Property 1: Title and description are always reflected in the document after render**
    - **Validates: Requirements 5.1, 5.9**
    - Use fast-check to generate arbitrary title/description strings and assert `document.title` matches

- [x] 3. Create shared Footer component
  - [x] 3.1 Implement `frontend/src/components/Footer.jsx`
    - Use `<Link>` from react-router-dom for all nav links: /, /about, /privacy, /contact, /terms, /blog
    - Display copyright notice "© 2025 StyleGuru AI. All rights reserved."
    - Apply dark theme (`bg-[#050816]`, purple/pink accents, `border-gray-800/50`)
    - Use `flex-wrap` / `flex-col sm:flex-row` for mobile responsiveness
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 3.2 Write unit tests for Footer
    - Assert all six nav links render with correct `href` attributes
    - Assert copyright text is present
    - _Requirements: 4.2, 4.4_

- [x] 4. Refactor App.jsx to use react-router-dom
  - [x] 4.1 Wrap the app in `<BrowserRouter>` inside `frontend/src/main.jsx`
    - Import `BrowserRouter` from react-router-dom and wrap `<App />` with it
    - _Requirements: 1.1_

  - [x] 4.2 Replace conditional rendering in `App.jsx` with `<Routes>` and `<Route>` declarations
    - Route `/` → `<LandingPage>` (public, no auth required)
    - Route `/about`, `/privacy`, `/contact`, `/terms` → respective static page components
    - Route `/blog` → `<BlogListPage>`
    - Route `/blog/:slug` → `<BlogPostPage>`
    - Route `/dashboard` → auth-guarded: redirect to `/` if not authenticated, else render `<Dashboard>`
    - Route `*` → `<NotFoundPage>`
    - Keep existing Firebase `onAuthStateChanged` logic and `ThemeContext`
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 4.3 Write unit tests for routing logic
    - Test that `/dashboard` redirects unauthenticated users to `/`
    - Test that `/dashboard` renders Dashboard for authenticated users
    - Test that an unknown route renders the 404 page
    - _Requirements: 1.6, 1.7_

- [x] 5. Checkpoint — Ensure router is wired and app loads without errors
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement static pages
  - [x] 6.1 Create `frontend/src/pages/AboutPage.jsx`
    - Render SEOHead with title "About – StyleGuru AI" and matching description
    - Display the required about text (Req 2.1)
    - Apply dark theme, include `<Footer />`
    - _Requirements: 2.1, 2.5, 2.6, 5.3_

  - [x] 6.2 Create `frontend/src/pages/PrivacyPage.jsx`
    - Render SEOHead with title "Privacy Policy – StyleGuru AI"
    - Display the required privacy text (Req 2.2) including cookie/data collection statement
    - Apply dark theme, include `<Footer />`
    - _Requirements: 2.2, 2.5, 2.6, 5.4, 6.5_

  - [x] 6.3 Create `frontend/src/pages/ContactPage.jsx`
    - Render SEOHead with title "Contact – StyleGuru AI"
    - Display a `mailto:` link for the contact email
    - Apply dark theme, include `<Footer />`
    - _Requirements: 2.3, 2.5, 2.6, 5.5, 6.4_

  - [x] 6.4 Create `frontend/src/pages/TermsPage.jsx`
    - Render SEOHead with title "Terms of Use – StyleGuru AI"
    - Display the required terms text (Req 2.4)
    - Apply dark theme, include `<Footer />`
    - _Requirements: 2.4, 2.5, 2.6, 5.6_

  - [ ]* 6.5 Write unit tests for static pages
    - Assert each page renders its required text content
    - Assert SEOHead receives correct title/description props
    - Assert Footer is present on each page
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 7. Implement blog data and blog list page
  - [x] 7.1 Create `frontend/src/data/blogPosts.js`
    - Export an array of blog post objects: `{ slug, title, excerpt, date, content }`
    - Include three posts: `skin-tone-colors`, `outfit-guide`, `ai-fashion`
    - Each `content` field must be 300+ words of original article text
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 6.2_

  - [x] 7.2 Create `frontend/src/pages/BlogListPage.jsx`
    - Import blog posts from `blogPosts.js`
    - Render a card grid: each card shows title, excerpt, and a `<Link>` to `/blog/:slug`
    - Render SEOHead with title "Fashion Blog – StyleGuru AI" and matching description
    - Apply dark theme, include `<Footer />`
    - _Requirements: 3.1, 3.2, 5.7_

  - [ ]* 7.3 Write unit tests for BlogListPage
    - Assert all three blog cards render with correct titles and links
    - _Requirements: 3.1, 3.2_

- [x] 8. Implement blog post page
  - [x] 8.1 Create `frontend/src/pages/BlogPostPage.jsx`
    - Use `useParams()` to read `:slug`
    - Look up the matching post from `blogPosts.js`
    - If no match, render `<Navigate to="/404" />` or the NotFoundPage
    - Display article title, publication date, and full content body
    - Render SEOHead with post-specific title and description
    - Apply dark theme, include `<Footer />`
    - _Requirements: 3.6, 3.7, 3.8, 5.8_

  - [ ]* 8.2 Write property test for blog post lookup
    - **Property 2: For every slug in blogPosts, BlogPostPage renders the correct title**
    - **Validates: Requirements 3.6, 5.8**
    - Use fast-check to pick arbitrary valid slugs and assert correct content renders

  - [ ]* 8.3 Write unit test for unknown slug
    - Assert that navigating to `/blog/nonexistent` renders the 404 page
    - _Requirements: 3.8_

- [x] 9. Create NotFoundPage
  - Create `frontend/src/pages/NotFoundPage.jsx`
  - Display a "404 – Page Not Found" message with a link back to `/`
  - Apply dark theme
  - _Requirements: 1.7_

- [x] 10. Add Footer and SEOHead to LandingPage
  - Modify `frontend/src/components/LandingPage.jsx` to:
    - Import and render `<SEOHead>` with the home page title and description at the top
    - Replace the existing inline footer markup with the shared `<Footer />` component
  - _Requirements: 4.1, 5.2_

- [x] 11. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- `react-router-dom` must be installed before any routing tasks begin (Task 1)
- Blog post content in `blogPosts.js` must meet the 300-word minimum per post for AdSense eligibility
- Property tests use fast-check; unit tests use Vitest + @testing-library/react
