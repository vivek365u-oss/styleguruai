/**
 * ToneFit Unified AI Personal Styling Engine (AIPSE)
 */

export const scoreWardrobeItem = (item, context, profile, history = [], preferences = {}, lockedInsights = null) => {
    // 0. Gender Filter (Strict Wall)
    const activeGender = lockedInsights?.gender || profile.gender || profile.gender_mode || 'male';
    
    if (activeGender && item.gender && item.gender !== activeGender) return 0;
    
    const femaleOnly = ['saree', 'kurti', 'lehenga', 'maxi', 'dress', 'cat_saree_silk', 'cat_kurti', 'cat_makeup'];
    const maleOnly = ['sherwani', 'cat_formal_shirt', 'tuxedo', 'cat_kurta_set'];
    
    if (activeGender === 'male' && femaleOnly.some(cat => item.category?.toLowerCase().includes(cat))) return 0;
    if (activeGender === 'female' && maleOnly.some(cat => item.category?.toLowerCase().includes(cat))) return 0;

    let score = 0;
    const weights = { color: 35, context: 35, freshness: 15, preference: 15 };

    let colorScore = item.compatibility_score || 70; 

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

    let contextScore = 50;
    const w = context.weather?.toLowerCase() || 'sunny';
    if (w === 'hot' || w === 'sunny') {
        if (item.fabric === 'fabric_linen' || item.fabric === 'fabric_cotton') contextScore += 25;
    } else if (w === 'cold' || w === 'rainy') {
        if (item.fabric === 'fabric_wool' || item.fabric === 'fabric_denim') contextScore += 25;
    }

    if (context.event) {
        if (item.tags?.includes(`tag_${context.event.toLowerCase()}`)) contextScore += 30;
    }
    
    score += (Math.min(contextScore, 100) / 100) * weights.context;

    let freshnessScore = 100;
    const lastWorn = history.find(h => h.itemId === item.id);
    if (lastWorn) {
        const daysSince = (new Date() - new Date(lastWorn.date)) / (1000 * 60 * 60 * 24);
        if (daysSince < 2) freshnessScore = 0; 
        else if (daysSince < 7) freshnessScore = 50;
    }
    score += (freshnessScore / 100) * weights.freshness;

    let preferenceScore = 50;
    const safePrefs = preferences || {};
    const likes = safePrefs.feedback_likes || {};
    const rejects = safePrefs.feedback_rejects || {};

    if (likes.fit?.includes(item.fit)) preferenceScore += 20;
    if (likes.color?.some(c => item.color_name?.toLowerCase().includes(c.toLowerCase()))) preferenceScore += 20;

    if (rejects.fit?.includes(item.fit)) preferenceScore -= 40;

    score += (Math.max(0, Math.min(preferenceScore, 100)) / 100) * weights.preference;

    const pBuild = safePrefs.build || 'athletic';
    const pArchetype = safePrefs.styleGoal || 'sophisticated';
    let physicalBoost = 0;

    if (pBuild === 'slim' && item.fit === 'slim') physicalBoost += 10;
    if (pArchetype === 'minimalist') {
        const minCats = ['cat_polo', 'cat_blazer', 'cat_white_shirt', 'cat_minimal_sneakers'];
        if (minCats.some(c => item.category === c)) physicalBoost += 15;
    }

    return Math.min(100, Math.round(score + physicalBoost));
};

export const getAccessoryAdvice = (gender, season, event = 'casual') => {
    const isSpecial = event === 'PARTY' || event === 'OFFICE';
    const activeGender = gender?.toLowerCase().includes('female') ? 'female' : 'male';
    
    if (activeGender === 'female') {
        return {
            label: 'Jewelry Advice',
            jewelry: isSpecial 
                ? (season === 'Spring' || season === 'Summer' ? 'Emerald or Pearl Choker' : 'Gold Kundan / Heavy Silks')
                : (season === 'Spring' || season === 'Summer' ? 'Rose Gold Hoops' : 'Minimal Silver Studs'),
            shoes: event === 'PARTY' ? 'Stilettos or Embellished Juttis' : 'Nude Block Heels or Mules',
            tip: isSpecial ? 'Pair with a clutch matching your shoe color.' : 'Keep it light with a cross-body bag.'
        };
    }
    return {
        label: 'Watch & Leather Advice',
        jewelry: event === 'OFFICE' ? 'Silver Mechanical Watch' : 'Leather Strap Watch or Band',
        shoes: event === 'PARTY' ? 'Black Chelsea Boots' : (event === 'OFFICE' ? 'Dark Brown Oxfords' : 'White Minimal Sneakers'),
        tip: event === 'OFFICE' ? 'Your belt MUST match your shoe leather.' : 'No socks visible with sneakers for an athletic look.'
    };
};

