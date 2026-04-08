/**
 * ToneFit Unified Fashion Category Registry
 * Used for tagging, filtering, searching, and styling logic.
 */

export const FASHION_CATEGORIES = {
    MALE: {
        ETHNIC: [
            { id: 'cat_sherwani', label: 'Sherwani', icon: '🤴' },
            { id: 'cat_kurta_set', label: 'Kurta Set', icon: '🧥' },
            { id: 'cat_nehru_jacket', label: 'Nehru Jacket', icon: '🦺' },
            { id: 'cat_dhoti', label: 'Dhoti Kurta', icon: '👔' }
        ],
        FORMAL: [
            { id: 'cat_formal_shirt', label: 'Formal Shirt', icon: '👔' },
            { id: 'cat_blazer', label: 'Blazer', icon: '🧥' },
            { id: 'cat_tuxedo', label: 'Tuxedo', icon: '🤵' },
            { id: 'cat_formal_trouser', label: 'Formal Trousers', icon: '👖' }
        ],
        CASUAL: [
            { id: 'cat_tshirt', label: 'T-Shirt', icon: '👕' },
            { id: 'cat_oversized_tee', label: 'Oversized Tee', icon: '👕' },
            { id: 'cat_casual_shirt', label: 'Casual Shirt', icon: '👔' },
            { id: 'cat_polo', label: 'Polo Shirt', icon: '👕' },
            { id: 'cat_cargo', label: 'Cargo Pants', icon: '👖' },
            { id: 'cat_jeans', label: 'Jeans', icon: '👖' },
            { id: 'cat_shorts', label: 'Shorts', icon: '🩳' },
            { id: 'cat_hoodie', label: 'Hoodie', icon: '🧥' }
        ]
    },
    FEMALE: {
        ETHNIC: [
            { id: 'cat_saree_silk', label: 'Silk Saree', icon: '👗' },
            { id: 'cat_saree_chiffon', label: 'Chiffon Saree', icon: '👗' },
            { id: 'cat_lehenga', label: 'Lehenga Choli', icon: '👗' },
            { id: 'cat_anarkali', label: 'Anarkali Suit', icon: '👗' },
            { id: 'cat_kurti', label: 'Kurti', icon: '👘' },
            { id: 'cat_sharara', label: 'Sharara Set', icon: '👗' }
        ],
        WESTERN: [
            { id: 'cat_crop_top', label: 'Crop Top', icon: '👚' },
            { id: 'cat_blouse', label: 'Blouse', icon: '👚' },
            { id: 'cat_corset', label: 'Corset Top', icon: '👚' },
            { id: 'cat_dress_maxi', label: 'Maxi Dress', icon: '👗' },
            { id: 'cat_dress_mini', label: 'Mini Dress', icon: '👗' },
            { id: 'cat_mom_jeans', label: 'Mom Jeans', icon: '👖' },
            { id: 'cat_skirt', label: 'Skirt', icon: '👗' },
            { id: 'cat_palazzo', label: 'Palazzo', icon: '👖' }
        ]
    },
    UNISEX: [
        { id: 'cat_unisex_hoodie', label: 'Streetwear Hoodie', icon: '🧥' },
        { id: 'cat_unisex_tee', label: 'Graphic Tee', icon: '👕' },
        { id: 'cat_sneakers', label: 'Sneakers', icon: '👟' },
        { id: 'cat_bomber', label: 'Bomber Jacket', icon: '🧥' }
    ]
};

// Helper: Get flat list of all categories for easy searching
export const ALL_CATEGORIES = [
    ...FASHION_CATEGORIES.MALE.ETHNIC,
    ...FASHION_CATEGORIES.MALE.FORMAL,
    ...FASHION_CATEGORIES.MALE.CASUAL,
    ...FASHION_CATEGORIES.FEMALE.ETHNIC,
    ...FASHION_CATEGORIES.FEMALE.WESTERN,
    ...FASHION_CATEGORIES.UNISEX
];

export const getCategoryLabel = (id) => ALL_CATEGORIES.find(c => c.id === id)?.label || 'Other';
export const getCategoryIcon = (id) => ALL_CATEGORIES.find(c => c.id === id)?.icon || '🛍️';

/**
 * Returns top-level filters for Wardrobe UX
 */
export const getFiltersByGender = (gender) => {
    if (gender === 'female') {
        return [
            { id: 'all', label: 'All', icon: '🌈' },
            { id: 'ethnic', label: 'Ethnic', icon: '🥻' },
            { id: 'western', label: 'Western', icon: '👗' },
            { id: 'tops', label: 'Tops', icon: '👚' },
            { id: 'bottoms', label: 'Bottoms', icon: '👖' },
            { id: 'jewelry', label: 'Jewelry', icon: '✨' }
        ];
    }
    return [
        { id: 'all', label: 'All', icon: '🌈' },
        { id: 'formal', label: 'Formal', icon: '👔' },
        { id: 'ethnic', label: 'Ethnic', icon: '🤴' },
        { id: 'casual', label: 'Casual', icon: '👕' },
        { id: 'shoes', label: 'Shoes', icon: '👟' }
    ];
};

/**
 * Returns all sub-categories for a specific gender for the Sync Picker
 */
export const getCategoriesByGender = (gender) => {
    if (gender === 'female') {
        return [
            ...FASHION_CATEGORIES.FEMALE.ETHNIC,
            ...FASHION_CATEGORIES.FEMALE.WESTERN
        ];
    }
    return [
        ...FASHION_CATEGORIES.MALE.ETHNIC,
        ...FASHION_CATEGORIES.MALE.FORMAL,
        ...FASHION_CATEGORIES.MALE.CASUAL
    ];
};
