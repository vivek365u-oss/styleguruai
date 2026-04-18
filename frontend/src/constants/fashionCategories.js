/**
 * ToneFit Unified Fashion Category Registry v2
 * Market-researched categories based on Indian fashion trends 2024-25
 * Sources: Myntra, Flipkart, Meesho, trends for men/women aged 16-35
 */

// ── MALE CATEGORIES (Market Research 2024-25) ─────────────────────
// Trending: streetwear boom, oversized silhouettes, ethnic revival,
// workwear hybrid, premium T-shirts, cargo renaissance, co-ord sets

// ── FEMALE CATEGORIES (Market Research 2024-25) ───────────────────
// Trending: fusion ethnic (kurti+jeans), co-ord sets, corset tops,
// saree blouse styling, maxi dresses, palazzo revival, indo-western

export const FASHION_CATEGORIES = {
    MALE: {
        ETHNIC: [
            { id: 'cat_sherwani',     label: 'Sherwani',       icon: 'Formal', emoji: '🏅' },
            { id: 'cat_kurta_set',    label: 'Kurta Set',      icon: 'Shirt',  emoji: '👘' },
            { id: 'cat_nehru_jacket', label: 'Nehru Jacket',   icon: 'Formal', emoji: '🎩' },
            { id: 'cat_dhoti_kurta',  label: 'Dhoti Kurta',    icon: 'Shirt',  emoji: '🧵' },
            { id: 'cat_ethnic_coord', label: 'Ethnic Co-ord',  icon: 'Formal', emoji: '✨' },
        ],
        FORMAL: [
            { id: 'cat_formal_shirt', label: 'Formal Shirt',       icon: 'Shirt',    emoji: '👔' },
            { id: 'cat_blazer',       label: 'Blazer',             icon: 'Shirt',    emoji: '🧥' },
            { id: 'cat_tuxedo',       label: 'Tuxedo / Suit',      icon: 'Formal',   emoji: '🎽' },
            { id: 'cat_formal_trouser', label: 'Formal Trousers',  icon: 'Trousers', emoji: '👖' },
            { id: 'cat_waistcoat',    label: 'Waistcoat / Vest',   icon: 'Formal',   emoji: '🧣' },
        ],
        CASUAL: [
            { id: 'cat_tshirt',         label: 'T-Shirt',          icon: 'Shirt',    emoji: '👕' },
            { id: 'cat_oversized_tee',  label: 'Oversized Tee',    icon: 'Shirt',    emoji: '🌊' },
            { id: 'cat_polo',           label: 'Polo Shirt',       icon: 'Shirt',    emoji: '🎯' },
            { id: 'cat_casual_shirt',   label: 'Casual Shirt',     icon: 'Shirt',    emoji: '🌴' },
            { id: 'cat_coord_set_male', label: 'Co-ord Set',       icon: 'Shirt',    emoji: '✨' },
        ],
        BOTTOMS: [
            { id: 'cat_jeans',       label: 'Jeans',           icon: 'Trousers', emoji: '🔵' },
            { id: 'cat_cargo',       label: 'Cargo Pants',     icon: 'Trousers', emoji: '🪖' },
            { id: 'cat_chinos',      label: 'Chinos',          icon: 'Trousers', emoji: '🟤' },
            { id: 'cat_shorts',      label: 'Shorts',          icon: 'Trousers', emoji: '🩳' },
            { id: 'cat_track_pants', label: 'Track Pants',     icon: 'Trousers', emoji: '🏃' },
        ],
        OUTERWEAR: [
            { id: 'cat_hoodie',     label: 'Hoodie',        icon: 'Hoodie', emoji: '🧸' },
            { id: 'cat_jacket',     label: 'Jacket',        icon: 'Hoodie', emoji: '🧥' },
            { id: 'cat_bomber',     label: 'Bomber Jacket', icon: 'Hoodie', emoji: '✈️'  },
            { id: 'cat_sweatshirt', label: 'Sweatshirt',    icon: 'Hoodie', emoji: '🏔️' },
        ],
        FOOTWEAR: [
            { id: 'cat_sneakers',   label: 'Sneakers',       icon: 'Shoes', emoji: '👟' },
            { id: 'cat_loafers',    label: 'Loafers',        icon: 'Shoes', emoji: '🥿' },
            { id: 'cat_boots',      label: 'Boots',          icon: 'Shoes', emoji: '🥾' },
            { id: 'cat_formal_shoe',label: 'Formal Shoes',   icon: 'Shoes', emoji: '👞' },
            { id: 'cat_sports_shoe',label: 'Sports Shoes',   icon: 'Shoes', emoji: '🏃' },
        ],
        ACCESSORIES: [
            { id: 'cat_watch',     label: 'Watch',         icon: 'Jewelry', emoji: '⌚' },
            { id: 'cat_wallet',    label: 'Wallet / Belt', icon: 'Jewelry', emoji: '👜' },
            { id: 'cat_sunglasses',label: 'Sunglasses',    icon: 'Jewelry', emoji: '🕶️' },
            { id: 'cat_backpack',  label: 'Backpack / Bag',icon: 'Jewelry', emoji: '🎒' },
        ],
    },
    FEMALE: {
        ETHNIC: [
            { id: 'cat_saree_silk',    label: 'Silk Saree',      icon: 'Dress', emoji: '🌸' },
            { id: 'cat_saree_chiffon', label: 'Chiffon Saree',   icon: 'Dress', emoji: '🌊' },
            { id: 'cat_saree_cotton',  label: 'Cotton Saree',    icon: 'Dress', emoji: '🪡' },
            { id: 'cat_lehenga',       label: 'Lehenga Choli',   icon: 'Dress', emoji: '👑' },
            { id: 'cat_anarkali',      label: 'Anarkali Suit',   icon: 'Dress', emoji: '🌺' },
            { id: 'cat_kurti',         label: 'Kurti',           icon: 'Dress', emoji: '🥻' },
            { id: 'cat_kurti_set',     label: 'Kurti + Pant Set',icon: 'Dress', emoji: '✨' },
            { id: 'cat_sharara',       label: 'Sharara Set',     icon: 'Dress', emoji: '🎀' },
            { id: 'cat_palazzo_suit',  label: 'Palazzo Suit',    icon: 'Dress', emoji: '🪷' },
            { id: 'cat_dhoti_pants',   label: 'Dhoti Pants Set', icon: 'Dress', emoji: '🎋' },
        ],
        FUSION: [
            { id: 'cat_indo_western',  label: 'Indo-Western',      icon: 'Dress', emoji: '🌟' },
            { id: 'cat_coord_set_f',   label: 'Co-ord Set',        icon: 'Shirt', emoji: '💫' },
            { id: 'cat_cape_set',      label: 'Cape / Jacket Set', icon: 'Dress', emoji: '🧣' },
        ],
        TOPS: [
            { id: 'cat_crop_top',    label: 'Crop Top',       icon: 'Shirt', emoji: '👚' },
            { id: 'cat_blouse',      label: 'Blouse',         icon: 'Shirt', emoji: '🌷' },
            { id: 'cat_corset',      label: 'Corset Top',     icon: 'Shirt', emoji: '🎀' },
            { id: 'cat_puff_top',    label: 'Puff Sleeve Top',icon: 'Shirt', emoji: '🌸' },
            { id: 'cat_shirt_female',label: 'Shirt / Tunic',  icon: 'Shirt', emoji: '👕' },
            { id: 'cat_tank_top',    label: 'Tank Top / Cami',icon: 'Shirt', emoji: '🌴' },
            { id: 'cat_sweater',     label: 'Sweater / Knit', icon: 'Shirt', emoji: '🧶' },
        ],
        DRESSES: [
            { id: 'cat_dress_maxi',  label: 'Maxi Dress',    icon: 'Dress', emoji: '✨' },
            { id: 'cat_dress_mini',  label: 'Mini Dress',    icon: 'Dress', emoji: '💃' },
            { id: 'cat_dress_midi',  label: 'Midi Dress',    icon: 'Dress', emoji: '🌸' },
            { id: 'cat_bodycon',     label: 'Bodycon Dress', icon: 'Dress', emoji: '🔥' },
            { id: 'cat_shirt_dress', label: 'Shirt Dress',   icon: 'Dress', emoji: '👗' },
        ],
        BOTTOMS: [
            { id: 'cat_jeans_female',  label: 'Jeans',         icon: 'Trousers', emoji: '🔵' },
            { id: 'cat_mom_jeans',     label: 'Mom Jeans',     icon: 'Trousers', emoji: '🌊' },
            { id: 'cat_skirt',         label: 'Skirt',         icon: 'Dress',    emoji: '🌂' },
            { id: 'cat_palazzo_f',     label: 'Palazzo Pants', icon: 'Trousers', emoji: '🌬️' },
            { id: 'cat_shorts_female', label: 'Shorts',        icon: 'Trousers', emoji: '🩳' },
            { id: 'cat_track_f',       label: 'Track Pants',   icon: 'Trousers', emoji: '🏃' },
        ],
        OUTERWEAR: [
            { id: 'cat_hoodie_f',    label: 'Hoodie',           icon: 'Hoodie', emoji: '🧸' },
            { id: 'cat_blazer_f',    label: 'Blazer / Jacket',  icon: 'Hoodie', emoji: '🧥' },
            { id: 'cat_shrug',       label: 'Shrug / Cardigan', icon: 'Hoodie', emoji: '🧣' },
            { id: 'cat_sweatshirt_f',label: 'Sweatshirt',       icon: 'Hoodie', emoji: '🏔️' },
        ],
        FOOTWEAR: [
            { id: 'cat_heels',     label: 'Heels',        icon: 'Shoes', emoji: '👠' },
            { id: 'cat_flats',     label: 'Flats / Juttis',icon: 'Shoes', emoji: '🥿' },
            { id: 'cat_sneakers_f',label: 'Sneakers',     icon: 'Shoes', emoji: '👟' },
            { id: 'cat_sandals',   label: 'Sandals',      icon: 'Shoes', emoji: '👡' },
            { id: 'cat_boots_f',   label: 'Boots / Ankle',icon: 'Shoes', emoji: '🥾' },
        ],
        ACCESSORIES: [
            { id: 'cat_earrings',   label: 'Earrings',      icon: 'Jewelry', emoji: '💎' },
            { id: 'cat_necklace',   label: 'Necklace',      icon: 'Jewelry', emoji: '📿' },
            { id: 'cat_bangles',    label: 'Bangles / Kada', icon: 'Jewelry', emoji: '💍' },
            { id: 'cat_handbag',    label: 'Handbag / Clutch',icon: 'Jewelry', emoji: '👜' },
            { id: 'cat_sunglasses_f',label: 'Sunglasses',   icon: 'Jewelry', emoji: '🕶️' },
            { id: 'cat_dupatta',    label: 'Dupatta / Stole',icon: 'Jewelry', emoji: '🌸' },
        ],
    },
    UNISEX: [
        { id: 'cat_unisex_hoodie', label: 'Streetwear Hoodie', icon: 'Hoodie', emoji: '🏙️' },
        { id: 'cat_graphic_tee',   label: 'Graphic Tee',       icon: 'Shirt',  emoji: '🎨' },
        { id: 'cat_sneakers_u',    label: 'Sneakers',          icon: 'Shoes',  emoji: '👟' },
        { id: 'cat_bomber_u',      label: 'Bomber Jacket',     icon: 'Hoodie', emoji: '✈️'  },
        { id: 'cat_loungewear',    label: 'Loungewear Set',    icon: 'Shirt',  emoji: '🛋️' },
    ]
};

