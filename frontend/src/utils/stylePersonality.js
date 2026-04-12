/**
 * stylePersonality.js — StyleGuruAI v4.0
 * ════════════════════════════════════════════
 * Evolving Personality System
 * Derives style archetype from user behavior,
 * skin tone, analysis history, and engagement.
 *
 * PERSONALITY ARCHETYPES (6 types):
 *   🌙 The Classicist    — monochrome, timeless, structured
 *   🔥 The Bold Visionary — vibrant, statement, contrasting
 *   ✨ The Minimalist     — neutral, clean, understated
 *   🌼 The Naturalist     — earthy, warm, organic
 *   💜 The Dreamer        — pastels, soft, romantic
 *   ⚡ The Urban Edge     — dark, edgy, contemporary
 *
 * DATA USED:
 *   - Skin tone category
 *   - Number of analyses (experience level)
 *   - Day streak (consistency)
 *   - Gender preference
 *   - Analysis history (color affinities)
 *   - Saved wardrobe items count
 */

// ── Archetype definitions ─────────────────────────────────────
export const ARCHETYPES = {
  classicist: {
    id: 'classicist',
    name: 'The Classicist',
    emoji: '🌙',
    headline: 'Timeless. Structured. Refined.',
    description: 'Your style speaks quietly but powerfully. You gravitate toward clean lines, monochrome palettes, and pieces that outlive trends.',
    tags: ['Timeless', 'Monochrome', 'Structured', 'Minimal'],
    palette: ['#F5F5F0', '#1C1C1C', '#C4B99A', '#6B6B6B'],
    paletteNames: ['Ivory', 'Onyx', 'Taupe', 'Slate'],
    gradFrom: '#374151',
    gradTo: '#1F2937',
    glowColor: 'rgba(55,65,81,0.4)',
    tip: 'Invest in a perfectly fitted blazer — it elevates any outfit instantly.',
    level: 'Refined Curator',
  },
  bold: {
    id: 'bold',
    name: 'The Bold Visionary',
    emoji: '🔥',
    headline: 'Vibrant. Expressive. Fearless.',
    description: 'You use fashion as a canvas. Color contrasts, patterns, and statement pieces are your language — you were born to stand out.',
    tags: ['Statement', 'Vibrant', 'Contrasting', 'Expressive'],
    palette: ['#DC2626', '#F59E0B', '#7C3AED', '#0EA5E9'],
    paletteNames: ['Crimson', 'Amber', 'Violet', 'Cerulean'],
    gradFrom: '#DC2626',
    gradTo: '#7C3AED',
    glowColor: 'rgba(220,38,38,0.3)',
    tip: 'Try unexpected color blocking — pair your boldest piece with something equally daring.',
    level: 'Style Pioneer',
  },
  minimalist: {
    id: 'minimalist',
    name: 'The Minimalist',
    emoji: '✨',
    headline: 'Clean. Intentional. Quietly Luxurious.',
    description: 'Less is your philosophy. Every piece earns its place. You achieve impact through restraint, quality over quantity.',
    tags: ['Neutral', 'Clean Lines', 'Quality-first', 'Understated'],
    palette: ['#F9FAFB', '#E5E7EB', '#9CA3AF', '#4B5563'],
    paletteNames: ['Cream', 'Mist', 'Pebble', 'Graphite'],
    gradFrom: '#6B7280',
    gradTo: '#374151',
    glowColor: 'rgba(107,114,128,0.3)',
    tip: 'One impeccable fit beats five average outfits. Tailor what you love.',
    level: 'Quiet Luxury Expert',
  },
  naturalist: {
    id: 'naturalist',
    name: 'The Naturalist',
    emoji: '🌿',
    headline: 'Earthy. Warm. Authentically You.',
    description: 'Organic textures, warm earth tones, and a connection to materials define your approach. Your wardrobe feels rooted and genuine.',
    tags: ['Earthy', 'Warm Tones', 'Organic', 'Sustainable'],
    palette: ['#78350F', '#A16207', '#166534', '#C68642'],
    paletteNames: ['Cocoa', 'Mustard', 'Forest', 'Caramel'],
    gradFrom: '#92400E',
    gradTo: '#166534',
    glowColor: 'rgba(146,64,14,0.3)',
    tip: 'Layer textures — linen over cotton, leather over wool — for depth.',
    level: 'Earth Tone Connoisseur',
  },
  dreamer: {
    id: 'dreamer',
    name: 'The Dreamer',
    emoji: '💜',
    headline: 'Soft. Romantic. Effortlessly Beautiful.',
    description: 'Pastels, flowing fabrics, and a touch of whimsy define your aesthetic. You approach style with poetry, not rules.',
    tags: ['Soft Palette', 'Romantic', 'Flowing', 'Feminine'],
    palette: ['#FDF2F8', '#FBCFE8', '#C084FC', '#818CF8'],
    paletteNames: ['Petal', 'Blush', 'Lilac', 'Periwinkle'],
    gradFrom: '#C084FC',
    gradTo: '#F472B6',
    glowColor: 'rgba(192,132,252,0.35)',
    tip: 'Soft volume is your superpower — a ruffled blouse or wide-leg trouser changes everything.',
    level: 'Aesthetic Curator',
  },
  urban: {
    id: 'urban',
    name: 'The Urban Edge',
    emoji: '⚡',
    headline: 'Sharp. Contemporary. Unapologetically Modern.',
    description: 'Streetwear meets sophistication. You pull from art, music, and urban culture to create a look that is entirely your own.',
    tags: ['Street', 'Dark Palette', 'Edgy', 'Contemporary'],
    palette: ['#0F0F0F', '#1E1B4B', '#312E81', '#4338CA'],
    paletteNames: ['Jet', 'Midnight', 'Indigo', 'Electric'],
    gradFrom: '#1E1B4B',
    gradTo: '#4338CA',
    glowColor: 'rgba(99,102,241,0.4)',
    tip: 'Add one unexpected item — a tailored piece in your streetwear set — for the perfect tension.',
    level: 'Street Style Architect',
  },
};

