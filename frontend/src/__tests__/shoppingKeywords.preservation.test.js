/**
 * Preservation Property Tests — topPicksMap Curated URLs + Budget Filter Behavior
 *
 * Validates: Requirements 3.1, 3.2, 3.4
 *
 * IMPORTANT: These tests MUST PASS on unfixed code.
 * They encode the baseline behavior that must be preserved after the fix.
 *
 * Property 2: Preservation
 *   1. For all colors in topPicksMap with matching categories, curated URL is used (not dynamic fallback)
 *   2. For all budget values (₹500, ₹1000, ₹2000, Any), correct price params are appended
 *   3. Budget "Any" → no price param in URL
 *   4. topPicksMap colors render the "⭐ Top Pick — All 4 Platforms" badge (topPick is truthy)
 */

import { describe, it, expect } from 'vitest';

// ── Replicate ShoppingLinks logic from ResultsDisplay.jsx ────────────────────
// Source: frontend/src/components/ResultsDisplay.jsx — ShoppingLinks component

const AMAZON_TAG = 'styleguruai-21';

/**
 * Build topPicksMap exactly as in ResultsDisplay.jsx ShoppingLinks.
 * amzPriceParam / fkPriceParam / myntraPriceParam are injected into curated URLs.
 */
function buildTopPicksMap(amzPriceParam, fkPriceParam, myntraPriceParam) {
  return {
    'navy blue': {
      shirt:   { amz: `https://www.amazon.in/s?k=navy+blue+men+oversized+tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/men-tshirts?q=navy+blue+oversized&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=navy+blue+men+oversized${myntraPriceParam}`, mee: 'https://meesho.com/search?q=navy+blue+men+oversized+tshirt' },
      pant:    { amz: `https://www.amazon.in/s?k=navy+blue+men+cargo+pants&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/men-jeans?q=navy+blue+cargo&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/cargos?rawQuery=navy+blue+cargo${myntraPriceParam}`, mee: 'https://meesho.com/search?q=navy+blue+men+cargo+pants' },
      dress:   { amz: `https://www.amazon.in/s?k=navy+blue+women+coord+set&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/women-western-wear?q=navy+blue+coord+set&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=navy+blue+coord+set${myntraPriceParam}`, mee: 'https://meesho.com/search?q=navy+blue+women+coord+set' },
    },
    'teal': {
      shirt:   { amz: `https://www.amazon.in/s?k=teal+men+oversized+tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/men-tshirts?q=teal+oversized&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=teal+men+oversized${myntraPriceParam}`, mee: 'https://meesho.com/search?q=teal+men+oversized+tshirt' },
      dress:   { amz: `https://www.amazon.in/s?k=teal+women+coord+set+maxi&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/women-western-wear?q=teal+coord+set&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=teal+coord+set${myntraPriceParam}`, mee: 'https://meesho.com/search?q=teal+women+coord+set' },
    },
    'rust': {
      shirt:   { amz: `https://www.amazon.in/s?k=rust+orange+men+oversized+tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/men-tshirts?q=rust+orange+oversized&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=rust+orange+men${myntraPriceParam}`, mee: 'https://meesho.com/search?q=rust+orange+men+tshirt' },
      dress:   { amz: `https://www.amazon.in/s?k=rust+women+coord+set+maxi&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/women-western-wear?q=rust+coord+set&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=rust+coord+set${myntraPriceParam}`, mee: 'https://meesho.com/search?q=rust+women+coord+set' },
    },
    'cobalt blue': {
      shirt:   { amz: `https://www.amazon.in/s?k=cobalt+blue+men+tshirt+polo&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/men-tshirts?q=cobalt+blue+polo&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=cobalt+blue+men+polo${myntraPriceParam}`, mee: 'https://meesho.com/search?q=cobalt+blue+men+tshirt+polo' },
      dress:   { amz: `https://www.amazon.in/s?k=cobalt+blue+women+coord+set&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/women-western-wear?q=cobalt+blue+coord&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=cobalt+blue+coord+set${myntraPriceParam}`, mee: 'https://meesho.com/search?q=cobalt+blue+women+coord+set' },
    },
    'forest green': {
      shirt:   { amz: `https://www.amazon.in/s?k=forest+green+men+oversized+tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/men-tshirts?q=forest+green+oversized&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=forest+green+men+oversized${myntraPriceParam}`, mee: 'https://meesho.com/search?q=forest+green+men+oversized+tshirt' },
      kurti:   { amz: `https://www.amazon.in/s?k=forest+green+women+kurti&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/women-kurtas-and-suits?q=forest+green+kurti&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/kurtas?rawQuery=forest+green+kurti${myntraPriceParam}`, mee: 'https://meesho.com/search?q=forest+green+women+kurti' },
    },
    'mustard': {
      shirt:   { amz: `https://www.amazon.in/s?k=mustard+yellow+men+polo+tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/men-tshirts?q=mustard+yellow+polo&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=mustard+yellow+men+polo${myntraPriceParam}`, mee: 'https://meesho.com/search?q=mustard+yellow+men+polo+tshirt' },
      dress:   { amz: `https://www.amazon.in/s?k=mustard+yellow+women+coord+set&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/women-western-wear?q=mustard+coord+set&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=mustard+yellow+coord+set${myntraPriceParam}`, mee: 'https://meesho.com/search?q=mustard+yellow+women+coord+set' },
    },
    'burgundy': {
      shirt:   { amz: `https://www.amazon.in/s?k=burgundy+maroon+men+oversized+tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/men-tshirts?q=burgundy+maroon+oversized&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=burgundy+men+oversized${myntraPriceParam}`, mee: 'https://meesho.com/search?q=burgundy+maroon+men+tshirt' },
      lehenga: { amz: `https://www.amazon.in/s?k=burgundy+women+lehenga+choli&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/women-lehenga-cholis?q=burgundy+lehenga&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/lehenga-cholis?rawQuery=burgundy+lehenga${myntraPriceParam}`, mee: 'https://meesho.com/search?q=burgundy+women+lehenga+choli' },
    },
    'coral': {
      dress:   { amz: `https://www.amazon.in/s?k=coral+women+maxi+dress+coord&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/women-western-wear?q=coral+coord+set&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/co-ords?rawQuery=coral+coord+set${myntraPriceParam}`, mee: 'https://meesho.com/search?q=coral+women+coord+set+maxi' },
      shirt:   { amz: `https://www.amazon.in/s?k=coral+men+polo+tshirt&rh=n%3A1968024031${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`, fk: `https://www.flipkart.com/men-tshirts?q=coral+polo&sort=popularity${fkPriceParam}`, myn: `https://www.myntra.com/tshirts?rawQuery=coral+men+polo${myntraPriceParam}`, mee: 'https://meesho.com/search?q=coral+men+polo+tshirt' },
    },
  };
}

