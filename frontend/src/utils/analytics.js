/**
 * analytics.js — Centralized Google Analytics Event Tracking for StyleGuruAI
 * 
 * Usage: import { trackEvent, trackConversion, trackPageView } from '../utils/analytics';
 * 
 * GA4 automatically tracks: page_view, session_start, first_visit, scroll, click
 * This module adds CUSTOM events for business-critical user actions.
 */

// ── Safe gtag wrapper (never crashes if gtag isn't loaded) ──
function gtag(...args) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

// ══════════════════════════════════════════════════
//  1. PAGE VIEWS (SPA-aware — React Router doesn't auto-track)
// ══════════════════════════════════════════════════
export function trackPageView(path, title) {
  gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.origin + path,
  });
}

// ══════════════════════════════════════════════════
//  2. CUSTOM EVENTS (User Actions)
// ══════════════════════════════════════════════════
export function trackEvent(eventName, params = {}) {
  gtag('event', eventName, {
    ...params,
    event_timestamp: new Date().toISOString(),
  });
}

// ══════════════════════════════════════════════════
//  3. CONVERSION EVENTS (Key Business Goals)
// ══════════════════════════════════════════════════

/** User completes skin tone analysis — PRIMARY conversion */
export function trackAnalysisComplete(skinTone, undertone) {
  gtag('event', 'analysis_complete', {
    skin_tone: skinTone || 'unknown',
    undertone: undertone || 'unknown',
    conversion: true,
  });
  // Also fire as a GA4 conversion event
  gtag('event', 'conversion', {
    send_to: 'G-XCN1TC3P26',
    event_category: 'engagement',
    event_label: 'skin_analysis_complete',
  });
}

/** User signs up / creates account */
export function trackSignUp(method) {
  gtag('event', 'sign_up', {
    method: method || 'email', // 'google', 'email', etc.
  });
}

/** User logs in */
export function trackLogin(method) {
  gtag('event', 'login', {
    method: method || 'email',
  });
}

// ══════════════════════════════════════════════════
//  4. ENGAGEMENT EVENTS (User Retention Signals)
// ══════════════════════════════════════════════════

/** User reads a blog post */
export function trackBlogRead(slug, title) {
  gtag('event', 'blog_read', {
    blog_slug: slug,
    blog_title: title,
    content_type: 'blog_post',
  });
}

/** User scrolls to 50%/75%/100% of blog */
export function trackBlogScroll(slug, percentage) {
  gtag('event', 'blog_scroll_depth', {
    blog_slug: slug,
    scroll_percentage: percentage,
  });
}

/** User clicks CTA button (Get Started, Analyze, etc.) */
export function trackCTAClick(ctaName, location) {
  gtag('event', 'cta_click', {
    cta_name: ctaName,
    cta_location: location, // 'hero', 'footer', 'blog_post', 'navbar'
  });
}

/** User adds item to wardrobe */
export function trackWardrobeAdd(itemType) {
  gtag('event', 'wardrobe_add', {
    item_type: itemType || 'outfit',
  });
}

/** User saves a color palette */
export function trackColorSave(colorCount) {
  gtag('event', 'color_save', {
    color_count: colorCount || 1,
  });
}

/** User uploads a selfie for analysis */
export function trackSelfieUpload() {
  gtag('event', 'selfie_upload', {
    event_category: 'engagement',
    event_label: 'photo_upload',
  });
}

/** User shares content */
export function trackShare(contentType, method) {
  gtag('event', 'share', {
    content_type: contentType, // 'blog', 'analysis_result', 'color_palette'
    method: method,            // 'whatsapp', 'copy_link', 'twitter'
  });
}

// ══════════════════════════════════════════════════
//  5. TRAFFIC SOURCE TRACKING (UTM-aware)
// ══════════════════════════════════════════════════

/** Extract and log UTM parameters from URL (for campaign tracking) */
export function trackUTMParams() {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmMedium = params.get('utm_medium');
  const utmCampaign = params.get('utm_campaign');
  const utmContent = params.get('utm_content');

  if (utmSource) {
    gtag('event', 'campaign_visit', {
      utm_source: utmSource,
      utm_medium: utmMedium || 'none',
      utm_campaign: utmCampaign || 'none',
      utm_content: utmContent || 'none',
      landing_page: window.location.pathname,
    });
  }
}

// ══════════════════════════════════════════════════
//  6. USER PROPERTIES (Retention Segmentation)
// ══════════════════════════════════════════════════

/** Set user properties for segmentation in GA4 reports */
export function setUserProperties(properties) {
  gtag('set', 'user_properties', properties);
}

/** Track returning user session */
export function trackUserReturn(analysisCount, daysSinceFirst) {
  gtag('event', 'user_return', {
    total_analyses: analysisCount,
    days_since_first_visit: daysSinceFirst,
    user_segment: analysisCount > 5 ? 'power_user' : analysisCount > 1 ? 'returning' : 'new',
  });
}

// ══════════════════════════════════════════════════
//  7. E-COMMERCE / MONETIZATION EVENTS
// ══════════════════════════════════════════════════

/** User views a product recommendation */
export function trackProductView(productName, source) {
  gtag('event', 'view_item', {
    item_name: productName,
    item_category: 'fashion_recommendation',
    source: source, // 'analysis_result', 'blog', 'wardrobe'
  });
}

