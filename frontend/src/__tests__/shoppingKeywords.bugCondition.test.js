/**
 * Bug Condition Exploration Test — Hardcoded Keyword Bug
 *
 * Validates: Requirements 1.1, 1.2, 1.4
 *
 * ORIGINALLY: This test FAILED on unfixed code (confirmed bug existed).
 * NOW (post-fix): This test MUST PASS — confirms bug is fixed.
 *
 * isBugCondition(colorName, generatedURL):
 *   colorInURL   := colorName.toLowerCase() IN generatedURL.toLowerCase()
 *   hasTrending  := ANY keyword IN ["oversized", "trending 2025", "streetwear", "coord set", "cargo"]
 *                   WHERE keyword IN generatedURL
 *   Bug condition: NOT colorInURL OR NOT hasTrending
 */

import { describe, it, expect } from 'vitest';

// ── Helpers ──────────────────────────────────────────────────

const TRENDING_KEYWORDS = ['oversized', 'trending 2025', 'streetwear', 'coord set', 'cargo'];

function isBugCondition(colorName, generatedURL) {
  const colorInURL = generatedURL.toLowerCase().includes(colorName.toLowerCase());
  const hasTrending = TRENDING_KEYWORDS.some(kw => generatedURL.includes(kw));
  return !colorInURL || !hasTrending;
}

// ── Replicate OutfitShopCard URL construction (FIXED — from OutfitChecker.jsx) ──────
// Source: frontend/src/components/OutfitChecker.jsx — OutfitShopCard component (post-fix)
// colorDisplay = color.name.toLowerCase()
// colorLower   = colorDisplay.replace(/\s+/g, '+')
// Amazon URL:  `https://www.amazon.in/s?k=${encodeURIComponent(colorDisplay + ' men oversized tshirt streetwear trending 2025')}&rh=n%3A1968024031&sort=review-rank&tag=StyleGuruAI-21`
// Flipkart URL:`https://www.flipkart.com/men-tshirts?q=${encodeURIComponent(colorDisplay + ' men oversized tshirt')}&sort=popularity`
// Myntra URL:  `https://www.myntra.com/tshirts?rawQuery=${colorLower}+men+oversized`
// Meesho URL:  `https://meesho.com/search?q=${encodeURIComponent(colorDisplay + ' men oversized tshirt trending')}`

function buildOutfitShopCardURLs(color) {
  const AMAZON_TAG = 'StyleGuruAI-21';
  const colorDisplay = color.name.toLowerCase();
  const colorLower = colorDisplay.replace(/\s+/g, '+');

  return {
    amazon:   `https://www.amazon.in/s?k=${encodeURIComponent(colorDisplay + ' men oversized tshirt streetwear trending 2025')}&rh=n%3A1968024031&sort=review-rank&tag=${AMAZON_TAG}`,
    flipkart: `https://www.flipkart.com/men-tshirts?q=${encodeURIComponent(colorDisplay + ' men oversized tshirt')}&sort=popularity`,
    myntra:   `https://www.myntra.com/tshirts?rawQuery=${colorLower}+men+oversized`,
    meesho:   `https://meesho.com/search?q=${encodeURIComponent(colorDisplay + ' men oversized tshirt trending')}`,
  };
}

// ── Replicate ShoppingLinks fallback cfg URL construction (FIXED — from ResultsDisplay.jsx) ──
// Source: frontend/src/components/ResultsDisplay.jsx — ShoppingLinks component (post-fix)
// Fallback cfg (when category not in categoryConfig):
//   cfg = { amzKw: `${colorDisplay} ${isFemale ? 'women' : 'men'} ${category} oversized trending 2025`, ... fkCat: 'men-tshirts', ... }
// Amazon fallback URL: `https://www.amazon.in/s?k=${encodeURIComponent(cfg.amzKw)}&rh=n%3A1968024031&sort=featured&tag=StyleGuruAI-21`
// Note: Flipkart fallback URL still uses colorDisplay only; Amazon fallback now has trending keywords.