export const getActionableAdvice = (bestColors, gender, skinTone = 'medium') => {
    const activeGender = gender?.toLowerCase().includes('female') ? 'female' : 'male';
    const getDynamicFallbacks = (tone = 'medium') => {
        const t = tone.toLowerCase();
        if (t === 'fair' || t === 'light') return [{ name: 'Navy Blue', hex: '#000080' }, { name: 'Burgundy', hex: '#800020' }, { name: 'Forest Green', hex: '#228B22' }, { name: 'Dusty Rose', hex: '#C4767A' }];
        if (t === 'dark' || t === 'brown') return [{ name: 'Bright White', hex: '#FFFFFF' }, { name: 'Electric Blue', hex: '#0047AB' }, { name: 'Mustard Yellow', hex: '#FFDB58' }, { name: 'Hot Pink', hex: '#FF69B4' }];
        if (t === 'olive') return [{ name: 'Emerald', hex: '#50C878' }, { name: 'Rust', hex: '#B7410E' }, { name: 'Ivory', hex: '#FFFFF0' }, { name: 'Wine', hex: '#722F37' }];
        return [{ name: 'Royal Blue', hex: '#4169E1' }, { name: 'Charcoal Grey', hex: '#36454F' }, { name: 'Wine Red', hex: '#722F37' }, { name: 'Burnt Orange', hex: '#CC5500' }];
    };

    const colorsToUse = (bestColors && bestColors.length > 0) ? bestColors : getDynamicFallbacks(skinTone);
    const normalizedColors = colorsToUse.map(c => typeof c === 'string' ? { name: c } : c);
    
    const suggestions = [];
    normalizedColors.slice(0, 4).forEach((colorObj, idx) => {
        const color = colorObj.name;
        if (activeGender === 'female') {
            if (idx === 0) suggestions.push({ item: `${color} Festive Silk Saree`, category: 'cat_saree_silk', color: color, hex: colorObj.hex });
            if (idx === 1) suggestions.push({ item: `${color} Designer Kurti Set`, category: 'cat_kurti', color: color, hex: colorObj.hex });
            if (idx === 2) suggestions.push({ item: `${color} Elegant Maxi Dress`, category: 'cat_dress', color: color, hex: colorObj.hex });
            if (idx === 3) suggestions.push({ item: `${color} Stylish Peplum Top`, category: 'cat_top', color: color, hex: colorObj.hex });
        } else {
            if (idx === 0) suggestions.push({ item: `${color} Slim Fit Formal Shirt`, category: 'cat_formal_shirt', color: color, hex: colorObj.hex });
            if (idx === 1) suggestions.push({ item: `${color} Traditional Kurta Set`, category: 'cat_kurta_set', color: color, hex: colorObj.hex });
            if (idx === 2) suggestions.push({ item: `${color} Premium Casual Polo`, category: 'cat_polo', color: color, hex: colorObj.hex });
            if (idx === 3) suggestions.push({ item: `${color} Modern Linen Blazer`, category: 'cat_blazer', color: color, hex: colorObj.hex });
        }
    });
    return suggestions;
};

/**
 * DNA COLOR GAP ANALYSIS
 * Compares recommended colors with wardrobe to find missing essentials
 */
export const calculateColorGaps = (wardrobe, bestColors, gender, skinTone) => {
    const advisory = getActionableAdvice(bestColors, gender, skinTone);
    return advisory.map(adv => {
        const colorName = (adv.color || adv.item.split(' ')[0]).toLowerCase();
        const hex = adv.hex?.toLowerCase();
        
        const inCloset = wardrobe.some(item => {
            const itemColors = item.outfit_data?.colors || [];
            return itemColors.some(c => c.name.toLowerCase().includes(colorName)) || 
                   (item.color_name && item.color_name.toLowerCase().includes(colorName)) ||
                   (item.hex && hex && item.hex.toLowerCase() === hex);
        });

        return { ...adv, inCloset, synergy: 15 + (Math.random() * 10) };
    });
};

export const generateStylerBrief = (top, bottom, context, profile) => {
    const skinTone = profile?.skinTone || 'Medium';
    let brief = `This ${context.event} look uses the ${top.name} to create a sophisticated focal point. `;
    if (top.engineScore > 85) brief += `The color is a high DNA match for your ${skinTone} skin tone. `;
    brief += `The light interaction here will enhance your features in the ${context.weather || 'sunny'} light. `;
    return brief;
};