/** User clicks affiliate/shopping link */
export function trackOutboundClick(url, linkText) {
  gtag('event', 'outbound_click', {
    link_url: url,
    link_text: linkText,
    outbound: true,
  });
}

// ══════════════════════════════════════════════════
//  8. DEEP FEATURE / TAB TRACKING
// ══════════════════════════════════════════════════

/** Track which in-app tab/section the user visits */
export function trackTabView(tabId) {
  gtag('event', 'tab_view', {
    tab_name: tabId,
    timestamp: new Date().toISOString(),
  });

  // Also fire specific named events for each tab
  const tabEvents = {
    home: 'view_home',
    analyze: 'view_analyze',
    history: 'view_history',
    wardrobe: 'view_wardrobe',
    navigator: 'view_style_compass',
    tools: 'view_tools',
    scanner: 'view_color_scanner',
    profile: 'view_profile',
  };
  const specificEvent = tabEvents[tabId];
  if (specificEvent) {
    gtag('event', specificEvent, { source: 'tab_navigation' });
  }
}

/** Track shopping page interactions */
export function trackShoppingView(category, itemCount) {
  gtag('event', 'view_shopping', {
    shopping_category: category || 'all',
    item_count: itemCount || 0,
  });
}

/** Track shopping item click */
export function trackShoppingItemClick(itemName, itemPrice, itemUrl) {
  gtag('event', 'shopping_item_click', {
    item_name: itemName,
    item_price: itemPrice || 0,
    item_url: itemUrl || '',
    event_category: 'monetization',
  });
}

/** Track Style Compass usage */
export function trackStyleCompassUse(action, detail) {
  gtag('event', 'style_compass_use', {
    compass_action: action, // 'view', 'filter', 'recommend', 'save'
    compass_detail: detail || '',
  });
}

/** Track Color Scanner usage */
export function trackColorScannerUse(action, color) {
  gtag('event', 'color_scanner_use', {
    scanner_action: action, // 'scan', 'match', 'save'
    color_detected: color || '',
  });
}

/** Track wardrobe interaction */
export function trackWardrobeInteraction(action, itemCount) {
  gtag('event', 'wardrobe_interaction', {
    wardrobe_action: action, // 'view', 'add', 'remove', 'check_outfit'
    item_count: itemCount || 0,
  });
}

/** Track history panel usage */
export function trackHistoryView(entryCount) {
  gtag('event', 'history_view', {
    history_entries: entryCount || 0,
  });
}

/** Track tools tab usage */
export function trackToolUse(toolName) {
  gtag('event', 'tool_use', {
    tool_name: toolName, // 'outfit_checker', 'color_scanner', 'style_quiz'
  });
}

// ══════════════════════════════════════════════════
//  9. SUBSCRIPTION / MONETIZATION EVENTS
// ══════════════════════════════════════════════════

/** Track subscription modal open */
export function trackSubscriptionView(source) {
  gtag('event', 'subscription_view', {
    source: source || 'unknown', // 'profile', 'limit_reached', 'banner'
  });
}

/** Track subscription purchase */
export function trackSubscriptionPurchase(plan, price) {
  gtag('event', 'purchase', {
    currency: 'INR',
    value: price || 0,
    items: [{ item_name: plan || 'pro', quantity: 1 }],
  });
}

/** Track upgrade button click */
export function trackUpgradeClick(source) {
  gtag('event', 'upgrade_click', {
    source: source || 'unknown',
    event_category: 'monetization',
  });
}

// ══════════════════════════════════════════════════
//  10. TIME-ON-PAGE TRACKING
// ══════════════════════════════════════════════════

let _pageEnterTime = Date.now();

/** Call when entering a new tab/page */
export function markPageEnter() {
  _pageEnterTime = Date.now();
}

/** Call when leaving a tab/page — sends time spent */
export function trackTimeOnPage(pageName) {
  const seconds = Math.round((Date.now() - _pageEnterTime) / 1000);
  if (seconds > 1) {
    gtag('event', 'time_on_page', {
      page_name: pageName,
      time_seconds: seconds,
      time_bucket: seconds < 10 ? 'bounce' : seconds < 30 ? 'short' : seconds < 120 ? 'medium' : 'deep',
    });
  }
  _pageEnterTime = Date.now();
}

// ══════════════════════════════════════════════════
//  11. LEGACY COMPATIBILITY (AppShell uses these)
// ══════════════════════════════════════════════════

/** Event names enum for AppShell compatibility */
export const EVENTS = {
  ANALYSIS_COMPLETE: 'analysis_complete',
  SELFIE_UPLOAD: 'selfie_upload',
  WARDROBE_ADD: 'wardrobe_add',
  COLOR_SAVE: 'color_save',
  SHARE: 'share',
  TAB_VIEW: 'tab_view',
  CTA_CLICK: 'cta_click',
  SHOPPING_CLICK: 'shopping_item_click',
  TOOL_USE: 'tool_use',
  UPGRADE_CLICK: 'upgrade_click',
};

/** Legacy logEvent function used by AppShell */
export function logEvent(eventName, params = {}) {
  gtag('event', eventName, {
    ...params,
    event_timestamp: new Date().toISOString(),
  });
}