// ── Derive archetype from user data ───────────────────────────
export function derivePersonality(userData = {}) {
  const {
    skinTone = '',
    skinHex = '#C68642',
    analysisCount = 0,
    streak = 0,
    gender = 'male',
    wardrobeCount = 0,
    historyTones = [],
  } = userData;

  const tone = skinTone.toLowerCase();
  let scores = {
    classicist: 0,
    bold: 0,
    minimalist: 0,
    naturalist: 0,
    dreamer: 0,
    urban: 0,
  };

  // ── Skin tone signals ──────────────────────────────────────
  // Dark tones → classicist or urban
  if (tone.includes('dark') || tone.includes('deep') || tone.includes('ebony')) {
    scores.urban += 3;
    scores.classicist += 2;
    scores.bold += 2;
  }
  // Medium warm tones → naturalist or bold
  else if (tone.includes('medium') || tone.includes('brown') || tone.includes('caramel') || tone.includes('wheat')) {
    scores.naturalist += 3;
    scores.bold += 2;
    scores.classicist += 1;
  }
  // Warm tones → naturalist or dreamer
  else if (tone.includes('warm') || tone.includes('olive') || tone.includes('tan')) {
    scores.naturalist += 3;
    scores.minimalist += 2;
    scores.dreamer += 1;
  }
  // Light/fair tones → minimalist or dreamer
  else if (tone.includes('light') || tone.includes('fair') || tone.includes('pale')) {
    scores.minimalist += 3;
    scores.dreamer += 3;
    scores.classicist += 1;
  }
  // Default fallback
  else {
    scores.urban += 1;
    scores.minimalist += 1;
    scores.bold += 1;
  }

  // ── Gender signals ─────────────────────────────────────────
  if (gender === 'female') {
    scores.dreamer += 2;
    scores.naturalist += 1;
  } else {
    scores.classicist += 1;
    scores.urban += 1;
  }

  // ── Engagement signals (behavior) ─────────────────────────
  // High analysis count → bold/urban (actively exploring)
  if (analysisCount >= 10) {
    scores.bold += 3;
    scores.urban += 2;
  } else if (analysisCount >= 5) {
    scores.classicist += 2;
    scores.bold += 1;
  } else if (analysisCount >= 2) {
    scores.minimalist += 1;
  }

  // Streak signals consistency → classicist
  if (streak >= 7) {
    scores.classicist += 3;
    scores.minimalist += 1;
  } else if (streak >= 3) {
    scores.classicist += 1;
  }

  // Wardrobe building → naturalist
  if (wardrobeCount >= 10) {
    scores.naturalist += 2;
  } else if (wardrobeCount >= 5) {
    scores.naturalist += 1;
  }

  // ── Find winning archetype ────────────────────────────────
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][0];
  const secondary = sorted[1][0];

  return {
    primary: ARCHETYPES[primary],
    secondary: ARCHETYPES[secondary],
    scores,
  };
}