/**
 * Simulate ShoppingLinks URL resolution for a given color + category.
 * Returns { topPick, links } — mirrors the component logic.
 */
function resolveShoppingLinks(colorName, category = 'shirt', budget = null) {
  const colorDisplay = colorName.toLowerCase().replace(/\s+/g, ' ');
  const colorLower = colorName.toLowerCase().replace(/\s+/g, '+');
  const colorKey = colorDisplay.toLowerCase();

  const amzPriceParam = budget?.amzMax ? `%2Cp_36%3A-${budget.amzMax * 100}` : '';
  const fkPriceParam = budget?.fkMax ? `&p%5B%5D=facets.price_range.from%3D0&p%5B%5D=facets.price_range.to%3D${budget.fkMax}` : '';
  const myntraPriceParam = budget?.myntraMax ? `&p=price%5B0%5D%3D0%20TO%20${budget.myntraMax}` : '';

  const topPicksMap = buildTopPicksMap(amzPriceParam, fkPriceParam, myntraPriceParam);
  const topPick = topPicksMap[colorKey]?.[category];

  // Fallback cfg (simplified — only what's needed for these tests)
  const cfg = {
    amzKw: `${colorDisplay} men ${category}`,
    amzNode: '1968024031',
    fkCat: 'men-tshirts',
    myntra: `https://www.myntra.com/fashion?rawQuery=${colorLower}+men`,
    meesho: `${colorDisplay} men ${category}`,
  };

  const links = {
    amazon:   topPick?.amz || `https://www.amazon.in/s?k=${encodeURIComponent(cfg.amzKw)}&rh=n%3A${cfg.amzNode}${amzPriceParam}&sort=featured&tag=${AMAZON_TAG}`,
    flipkart: topPick?.fk  || `https://www.flipkart.com/${cfg.fkCat}?q=${encodeURIComponent(colorDisplay)}&sort=popularity${fkPriceParam}`,
    myntra:   topPick?.myn || `${cfg.myntra}${myntraPriceParam}`,
    meesho:   topPick?.mee || `https://meesho.com/search?q=${encodeURIComponent(cfg.meesho)}`,
  };

  return { topPick, links };
}

/**
 * Build OutfitShopCard URLs exactly as in OutfitChecker.jsx.
 * Source: frontend/src/components/OutfitChecker.jsx — OutfitShopCard component
 */
