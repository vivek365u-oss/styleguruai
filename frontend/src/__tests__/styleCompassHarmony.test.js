import { describe, it, expect } from 'vitest';
import { scoreWardrobeItem } from '../utils/stylingEngine';
import { getCategoryGroup } from '../constants/fashionCategories';

describe('Style Compass Harmony & Gender Normalization', () => {
  it('does NOT return 0% harmony when profile gender has different casing ("Male" vs "male")', () => {
    const item = {
      id: 'item1',
      name: 'Navy Blue Formal Shirt',
      category: 'cat_formal_shirt',
      color_name: 'Navy',
      hex: '#000080',
      gender: 'male',
      vibe: 'formal'
    };

    const profileUpper = {
      skinTone: 'medium',
      undertone: 'warm',
      gender: 'Male' // Uppercase Male from Firebase/Profile
    };

    const score = scoreWardrobeItem(item, { weather: 'sunny' }, profileUpper, [], { gender: 'Male' });
    expect(score).toBeGreaterThan(0);
  });

  it('allows unisex garments regardless of user gender', () => {
    const item = {
      id: 'item_hoodie',
      name: 'Black Oversized Hoodie',
      category: 'cat_hoodie',
      color_name: 'Black',
      hex: '#000000',
      gender: 'unisex',
      vibe: 'casual'
    };

    const maleProfile = { skinTone: 'fair', undertone: 'cool', gender: 'male' };
    const femaleProfile = { skinTone: 'fair', undertone: 'cool', gender: 'female' };

    expect(scoreWardrobeItem(item, { weather: 'sunny' }, maleProfile)).toBeGreaterThan(0);
    expect(scoreWardrobeItem(item, { weather: 'sunny' }, femaleProfile)).toBeGreaterThan(0);
  });

  it('rejects cross-gender specific clothing with strict 0 score', () => {
    const sareeItem = {
      id: 'saree1',
      name: 'Silk Saree',
      category: 'cat_saree',
      color_name: 'Crimson',
      hex: '#DC143C',
      gender: 'female'
    };

    const maleProfile = { skinTone: 'medium', undertone: 'warm', gender: 'male' };
    expect(scoreWardrobeItem(sareeItem, { weather: 'sunny' }, maleProfile)).toBe(0);
  });

  it('accurately resolves category groups for tops and bottoms', () => {
    expect(getCategoryGroup('cat_jeans')).toBe('BOTTOMS');
    expect(getCategoryGroup('cat_chinos')).toBe('BOTTOMS');
    expect(getCategoryGroup('cat_cargo')).toBe('BOTTOMS');
    expect(getCategoryGroup('cat_casual_shirt')).toBe('CASUAL');
    expect(getCategoryGroup('cat_formal_shirt')).toBe('FORMAL');
    expect(getCategoryGroup('cat_kurta_set')).toBe('ETHNIC');
  });
});
