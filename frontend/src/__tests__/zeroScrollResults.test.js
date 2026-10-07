import { describe, it, expect } from 'vitest';
import { COMMON_STORES, MALE_STORES, FEMALE_STORES, buildShopUrl } from '../utils/shoppingUrls';
import { buildMyntraUrl } from '../utils/myntraUrl';

describe('Zero Scroll & Smart Shop Tests', () => {
  it('ShopActionSheet has exactly 10 stores for each gender (5 common + 5 gender-specific)', () => {
    expect(COMMON_STORES.length).toBe(5);
    expect(MALE_STORES.length).toBe(5);
    expect(FEMALE_STORES.length).toBe(5);

    const maleTotal = [...COMMON_STORES, ...MALE_STORES];
    const femaleTotal = [...COMMON_STORES, ...FEMALE_STORES];

    expect(maleTotal.length).toBe(10);
    expect(femaleTotal.length).toBe(10);

    // Verify all stores have required fields
    maleTotal.forEach(store => {
      expect(store.id).toBeDefined();
      expect(store.name).toBeDefined();
      expect(store.domain).toBeDefined();
    });

    femaleTotal.forEach(store => {
      expect(store.id).toBeDefined();
      expect(store.name).toBeDefined();
      expect(store.domain).toBeDefined();
    });
  });

  it('buildShopUrl generates valid URLs for all 10 stores for male', () => {
    const item = { query: 'navy blue casual shirt', catId: 'shirt', color: 'navy blue' };
    const maleTotal = [...COMMON_STORES, ...MALE_STORES];

    maleTotal.forEach(store => {
      const url = buildShopUrl(item, store.id, 'male');
      expect(url).toBeDefined();
      expect(url.startsWith('https://')).toBe(true);
      expect(url).not.toContain('undefined');
    });
  });

  it('buildShopUrl generates valid URLs for all 10 stores for female', () => {
    const item = { query: 'emerald green banarasi saree', catId: 'saree', color: 'emerald green' };
    const femaleTotal = [...COMMON_STORES, ...FEMALE_STORES];

    femaleTotal.forEach(store => {
      const url = buildShopUrl(item, store.id, 'female');
      expect(url).toBeDefined();
      expect(url.startsWith('https://')).toBe(true);
      expect(url).not.toContain('undefined');
    });
  });

  it('buildMyntraUrl uses correct clean paths and avoids 0-product query bloat', () => {
    // Female Dress path
    const dressUrl = buildMyntraUrl({ color: 'red', catId: 'dress', gender: 'female' });
    expect(dressUrl).toContain('dresses');
    expect(dressUrl).not.toContain('co-ords');
    expect(dressUrl).not.toContain('&f=Gender:');

    // Female Saree path
    const sareeUrl = buildMyntraUrl({ color: 'pink', catId: 'saree', gender: 'female' });
    expect(sareeUrl).toContain('sarees');

    // Male T-Shirt path
    const tshirtUrl = buildMyntraUrl({ color: 'black', catId: 'tshirt', gender: 'male' });
    expect(tshirtUrl).toContain('t-shirts');
    expect(tshirtUrl).not.toContain('oversized%20drop%20shoulder');

    // Male Kurta path
    const kurtaUrl = buildMyntraUrl({ color: 'white', catId: 'kurta', gender: 'male' });
    expect(kurtaUrl).toContain('kurtas');
  });
});