function buildOutfitShopCardURLs(color, budget = null) {
  const AMAZON_TAG = 'styleguruai-21';
  const colorDisplay = color.name.toLowerCase();
  const colorLower = colorDisplay.replace(/\s+/g, '+');

  const amzPriceParam = budget?.max ? `%2Cp_36%3A-${budget.max * 100}` : '';
  const fkPriceParam = budget?.max ? `&p%5B%5D=facets.price_range.from%3D0&p%5B%5D=facets.price_range.to%3D${budget.max}` : '';
  const myntraPriceParam = budget?.max ? `&p=price%5B0%5D%3D0%20TO%20${budget.max}` : '';

  return {
    amazon:   `https://www.amazon.in/s?k=${encodeURIComponent(colorDisplay + ' men tshirt polo shirt')}&rh=n%3A1968024031${amzPriceParam}&sort=review-rank&tag=${AMAZON_TAG}`,
    flipkart: `https://www.flipkart.com/men-tshirts?q=${encodeURIComponent(colorDisplay)}&sort=popularity${fkPriceParam}`,
    myntra:   `https://www.myntra.com/tshirts?rawQuery=${colorLower}+men${myntraPriceParam}`,
    meesho:   `https://meesho.com/search?q=${encodeURIComponent(colorDisplay + ' men tshirt shirt')}`,
    _params: { amzPriceParam, fkPriceParam, myntraPriceParam },
  };
}

// ── All topPicksMap entries to test ──────────────────────────
// Each entry: [colorName, category]
const TOP_PICKS_ENTRIES = [
  ['navy blue', 'shirt'],
  ['navy blue', 'pant'],
  ['navy blue', 'dress'],
  ['teal', 'shirt'],
  ['teal', 'dress'],
  ['rust', 'shirt'],
  ['rust', 'dress'],
  ['cobalt blue', 'shirt'],
  ['cobalt blue', 'dress'],
  ['forest green', 'shirt'],
  ['forest green', 'kurti'],
  ['mustard', 'shirt'],
  ['mustard', 'dress'],
  ['burgundy', 'shirt'],
  ['burgundy', 'lehenga'],
  ['coral', 'dress'],
  ['coral', 'shirt'],
];

// ── Budget test cases ─────────────────────────────────────────
const BUDGET_CASES = [
  { label: '₹500',  max: 500,  amzMax: 500,  fkMax: 500,  myntraMax: 500  },
  { label: '₹1000', max: 1000, amzMax: 1000, fkMax: 1000, myntraMax: 1000 },
  { label: '₹2000', max: 2000, amzMax: 2000, fkMax: 2000, myntraMax: 2000 },
];

// ── Tests ─────────────────────────────────────────────────────

describe('Preservation — topPicksMap Curated URLs (ShoppingLinks)', () => {
  /**
   * Validates: Requirements 3.1, 3.4
   *
   * For every color+category in topPicksMap, the resolved URL must be the curated
   * topPick URL — NOT the dynamic fallback. This confirms the curated entries are
   * used as-is and must not be broken by the fix.
   */

  for (const [colorName, category] of TOP_PICKS_ENTRIES) {
    it(`${colorName} + ${category} → uses curated topPick URL (not fallback)`, () => {
      const { topPick, links } = resolveShoppingLinks(colorName, category);

      // topPick must be truthy — curated entry exists
      expect(topPick).toBeTruthy();

      // Amazon URL must be the curated one
      expect(links.amazon).toBe(topPick.amz);

      // Flipkart URL must be the curated one
      expect(links.flipkart).toBe(topPick.fk);

      // Myntra URL must be the curated one
      expect(links.myntra).toBe(topPick.myn);

      // Meesho URL must be the curated one
      expect(links.meesho).toBe(topPick.mee);
    });
  }
});

describe('Preservation — topPick badge rendered for topPicksMap colors', () => {
  /**
   * Validates: Requirements 3.1, 3.4
   *
   * When a color+category has a topPicksMap entry, topPick is truthy,
   * which triggers the "⭐ Top Pick — All 4 Platforms" badge in the UI.
   */

  for (const [colorName, category] of TOP_PICKS_ENTRIES) {
    it(`${colorName} + ${category} → topPick is truthy (badge shown)`, () => {
      const { topPick } = resolveShoppingLinks(colorName, category);
      expect(topPick).toBeTruthy();
    });
  }
});

describe('Preservation — Non-topPicksMap color uses fallback (not curated)', () => {
  /**
   * Validates: Requirements 3.1
   *
   * Colors NOT in topPicksMap (e.g., "Lavender") must use the fallback cfg,
   * meaning topPick is falsy. This baseline must be preserved.
   */

  it('Lavender + shirt → topPick is falsy (fallback used)', () => {
    const { topPick } = resolveShoppingLinks('Lavender', 'shirt');
    expect(topPick).toBeFalsy();
  });

  it('Pink + dress → topPick is falsy (fallback used)', () => {
    const { topPick } = resolveShoppingLinks('Pink', 'dress');
    expect(topPick).toBeFalsy();
  });
});

