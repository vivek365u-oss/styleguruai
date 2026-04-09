/**
 * ToneFit Unified AI Personal Styling Engine (AIPSE)
 * 
 * This engine calculates compatibility scores for wardrobe items based on:
 * 1. Physical Profile (Skin Tone, Body Type)
 * 2. Environmental Context (Weather, Time of Day)
 * 3. Occasion Relevance
 * 4. Behavioral Data (Freshness, Preferences)
 */

export const scoreWardrobeItem = (item, context, profile, history = [], preferences = {}, lockedInsights = null) => {
    // 0. Gender Filter (Strict Wall)
    const activeGender = lockedInsights?.gender || profile.gender || profile.gender_mode;
    if (activeGender && item.gender && item.gender !== activeGender) return 0;

    let score = 0;
    const weights = {
        color: 35,
        context: 35,
        freshness: 15,
        preference: 15
    };

    // 1. Color Harmony (Skin Tone Match)
    let colorScore = item.compatibility_score || 70; 

    // NEW: "Elite" Boost from Locked DNA
    if (lockedInsights) {
        const bestColors = [
            ...(lockedInsights.best_shirt_colors || []),
            ...(lockedInsights.best_pant_colors || []),
            ...(lockedInsights.best_dress_colors || []),
            ...(lockedInsights.best_top_colors || []),
            ...(lockedInsights.best_kurti_colors || []),
            ...(lockedInsights.seasonal_colors || [])
        ];
        
        const isEliteMatch = bestColors.some(bc => 
            item.color_name?.toLowerCase().includes(bc.name?.toLowerCase()) ||
            (item.hex && bc.hex && item.hex.toLowerCase() === bc.hex.toLowerCase())
        );

        if (isEliteMatch) colorScore = Math.min(100, colorScore + 40);
    }

    score += (colorScore / 100) * weights.color;

    // 2. Context Relevance (Weather & Event)
    let contextScore = 50;
    
    // Weather Logic
    const w = context.weather?.toLowerCase() || 'sunny';
    if (w === 'hot' || w === 'sunny') {
        if (item.fabric === 'fabric_linen' || item.fabric === 'fabric_cotton') contextScore += 25;
        if (item.fabric === 'fabric_wool' || item.fabric === 'fabric_silk') contextScore -= 30;
    } else if (w === 'cold' || w === 'rainy') {
        if (item.fabric === 'fabric_wool' || item.fabric === 'fabric_denim') contextScore += 25;
    }

    // Occasion Logic
    if (context.event) {
        const isMatch = item.tags?.includes(`tag_${context.event.toLowerCase()}`);
        if (isMatch) contextScore += 30;
    }
    
    score += (Math.min(contextScore, 100) / 100) * weights.context;

    // 3. Freshness (Repetition Control)
    let freshnessScore = 100;
    const lastWorn = history.find(h => h.itemId === item.id);
    if (lastWorn) {
        const daysSince = (new Date() - new Date(lastWorn.date)) / (1000 * 60 * 60 * 24);
        if (daysSince < 2) freshnessScore = 0; 
        else if (daysSince < 7) freshnessScore = 50;
    }
    score += (freshnessScore / 100) * weights.freshness;

    // 4. Behavioral Preference (Phase 5 Feedback Loop)
    let preferenceScore = 50;
    const safePrefs = preferences || {};
    const likes = safePrefs.feedback_likes || {};
    const rejects = safePrefs.feedback_rejects || {};

    // Check Fit/Fabric/Color likes
    if (likes.fit?.includes(item.fit)) preferenceScore += 20;
    if (likes.fabric?.includes(item.fabric)) preferenceScore += 20;
    if (likes.color?.some(c => item.color_name?.toLowerCase().includes(c.toLowerCase()))) preferenceScore += 20;

    // Check Fit/Fabric/Color rejects
    if (rejects.fit?.includes(item.fit)) preferenceScore -= 40;
    if (rejects.fabric?.includes(item.fabric)) preferenceScore -= 40;

    score += (Math.max(0, Math.min(preferenceScore, 100)) / 100) * weights.preference;

    return Math.round(score);
};

export const getTopRecommendations = (wardrobe, context, profile, history, preferences, lockedInsights) => {
    if (!wardrobe || wardrobe.length === 0) return [];
    
    return wardrobe
        .map(item => ({
            ...item,
            engineScore: scoreWardrobeItem(item, context, profile, history, preferences, lockedInsights)
        }))
        .filter(item => item.engineScore > 0) // Hide gender-mismatched items
        .sort((a, b) => b.engineScore - a.engineScore)
        .slice(0, 5);
};

/**
 * Returns accessory (shoes/jewelry) advice based on DNA, gender, and event context
 */
export const getAccessoryAdvice = (gender, season, event = 'casual') => {
    const isSpecial = event === 'PARTY' || event === 'OFFICE';
    
    if (gender === 'female') {
        return {
            jewelry: isSpecial 
                ? (season === 'Spring' || season === 'Summer' ? 'Emerald or Pearl Chokes' : 'Gold Kundan / Heavy Silks')
                : (season === 'Spring' || season === 'Summer' ? 'Rose Gold Hoops' : 'Minimal Silver Studs'),
            shoes: event === 'PARTY' ? 'Stilettos or Embellished Juttis' : 'Nude Block Heels or Mules',
            tip: isSpecial ? 'Pair with a clutch matching your shoe color.' : 'Keep it light with a cross-body bag.'
        };
    }
    return {
        jewelry: event === 'OFFICE' ? 'Silver Mechanical Watch' : 'Leather Strap Watch or Band',
        shoes: event === 'PARTY' ? 'Black Chelsea Boots' : (event === 'OFFICE' ? 'Dark Brown Oxfords' : 'White Minimal Sneakers'),
        tip: event === 'OFFICE' ? 'Your belt MUST match your shoe leather.' : 'No socks visible with sneakers for an athletic look.'
    };
};

/**
 * Maps color recommendations to specific actionable items from the registry
 */
export const getActionableAdvice = (bestColors, gender) => {
    if (!bestColors || bestColors.length === 0) return [];
    
    const suggestions = [];
    const color = bestColors[0]?.name || 'Neutral';
    
    if (gender === 'female') {
        suggestions.push({ item: `${color} Silk Saree`, category: 'cat_saree_silk' });
        suggestions.push({ item: `${color} Kurti Set`, category: 'cat_kurti' });
    } else {
        suggestions.push({ item: `${color} Formal Shirt`, category: 'cat_formal_shirt' });
        suggestions.push({ item: `${color} Kurta Set`, category: 'cat_kurta_set' });
    }
    
    return suggestions;
};

/**
 * Generates a textual "AI Brief" for a specific outfit combo
 */
export const generateStylerBrief = (top, bottom, context, profile) => {
    const season = profile?.season || 'Spring';
    const skinTone = profile?.skinTone || 'Medium';
    
    let brief = `This ${context.event} look uses the ${top.name} to create a sophisticated focal point. `;
    
    if (top.engineScore > 90) {
        brief += `The color is a 100% DNA match for your ${skinTone} skin tone. `;
    }
    
    if (context.weather === 'rainy' || context.weather === 'cloudy') {
        brief += `Since it's ${context.weather}, we chose darker tones to hide moisture and maintain sharpness. `;
    } else {
        brief += `The light interaction here will enhance your features in the ${context.weather || 'sunny'} light. `;
    }
    
    return brief;
};
