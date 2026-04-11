/**
 * ToneFit Unified Fashion Category Registry
 * Used for tagging, filtering, searching, and styling logic.
 */

export const FASHION_CATEGORIES = {
    MALE: {
        ETHNIC: [
            { id: 'cat_sherwani', label: 'Sherwani', icon: 'Formal' },
            { id: 'cat_kurta_set', label: 'Kurta Set', icon: 'Shirt' },
            { id: 'cat_nehru_jacket', label: 'Nehru Jacket', icon: 'Formal' },
            { id: 'cat_dhoti', label: 'Dhoti Kurta', icon: 'Shirt' }
        ],
        FORMAL: [
            { id: 'cat_formal_shirt', label: 'Formal Shirt', icon: 'Shirt' },
            { id: 'cat_blazer', label: 'Blazer', icon: 'Shirt' },
            { id: 'cat_tuxedo', label: 'Tuxedo', icon: 'Formal' },
            { id: 'cat_formal_trouser', label: 'Formal Trousers', icon: 'Trousers' }
        ],
        CASUAL: [
            { id: 'cat_tshirt', label: 'T-Shirt', icon: 'Shirt' },
            { id: 'cat_oversized_tee', label: 'Oversized Tee', icon: 'Shirt' },
            { id: 'cat_casual_shirt', label: 'Casual Shirt', icon: 'Shirt' },
            { id: 'cat_polo', label: 'Polo Shirt', icon: 'Shirt' },
            { id: 'cat_cargo', label: 'Cargo Pants', icon: 'Trousers' },
            { id: 'cat_jeans', label: 'Jeans', icon: 'Trousers' },
            { id: 'cat_shorts', label: 'Shorts', icon: 'Trousers' },
            { id: 'cat_hoodie', label: 'Hoodie', icon: 'Hoodie' }
        ]
    },
    FEMALE: {
        ETHNIC: [
            { id: 'cat_saree_silk', label: 'Silk Saree', icon: 'Dress' },
            { id: 'cat_saree_chiffon', label: 'Chiffon Saree', icon: 'Dress' },
            { id: 'cat_lehenga', label: 'Lehenga Choli', icon: 'Dress' },
            { id: 'cat_anarkali', label: 'Anarkali Suit', icon: 'Dress' },
            { id: 'cat_kurti', label: 'Kurti', icon: 'Dress' },
            { id: 'cat_sharara', label: 'Sharara Set', icon: 'Dress' }
        ],
        WESTERN: [
            { id: 'cat_crop_top', label: 'Crop Top', icon: 'Shirt' },
            { id: 'cat_blouse', label: 'Blouse', icon: 'Shirt' },
            { id: 'cat_corset', label: 'Corset Top', icon: 'Shirt' },
            { id: 'cat_dress_maxi', label: 'Maxi Dress', icon: 'Dress' },
            { id: 'cat_dress_mini', label: 'Mini Dress', icon: 'Dress' },
            { id: 'cat_mom_jeans', label: 'Mom Jeans', icon: 'Trousers' },
            { id: 'cat_skirt', label: 'Skirt', icon: 'Dress' },
            { id: 'cat_palazzo', label: 'Palazzo', icon: 'Trousers' }
        ]
    },
    UNISEX: [
        { id: 'cat_unisex_hoodie', label: 'Streetwear Hoodie', icon: 'Hoodie' },
        { id: 'cat_unisex_tee', label: 'Graphic Tee', icon: 'Shirt' },
        { id: 'cat_sneakers', label: 'Sneakers', icon: 'Shoes' },
        { id: 'cat_bomber', label: 'Bomber Jacket', icon: 'Hoodie' }
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
export const getCategoryIcon = (id) => ALL_CATEGORIES.find(c => c.id === id)?.icon || 'Shopping';

/**
 * Returns top-level filters for Wardrobe UX
 */
export const getFiltersByGender = (gender) => {
    if (gender === 'female') {
        return [
            { id: 'all',        label: 'All',         icon: 'Global'   },
            { id: 'ethnic',     label: 'Ethnic',      icon: 'Dress'    },
            { id: 'tops',       label: 'Tops',        icon: 'Shirt'    },
            { id: 'bottoms',    label: 'Bottoms',     icon: 'Trousers' },
            { id: 'casual',     label: 'Casual',      icon: 'Shirt'    },
            { id: 'formal',     label: 'Formal',      icon: 'Formal'   },
            { id: 'streetwear', label: 'Streetwear',  icon: 'Hoodie'   },
            { id: 'shoes',      label: 'Shoes',       icon: 'Shoes'    },
            { id: 'accessories',label: 'Accessories', icon: 'Jewelry'  },
        ];
    }
    return [
        { id: 'all',        label: 'All',         icon: 'Global'   },
        { id: 'casual',     label: 'Casual',      icon: 'Shirt'    },
        { id: 'formal',     label: 'Formal',      icon: 'Formal'   },
        { id: 'ethnic',     label: 'Ethnic',      icon: 'Shirt'    },
        { id: 'streetwear', label: 'Streetwear',  icon: 'Hoodie'   },
        { id: 'tops',       label: 'Tops',        icon: 'Shirt'    },
        { id: 'bottoms',    label: 'Bottoms',     icon: 'Trousers' },
        { id: 'shoes',      label: 'Shoes',       icon: 'Shoes'    },
        { id: 'accessories',label: 'Accessories', icon: 'Jewelry'  },
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