// ── Flat list for search/lookup ─────────────────────────────────
export const ALL_CATEGORIES = [
    ...Object.values(FASHION_CATEGORIES.MALE).flat(),
    ...Object.values(FASHION_CATEGORIES.FEMALE).flat(),
    ...FASHION_CATEGORIES.UNISEX,
];

export const getCategoryLabel = (id) => ALL_CATEGORIES.find(c => c.id === id)?.label || id.replace('cat_', '').replace(/_/g, ' ');
export const getCategoryIcon  = (id) => ALL_CATEGORIES.find(c => c.id === id)?.icon  || 'Shopping';
export const getCategoryEmoji = (id) => ALL_CATEGORIES.find(c => c.id === id)?.emoji || '👗';

// ── Wardrobe filter tabs (gender-aware human labels) ────────────
export const getFiltersByGender = (gender) => {
    if (gender === 'female') {
        return [
            { id: 'all',         label: 'All',         icon: 'Global'   },
            { id: 'ethnic',      label: 'Ethnic',      icon: 'Dress'    },
            { id: 'tops',        label: 'Tops',        icon: 'Shirt'    },
            { id: 'dresses',     label: 'Dresses',     icon: 'Dress'    },
            { id: 'bottoms',     label: 'Bottoms',     icon: 'Trousers' },
            { id: 'formal',      label: 'Formal',      icon: 'Formal'   },
            { id: 'casual',      label: 'Casual',      icon: 'Shirt'    },
            { id: 'streetwear',  label: 'Streetwear',  icon: 'Hoodie'   },
            { id: 'shoes',       label: 'Shoes',       icon: 'Shoes'    },
            { id: 'accessories', label: 'Accessories', icon: 'Jewelry'  },
        ];
    }
    return [
        { id: 'all',         label: 'All',         icon: 'Global'   },
        { id: 'casual',      label: 'Casual',      icon: 'Shirt'    },
        { id: 'formal',      label: 'Formal',      icon: 'Formal'   },
        { id: 'ethnic',      label: 'Ethnic',      icon: 'Shirt'    },
        { id: 'streetwear',  label: 'Streetwear',  icon: 'Hoodie'   },
        { id: 'bottoms',     label: 'Bottoms',     icon: 'Trousers' },
        { id: 'outerwear',   label: 'Outerwear',   icon: 'Hoodie'   },
        { id: 'shoes',       label: 'Shoes',       icon: 'Shoes'    },
        { id: 'accessories', label: 'Accessories', icon: 'Jewelry'  },
    ];
};