// ── Style Score (gamified, 0-100) ─────────────────────────────
export function deriveStyleScore(userData = {}) {
  const {
    analysisCount = 0,
    streak = 0,
    wardrobeCount = 0,
    hasSkinTone = false,
  } = userData;

  let score = 0;
  score += Math.min(analysisCount * 8, 40);   // max 40 pts from analyses
  score += Math.min(streak * 4, 20);           // max 20 pts from streak
  score += Math.min(wardrobeCount * 3, 20);    // max 20 pts from wardrobe
  score += hasSkinTone ? 10 : 0;               // 10 pts for completing profile
  score += analysisCount >= 1 ? 10 : 0;        // 10 pts for first scan

  return Math.min(Math.round(score), 100);
}

// ── Experience Level (based on usage) ─────────────────────────
export function deriveLevel(analysisCount = 0) {
  if (analysisCount === 0) return { label: 'Getting Started', tier: 0, next: 1, nextLabel: 'Bronze', color: '#6B7280' };
  if (analysisCount < 3)   return { label: 'Bronze Stylist', tier: 1, next: 5, nextLabel: 'Silver', color: '#B87333' };
  if (analysisCount < 7)   return { label: 'Silver Curator', tier: 2, next: 10, nextLabel: 'Gold', color: '#9CA3AF' };
  if (analysisCount < 15)  return { label: 'Gold Designer', tier: 3, next: 20, nextLabel: 'Platinum', color: '#F59E0B' };
  if (analysisCount < 25)  return { label: 'Platinum Expert', tier: 4, next: 30, nextLabel: 'Elite', color: '#C084FC' };
  return { label: 'Elite Fashionista', tier: 5, next: null, nextLabel: null, color: '#EC4899' };
}

// ── Read all user data for personality ─────────────────────────
export function readUserPersonalityData() {
  try {
    const lastAnalysis = JSON.parse(localStorage.getItem('sg_last_analysis') || 'null');
    const primaryProfile = JSON.parse(localStorage.getItem('sg_primary_profile') || 'null');
    const historyRaw = localStorage.getItem('sg_analysis_history');
    const history = historyRaw ? JSON.parse(historyRaw) : [];
    const wardrobeRaw = localStorage.getItem('sg_wardrobe_queue');
    const wardrobe = wardrobeRaw ? JSON.parse(wardrobeRaw) : [];

    const activeProfile = primaryProfile || lastAnalysis;
    const analysisCount = parseInt(localStorage.getItem('sg_analysis_count') || '0');
    const streak = parseInt(localStorage.getItem('sg_streak_count') || '0');
    const gender = localStorage.getItem('sg_gender_pref') || 'male';

    const skinTone = activeProfile?.skinTone || activeProfile?.skin_tone?.category || '';
    const skinHex = activeProfile?.skinHex || activeProfile?.skin_tone?.hex || '#C68642';

    const historyTones = history
      .slice(0, 10)
      .map(h => h?.skinTone || '')
      .filter(Boolean);

    return {
      skinTone,
      skinHex,
      analysisCount,
      streak,
      gender,
      wardrobeCount: Array.isArray(wardrobe) ? wardrobe.length : 0,
      historyTones,
      hasSkinTone: !!skinTone,
      lastAnalysis,
      historyLength: history.length,
    };
  } catch {
    return {
      skinTone: '', skinHex: '#C68642', analysisCount: 0,
      streak: 0, gender: 'male', wardrobeCount: 0,
      historyTones: [], hasSkinTone: false, lastAnalysis: null,
      historyLength: 0,
    };
  }
}
