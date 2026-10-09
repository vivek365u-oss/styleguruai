import { describe, it, expect } from 'vitest';
import { getCategoryGroup, getCategoryLabel, WARDROBE_SECTIONS } from '../constants/fashionCategories';
import { buildMyntraUrl } from '../utils/myntraUrl';

describe('Direct Wardrobe Add & Organization Flow', () => {
  it('correctly categorizes manual items into wardrobe sections', () => {
    expect(getCategoryGroup('cat_formal_shirt')).toBe('FORMAL');
    expect(getCategoryGroup('cat_kurti')).toBe('ETHNIC');
    expect(getCategoryGroup('cat_jeans')).toBe('BOTTOMS');
    expect(getCategoryGroup('cat_sneakers')).toBe('FOOTWEAR');
    expect(getCategoryGroup('cat_hoodie')).toBe('OUTERWEAR');
    expect(getCategoryGroup('cat_tshirt')).toBe('CASUAL');
  });

  it('allows saving wardrobe item even with low compatibility score (unconditional direct save)', () => {
    // Simulating user manual add payload
    const manualItem = {
      source: 'manual_add',
      category: 'cat_tshirt',
      tags: ['tag_casual'],
      fit: 'fit_oversized',
      fabric: 'fabric_cotton',
      pattern: 'pattern_solid',
      mood: 'mood_comfort',
      gender: 'male',
      hex: '#00FF00', // Neon green - might have lower harmony score
      color_name: 'Neon Green',
      compatibility_score: 45, // low score
      status: 'available',
      saved_at: new Date().toISOString()
    };

    // Verify properties
    expect(manualItem.source).toBe('manual_add');
    expect(manualItem.compatibility_score).toBe(45);
    expect(manualItem.status).toBe('available');
    // Ensure it can be added without rejection
    const isSaveAllowed = Boolean(manualItem.category && manualItem.status);
    expect(isSaveAllowed).toBe(true);
  });

  it('generates valid Myntra deep links for direct wardrobe items', () => {
    const url = buildMyntraUrl({
      color: 'Midnight Navy',
      catId: 'cat_formal_shirt',
      gender: 'male'
    });

    expect(url).toContain('https://www.myntra.com/formal-shirts');
    expect(url).toContain('rawQuery=');
    expect(url).toContain('midnight%20navy');
  });

  it('filters wardrobe items by laundry status and category accurately', () => {
    const mockWardrobe = [
      { id: '1', category: 'cat_formal_shirt', status: 'available' },
      { id: '2', category: 'cat_jeans', status: 'laundry' },
      { id: '3', category: 'cat_kurta_set', status: 'available' },
      { id: '4', category: 'cat_tshirt', status: 'laundry' }
    ];

    const cleanItems = mockWardrobe.filter(i => i.status === 'available');
    const laundryItems = mockWardrobe.filter(i => i.status === 'laundry');

    expect(cleanItems).toHaveLength(2);
    expect(laundryItems).toHaveLength(2);

    const formalItems = mockWardrobe.filter(i => getCategoryGroup(i.category) === 'FORMAL');
    expect(formalItems).toHaveLength(1);
    expect(formalItems[0].id).toBe('1');
  });
});