// ── Category picker for OutfitChecker (grouped, human-readable) ──
export const getCategoriesByGender = (gender) => {
    if (gender === 'female') {
        return [
            ...FASHION_CATEGORIES.FEMALE.ETHNIC,
            ...FASHION_CATEGORIES.FEMALE.FUSION,
            ...FASHION_CATEGORIES.FEMALE.TOPS,
            ...FASHION_CATEGORIES.FEMALE.DRESSES,
            ...FASHION_CATEGORIES.FEMALE.BOTTOMS,
            ...FASHION_CATEGORIES.FEMALE.OUTERWEAR,
            ...FASHION_CATEGORIES.FEMALE.FOOTWEAR,
            ...FASHION_CATEGORIES.FEMALE.ACCESSORIES,
        ];
    }
    return [
        ...FASHION_CATEGORIES.MALE.ETHNIC,
        ...FASHION_CATEGORIES.MALE.FORMAL,
        ...FASHION_CATEGORIES.MALE.CASUAL,
        ...FASHION_CATEGORIES.MALE.BOTTOMS,
        ...FASHION_CATEGORIES.MALE.OUTERWEAR,
        ...FASHION_CATEGORIES.MALE.FOOTWEAR,
        ...FASHION_CATEGORIES.MALE.ACCESSORIES,
    ];
};
