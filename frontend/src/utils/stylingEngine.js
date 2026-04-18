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
    // Priority: Locked DNA > Profile Mode > Item Gender
    const activeGender = lockedInsights?.gender || profile.gender || profile.gender_mode;
    
    // If the item has a gender tag and it doesn't match the active user gender, reject immediately
    if (activeGender && item.gender && item.gender !== activeGender) return 0;
    
    // ── CATEGORICAL GENDER WALL ──────────────────────────────────────────────
    // Built dynamically from FASHION_CATEGORIES — same source of truth as fashionCategories.js
    // Female-exclusive IDs (ALL female category ids from FASHION_CATEGORIES.FEMALE)
    const FEMALE_IDS = new Set([
        // ETHNIC
        'cat_saree_silk','cat_saree_chiffon','cat_saree_cotton','cat_lehenga','cat_anarkali',
        'cat_kurti','cat_kurti_set','cat_sharara','cat_palazzo_suit','cat_dhoti_pants',
        // FUSION
        'cat_indo_western','cat_coord_set_f','cat_cape_set',
        // TOPS
        'cat_crop_top','cat_blouse','cat_corset','cat_puff_top','cat_shirt_female',
        'cat_tank_top','cat_sweater',
        // DRESSES
        'cat_dress_maxi','cat_dress_mini','cat_dress_midi','cat_bodycon','cat_shirt_dress',
        // BOTTOMS
        'cat_jeans_female','cat_mom_jeans','cat_skirt','cat_palazzo_f','cat_shorts_female','cat_track_f',
        // OUTERWEAR
        'cat_hoodie_f','cat_blazer_f','cat_shrug','cat_sweatshirt_f',
        // FOOTWEAR
        'cat_heels','cat_flats','cat_sneakers_f','cat_sandals','cat_boots_f',
        // ACCESSORIES
        'cat_earrings','cat_necklace','cat_bangles','cat_handbag','cat_sunglasses_f','cat_dupatta',
    ]);

    // Male-exclusive IDs (ALL male category ids from FASHION_CATEGORIES.MALE)
    const MALE_IDS = new Set([
        // ETHNIC
        'cat_sherwani','cat_kurta_set','cat_nehru_jacket','cat_dhoti_kurta','cat_ethnic_coord',
        // FORMAL
        'cat_formal_shirt','cat_blazer','cat_tuxedo','cat_formal_trouser','cat_waistcoat',
        // CASUAL
        'cat_tshirt','cat_oversized_tee','cat_polo','cat_casual_shirt','cat_coord_set_male',
        // BOTTOMS
        'cat_jeans','cat_cargo','cat_chinos','cat_shorts','cat_track_pants',
        // OUTERWEAR
        'cat_hoodie','cat_jacket','cat_bomber','cat_sweatshirt',
        // FOOTWEAR
        'cat_sneakers','cat_loafers','cat_boots','cat_formal_shoe','cat_sports_shoe',
        // ACCESSORIES
        'cat_watch','cat_wallet','cat_sunglasses','cat_backpack',
    ]);

    // Apply strict gender wall using the comprehensive ID sets
    if (activeGender === 'male'   && FEMALE_IDS.has(item.category)) return 0;
    if (activeGender === 'female' && MALE_IDS.has(item.category))   return 0;

    // Fallback keyword-based check for legacy/custom categories not in the above sets
    const femaleKeywords = ['saree','kurti','lehenga','maxi_dress','bodycon','blouse','dupatta','heels',
                            'cat_crop','cat_dress','cat_skirt','cat_palazzo_f','cat_shrug'];
    const maleKeywords   = ['sherwani','kurta_set','formal_shirt','tuxedo','cat_cargo',
                            'cat_polo','cat_coord_set_male'];
    if (activeGender === 'male'   && femaleKeywords.some(k => item.category?.toLowerCase().includes(k))) return 0;
    if (activeGender === 'female' && maleKeywords.some(k => item.category?.toLowerCase().includes(k)))   return 0;


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

    // 5. PHYSICAL ENGINE (WORKING STATS)
    const pHeight = safePrefs.height || 'regular';
    const pBuild = safePrefs.build || 'athletic';
    const pArchetype = safePrefs.styleGoal || 'sophisticated';
    
    let physicalBoost = 0;

    // Build/Fit Synergy
    if (pBuild === 'slim' && item.fit === 'slim') physicalBoost += 10;
    if (pBuild === 'broad' && (item.fit === 'relaxed' || item.fit === 'regular')) physicalBoost += 10;

    // Archetype Alignment
    if (pArchetype === 'minimalist') {
        const minCats = ['cat_polo', 'cat_blazer', 'cat_white_shirt', 'cat_minimal_sneakers'];
        if (minCats.some(c => item.category === c)) physicalBoost += 15;
    } else if (pArchetype === 'vibrant') {
        const isVibrant = (item.name?.toLowerCase().includes('bright') || item.color_name?.toLowerCase().includes('neon'));
        if (isVibrant) physicalBoost += 20;
    } else if (pArchetype === 'edgy') {
        const edgyCats = ['cat_leather', 'cat_distressed', 'cat_black_denim', 'cat_boots'];
        if (edgyCats.some(c => item.category?.includes(c))) physicalBoost += 15;
    }

    // Apply Physical Engine Multiplier (Cap at 100)
    return Math.min(100, Math.round(score + physicalBoost));
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
 * Returns accessory (shoes/watches/jewelry) advice based on DNA, gender, and event context
 */