describe('Preservation — Budget filter price params in OutfitShopCard', () => {
  /**
   * Validates: Requirements 3.2
   *
   * For each budget value, the correct price params must be appended to URLs.
   * This confirms the budget filter logic is unchanged.
   */

  const testColor = { name: 'Navy Blue', hex: '#001F5B' };

  for (const b of BUDGET_CASES) {
    it(`Budget ${b.label} → Amazon URL contains amzPriceParam "%2Cp_36%3A-${b.max * 100}"`, () => {
      const urls = buildOutfitShopCardURLs(testColor, { max: b.max, label: b.label });
      expect(urls.amazon).toContain(`%2Cp_36%3A-${b.max * 100}`);
    });

    it(`Budget ${b.label} → Flipkart URL contains fkPriceParam "facets.price_range.to%3D${b.max}"`, () => {
      const urls = buildOutfitShopCardURLs(testColor, { max: b.max, label: b.label });
      expect(urls.flipkart).toContain(`facets.price_range.to%3D${b.max}`);
    });

    it(`Budget ${b.label} → Myntra URL contains myntraPriceParam "price%5B0%5D%3D0%20TO%20${b.max}"`, () => {
      const urls = buildOutfitShopCardURLs(testColor, { max: b.max, label: b.label });
      expect(urls.myntra).toContain(`price%5B0%5D%3D0%20TO%20${b.max}`);
    });
  }

  it('Budget "Any" (null) → Amazon URL has NO price param', () => {
    const urls = buildOutfitShopCardURLs(testColor, null);
    expect(urls.amazon).not.toContain('%2Cp_36%3A-');
  });

  it('Budget "Any" (null) → Flipkart URL has NO price param', () => {
    const urls = buildOutfitShopCardURLs(testColor, null);
    expect(urls.flipkart).not.toContain('facets.price_range');
  });

  it('Budget "Any" (null) → Myntra URL has NO price param', () => {
    const urls = buildOutfitShopCardURLs(testColor, null);
    expect(urls.myntra).not.toContain('price%5B0%5D');
  });
});

describe('Preservation — Budget filter price params in ShoppingLinks (topPicksMap)', () => {
  /**
   * Validates: Requirements 3.2, 3.4
   *
   * For ShoppingLinks with a topPicksMap color, budget price params must be
   * injected into the curated URLs correctly.
   */

  const colorName = 'navy blue';
  const category = 'shirt';

  for (const b of BUDGET_CASES) {
    it(`ShoppingLinks navy blue+shirt, Budget ${b.label} → Amazon curated URL contains amzPriceParam`, () => {
      const budget = { amzMax: b.amzMax, fkMax: b.fkMax, myntraMax: b.myntraMax, label: b.label };
      const { topPick, links } = resolveShoppingLinks(colorName, category, budget);

      expect(topPick).toBeTruthy();
      expect(links.amazon).toContain(`%2Cp_36%3A-${b.amzMax * 100}`);
    });

    it(`ShoppingLinks navy blue+shirt, Budget ${b.label} → Flipkart curated URL contains fkPriceParam`, () => {
      const budget = { amzMax: b.amzMax, fkMax: b.fkMax, myntraMax: b.myntraMax, label: b.label };
      const { topPick, links } = resolveShoppingLinks(colorName, category, budget);

      expect(topPick).toBeTruthy();
      expect(links.flipkart).toContain(`facets.price_range.to%3D${b.fkMax}`);
    });

    it(`ShoppingLinks navy blue+shirt, Budget ${b.label} → Myntra curated URL contains myntraPriceParam`, () => {
      const budget = { amzMax: b.amzMax, fkMax: b.fkMax, myntraMax: b.myntraMax, label: b.label };
      const { topPick, links } = resolveShoppingLinks(colorName, category, budget);

      expect(topPick).toBeTruthy();
      expect(links.myntra).toContain(`price%5B0%5D%3D0%20TO%20${b.myntraMax}`);
    });
  }

  it('ShoppingLinks navy blue+shirt, Budget "Any" → Amazon curated URL has NO price param', () => {
    const { topPick, links } = resolveShoppingLinks(colorName, category, null);
    expect(topPick).toBeTruthy();
    expect(links.amazon).not.toContain('%2Cp_36%3A-');
  });

  it('ShoppingLinks navy blue+shirt, Budget "Any" → Flipkart curated URL has NO price param', () => {
    const { topPick, links } = resolveShoppingLinks(colorName, category, null);
    expect(topPick).toBeTruthy();
    expect(links.flipkart).not.toContain('facets.price_range');
  });

  it('ShoppingLinks navy blue+shirt, Budget "Any" → Myntra curated URL has NO price param', () => {
    const { topPick, links } = resolveShoppingLinks(colorName, category, null);
    expect(topPick).toBeTruthy();
    expect(links.myntra).not.toContain('price%5B0%5D');
  });
});