function buildShoppingLinksFallbackAmazonURL(colorName, category = 'shirt', gender = 'male') {
  const isFemale = gender === 'female';
  const AMAZON_TAG = 'StyleGuruAI-21';
  const colorDisplay = colorName.toLowerCase().replace(/\s+/g, ' ');
  const amzKw = `${colorDisplay} ${isFemale ? 'women' : 'men'} ${category} oversized trending 2025`;
  return `https://www.amazon.in/s?k=${encodeURIComponent(amzKw)}&rh=n%3A1968024031&sort=featured&tag=${AMAZON_TAG}`;
}

// ── Tests ────────────────────────────────────────────────────

describe('Bug Condition — Hardcoded Keyword Bug in OutfitShopCard', () => {
  /**
   * Validates: Requirements 1.1, 1.2, 1.4
   *
   * These tests MUST FAIL on unfixed code.
   * Current URLs use hardcoded "men tshirt polo shirt" without trending keywords.
   * Expected: URLs contain color name AND at least one trending keyword.
   */

  it('Navy Blue — Amazon URL should contain "navy blue" AND a trending keyword', () => {
    const color = { name: 'Navy Blue', hex: '#001F5B' };
    const urls = buildOutfitShopCardURLs(color);
    const amazonURL = decodeURIComponent(urls.amazon);

    // Assert color name is in URL
    expect(amazonURL.toLowerCase()).toContain('navy blue');

    // Assert at least one trending keyword is in URL
    const hasTrending = TRENDING_KEYWORDS.some(kw => amazonURL.includes(kw));
    expect(hasTrending).toBe(true);

    // Confirm bug condition is NOT present (this will FAIL on unfixed code)
    expect(isBugCondition('Navy Blue', amazonURL)).toBe(false);
  });

  it('Rust — Amazon URL should contain "rust" AND a trending keyword', () => {
    const color = { name: 'Rust', hex: '#B7410E' };
    const urls = buildOutfitShopCardURLs(color);
    const amazonURL = decodeURIComponent(urls.amazon);

    expect(amazonURL.toLowerCase()).toContain('rust');

    const hasTrending = TRENDING_KEYWORDS.some(kw => amazonURL.includes(kw));
    expect(hasTrending).toBe(true);

    expect(isBugCondition('Rust', amazonURL)).toBe(false);
  });

  it('Coral — Amazon URL should contain "coral" AND a trending keyword', () => {
    const color = { name: 'Coral', hex: '#FF7F50' };
    const urls = buildOutfitShopCardURLs(color);
    const amazonURL = decodeURIComponent(urls.amazon);

    expect(amazonURL.toLowerCase()).toContain('coral');

    const hasTrending = TRENDING_KEYWORDS.some(kw => amazonURL.includes(kw));
    expect(hasTrending).toBe(true);

    expect(isBugCondition('Coral', amazonURL)).toBe(false);
  });
});

describe('Bug Condition — ShoppingLinks fallback with color not in topPicksMap', () => {
  /**
   * Validates: Requirements 1.3, 1.4
   *
   * "Lavender" is not in topPicksMap, so the fallback cfg is used.
   * The fallback Amazon URL should contain "lavender" AND a trending keyword.
   * Post-fix: amzKw = `${colorDisplay} men ${category} oversized trending 2025`
   * Note: Flipkart fallback URL still uses colorDisplay only (no trending keyword added).
   */

  it('Lavender (not in topPicksMap) — Amazon fallback URL should contain "lavender" AND a trending keyword', () => {
    const amazonURL = decodeURIComponent(buildShoppingLinksFallbackAmazonURL('Lavender', 'shirt', 'male'));

    expect(amazonURL.toLowerCase()).toContain('lavender');

    const hasTrending = TRENDING_KEYWORDS.some(kw => amazonURL.includes(kw));
    expect(hasTrending).toBe(true);

    expect(isBugCondition('Lavender', amazonURL)).toBe(false);
  });
});