export const getAccessoryAdvice = (gender, season, event = 'casual') => {
    const isSpecial = event === 'PARTY' || event === 'OFFICE';
    
    if (gender === 'female') {
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

/**
 * Maps color recommendations to specific actionable items from the registry
 */
export const getActionableAdvice = (insights, gender, skinTone = 'medium') => {
    // Dynamic Fallbacks for Different Skin Types (Fair, Light, Medium, Olive, Brown, Dark)
    const getDynamicFallbacks = (tone = 'medium') => {
        const t = tone.toLowerCase();
        if (t === 'fair' || t === 'light') return [{ name: 'Navy Blue', hex: '#000080' }, { name: 'Burgundy', hex: '#800020' }, { name: 'Forest Green', hex: '#228B22' }, { name: 'Dusty Rose', hex: '#C4767A' }];
        if (t === 'dark' || t === 'brown') return [{ name: 'Bright White', hex: '#FFFFFF' }, { name: 'Electric Blue', hex: '#0047AB' }, { name: 'Mustard Yellow', hex: '#FFDB58' }, { name: 'Hot Pink', hex: '#FF69B4' }];
        if (t === 'olive') return [{ name: 'Emerald', hex: '#50C878' }, { name: 'Rust', hex: '#B7410E' }, { name: 'Ivory', hex: '#FFFFF0' }, { name: 'Wine', hex: '#722F37' }];
        return [{ name: 'Royal Blue', hex: '#4169E1' }, { name: 'Charcoal Grey', hex: '#36454F' }, { name: 'Wine Red', hex: '#722F37' }, { name: 'Burnt Orange', hex: '#CC5500' }];
    };

    const suggestions = [];

    // Check if `insights` is an array (legacy flat structure) or an object (new categorized structure)
    const isCategorized = insights && !Array.isArray(insights) && typeof insights === 'object' && Object.keys(insights).some(k => k.includes('best_'));

    if (gender === 'female') {
        if (isCategorized) {
            const kurtis = insights.best_kurti_colors || [];
            if (kurtis[0]) suggestions.push({ item: `${kurtis[0].name} Designer Kurti Set`, category: 'cat_kurti', hex: kurtis[0].hex, search: `women ${kurtis[0].name} fusion kurti set ethnic India` });
            
            const sarees = insights.best_saree_colors || insights.best_lehenga_colors || [];
            if (sarees[0]) suggestions.push({ item: `${sarees[0].name} Pre-Draped Saree`, category: 'cat_saree_silk', hex: sarees[0].hex, search: `women ${sarees[0].name} pre draped saree ethnic India` });
            if (sarees[1]) suggestions.push({ item: `${sarees[1].name} Festive Lehenga`, category: 'cat_lehenga', hex: sarees[1].hex, search: `women ${sarees[1].name} festive lehenga` });

            const tops = insights.best_top_colors || insights.best_dress_colors || [];
            if (tops[0]) suggestions.push({ item: `${tops[0].name} Satin Button-Down`, category: 'cat_top', hex: tops[0].hex, search: `women ${tops[0].name} satin button down shirt formal` });
            if (tops[1]) suggestions.push({ item: `${tops[1].name} Oversized Top`, category: 'cat_tshirt', hex: tops[1].hex, search: `women ${tops[1].name} oversized top streetwear India` });

            const blazers = insights.best_female_blazer_colors || [];
            if (blazers[0]) suggestions.push({ item: `${blazers[0].name} Oversized Power Blazer`, category: 'cat_outerwear', hex: blazers[0].hex, search: `women ${blazers[0].name} oversized power blazer formal` });

            const bottoms = insights.best_bottom_colors || [];
            if (bottoms[0]) suggestions.push({ item: `${bottoms[0].name} Cargo Pants`, category: 'cat_bottom', hex: bottoms[0].hex, search: `women ${bottoms[0].name} cargo pants streetwear` });
            if (bottoms[1]) suggestions.push({ item: `${bottoms[1].name} Wide Leg Trousers`, category: 'cat_bottom', hex: bottoms[1].hex, search: `women ${bottoms[1].name} wide leg trousers formal` });
        } else {
            const colors = (Array.isArray(insights) && insights.length) ? insights : getDynamicFallbacks(skinTone);
            const norms = colors.slice(0, 4).map(c => typeof c === 'string' ? {name: c, hex: '#888'} : c);
            if (norms[0]) suggestions.push({ item: `${norms[0].name} Festive Silk Saree`, category: 'cat_saree', hex: norms[0].hex, search: `women ${norms[0].name} festive silk saree` });
            if (norms[1]) suggestions.push({ item: `${norms[1].name} Designer Kurti Set`, category: 'cat_kurti', hex: norms[1].hex, search: `women ${norms[1].name} designer kurti` });
            if (norms[2]) suggestions.push({ item: `${norms[2].name} Elegant Maxi Dress`, category: 'cat_dress', hex: norms[2].hex, search: `women ${norms[2].name} elegant maxi dress` });
            if (norms[3]) suggestions.push({ item: `${norms[3].name} Satin Button-Down`, category: 'cat_top', hex: norms[3].hex, search: `women ${norms[3].name} satin button down` });
        }
    } else {
        if (isCategorized) {
            const tshirts = insights.best_tshirt_colors || [];
            if (tshirts[0]) suggestions.push({ item: `${tshirts[0].name} Oversized Graphic Tee`, category: 'cat_tshirt', hex: tshirts[0].hex, search: `men ${tshirts[0].name} oversized graphic t-shirt streetwear India 2025` });
            if (tshirts[1]) suggestions.push({ item: `${tshirts[1].name} Textured Knit Polo`, category: 'cat_polo', hex: tshirts[1].hex, search: `men ${tshirts[1].name} textured knit polo` });

            const shirts = insights.best_shirt_colors || [];
            if (shirts[0]) suggestions.push({ item: `${shirts[0].name} Slim Fit Formal Shirt`, category: 'cat_formal_shirt', hex: shirts[0].hex, search: `men ${shirts[0].name} slim fit formal shirt` });
            
            const kurtas = insights.best_kurta_colors || [];
            if (kurtas[0]) suggestions.push({ item: `${kurtas[0].name} Silk Blend Kurta`, category: 'cat_kurta', hex: kurtas[0].hex, search: `men ${kurtas[0].name} silk blend kurta ethnic` });

            const blazers = insights.best_blazer_colors || [];
            if (blazers[0]) suggestions.push({ item: `${blazers[0].name} Unstructured Blazer`, category: 'cat_blazer', hex: blazers[0].hex, search: `men ${blazers[0].name} unstructured blazer formal casual` });

            const hoodies = insights.best_hoodie_colors || [];
            if (hoodies[0]) suggestions.push({ item: `${hoodies[0].name} Premium Hoodie`, category: 'cat_outerwear', hex: hoodies[0].hex, search: `men ${hoodies[0].name} premium hoodie streetwear` });

            const bottoms = insights.best_pant_colors || [];
            if (bottoms[0]) suggestions.push({ item: `${bottoms[0].name} Tailored Trousers`, category: 'cat_bottom', hex: bottoms[0].hex, search: `men ${bottoms[0].name} tailored formal trousers` });
            if (bottoms[1]) suggestions.push({ item: `${bottoms[1].name} Parachute Pants`, category: 'cat_bottom', hex: bottoms[1].hex, search: `men ${bottoms[1].name} parachute pants streetwear` });
        } else {
            const colors = (Array.isArray(insights) && insights.length) ? insights : getDynamicFallbacks(skinTone);
            const norms = colors.slice(0, 4).map(c => typeof c === 'string' ? {name: c, hex: '#888'} : c);
            if (norms[0]) suggestions.push({ item: `${norms[0].name} Slim Fit Formal Shirt`, category: 'cat_formal_shirt', hex: norms[0].hex, search: `men ${norms[0].name} slim fit formal shirt` });
            if (norms[1]) suggestions.push({ item: `${norms[1].name} Traditional Kurta Set`, category: 'cat_kurta_set', hex: norms[1].hex, search: `men ${norms[1].name} traditional kurta` });
            if (norms[2]) suggestions.push({ item: `${norms[2].name} Textured Knit Polo`, category: 'cat_polo', hex: norms[2].hex, search: `men ${norms[2].name} textured knit polo` });
            if (norms[3]) suggestions.push({ item: `${norms[3].name} Modern Linen Blazer`, category: 'cat_blazer', hex: norms[3].hex, search: `men ${norms[3].name} modern linen blazer` });
        }
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
