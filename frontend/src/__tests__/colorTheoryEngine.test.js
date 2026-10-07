import { describe, it, expect } from 'vitest';
import {
  deriveCategoryColors,
  deriveOutfitSuites,
  deriveAccessoriesSuite,
  normalizeSkinProfile,
  MASTER_COLORS
} from '../utils/colorTheoryEngine';

describe('colorTheoryEngine Tests', () => {
  it('correctly normalizes diverse skin profiles and undertones', () => {
    expect(normalizeSkinProfile({ skin_tone: { category: 'ultra_fair', undertone: 'warm' } })).toEqual({
      category: 'fair',
      undertone: 'warm',
    });
    expect(normalizeSkinProfile({ skin_tone: { category: 'medium_light', subcategory: 'cool' } })).toEqual({
      category: 'light',
      undertone: 'cool',
    });
    expect(normalizeSkinProfile({ skin_tone: { category: 'wheatish', undertone: 'neutral' } })).toEqual({
      category: 'medium',
      undertone: 'neutral',
    });
    expect(normalizeSkinProfile({ skin_tone: { category: 'deep_dark', undertone: 'cool' } })).toEqual({
      category: 'dark',
      undertone: 'cool',
    });
  });

  it('derives scientific face-color matched palettes for newly expanded female categories', () => {
    const analysis = { skin_tone: { category: 'fair', undertone: 'warm' } };
    
    // Blouse
    const blouseColors = deriveCategoryColors('blouse', 'female', analysis);
    expect(blouseColors.length).toBeGreaterThanOrEqual(4);
    expect(blouseColors.some(c => c.name.includes('Maroon') || c.name.includes('Gold') || c.name.includes('Champagne'))).toBe(true);

    // Co-ords
    const coordColors = deriveCategoryColors('coord', 'female', analysis);
    expect(coordColors.length).toBeGreaterThanOrEqual(3);
    expect(coordColors.some(c => c.name.includes('Terracotta') || c.name.includes('Olive'))).toBe(true);

    // Shapewear & Basics
    const shapewearColors = deriveCategoryColors('shapewear', 'female', analysis);
    expect(shapewearColors.length).toBeGreaterThanOrEqual(3);
    expect(shapewearColors.some(c => c.name.includes('Nude') || c.name.includes('Sand'))).toBe(true);

    // Footwear
    const footwearColors = deriveCategoryColors('heels', 'female', analysis);
    expect(footwearColors.length).toBeGreaterThanOrEqual(3);
    expect(footwearColors.some(c => c.name.includes('Tan') || c.name.includes('Gold'))).toBe(true);
  });

  it('derives scientific face-color matched palettes for newly expanded male categories', () => {
    const analysis = { skin_tone: { category: 'medium', undertone: 'cool' } };
    
    // Formal / Casual Shirts
    const shirtColors = deriveCategoryColors('shirt', 'male', analysis);
    expect(shirtColors.length).toBeGreaterThanOrEqual(4);
    expect(shirtColors.some(c => c.name.includes('Powder Blue') || c.name.includes('White') || c.name.includes('Charcoal'))).toBe(true);

    // Jackets & Bombers
    const jacketColors = deriveCategoryColors('jacket', 'male', analysis);
    expect(jacketColors.length).toBeGreaterThanOrEqual(3);
    expect(jacketColors.some(c => c.name.includes('Charcoal') || c.name.includes('Navy') || c.name.includes('Black'))).toBe(true);

    // Footwear & Sneakers
    const sneakerColors = deriveCategoryColors('sneakers', 'male', analysis);
    expect(sneakerColors.length).toBeGreaterThanOrEqual(3);
    expect(sneakerColors.some(c => c.name.includes('White') || c.name.includes('Black'))).toBe(true);

    // Basics & Ganjis
    const vestColors = deriveCategoryColors('vest', 'male', analysis);
    expect(vestColors.length).toBeGreaterThanOrEqual(3);
    expect(vestColors.some(c => c.name.includes('White'))).toBe(true);
  });

  it('derives rich outfit suites for both genders', () => {
    const analysis = { skin_tone: { category: 'medium', undertone: 'warm' } };
    
    // Female
    const femaleSuites = deriveOutfitSuites('female', analysis);
    expect(femaleSuites.combos.length).toBeGreaterThanOrEqual(4);
    expect(femaleSuites.sarees.length).toBeGreaterThanOrEqual(3);
    expect(femaleSuites.festive.length).toBeGreaterThanOrEqual(2);
    expect(femaleSuites.sarees[0].shapewear).toBeDefined();
    expect(femaleSuites.sarees[0].blouse).toBeDefined();

    // Male
    const maleSuites = deriveOutfitSuites('male', analysis);
    expect(maleSuites.combos.length).toBeGreaterThanOrEqual(4);
    expect(maleSuites.ethnic.length).toBeGreaterThanOrEqual(3);
    expect(maleSuites.ethnic[0].bundi).toBeDefined();
    expect(maleSuites.ethnic[0].footwear).toBeDefined();
  });

  it('derives comprehensive accessories suites for both genders with strict gender walls', () => {
    const analysis = { skin_tone: { category: 'medium', undertone: 'warm' } };

    // Female Accessories
    const femaleAcc = deriveAccessoriesSuite('female', analysis);
    expect(femaleAcc.jewellery.length).toBeGreaterThanOrEqual(3);
    expect(femaleAcc.bags_footwear.length).toBeGreaterThanOrEqual(3);
    expect(femaleAcc.makeup.length).toBeGreaterThanOrEqual(4);
    expect(femaleAcc.basics_shapewear.length).toBeGreaterThanOrEqual(3);

    // Male Accessories — Zero female items or makeup
    const maleAcc = deriveAccessoriesSuite('male', analysis);
    expect(maleAcc.watches_jewellery.length).toBeGreaterThanOrEqual(4);
    expect(maleAcc.footwear_belts.length).toBeGreaterThanOrEqual(4);
    expect(maleAcc.wallets_bags.length).toBeGreaterThanOrEqual(3);
    expect(maleAcc.grooming.length).toBeGreaterThanOrEqual(2);
    expect(maleAcc.basics_innerwear.length).toBeGreaterThanOrEqual(3);

    // Verify male has NO female innerwear, makeup or feminine jewellery
    const allMaleText = JSON.stringify(maleAcc).toLowerCase();
    expect(allMaleText).not.toContain('saree shapewear');
    expect(allMaleText).not.toContain('lipstick');
    expect(allMaleText).not.toContain('jhumka');
    expect(allMaleText).not.toContain('t-shirt bra');
    expect(allMaleText).not.toContain('petticoat');
  });
});
