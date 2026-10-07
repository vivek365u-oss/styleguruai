/**
 * myntraUrl.js — Centralized Myntra deep-link generator
 * ─────────────────────────────────────────────────────────────
 * Uses Myntra's CATEGORY-PATH + rawQuery format for maximum accuracy.
 * Format: https://www.myntra.com/{category-path}?rawQuery={color}+{keyword}
 */

// ── Myntra category path map — cat_id → Myntra URL path ──────────────
const MYNTRA_PATHS = {
  // ── MALE ETHNIC ─────────────────────────────────────────────────────
  cat_sherwani: { path: 'sherwanis', kw: 'sherwani men' },
  cat_kurta_set: { path: 'kurtas', kw: 'kurta set men' },
  cat_nehru_jacket: { path: 'nehru-jackets', kw: 'nehru jacket men' },
  cat_dhoti_kurta: { path: 'kurtas', kw: 'dhoti kurta men' },
  cat_ethnic_coord: { path: 'co-ords', kw: 'ethnic coord set men' },
  cat_kurta: { path: 'men-kurtas', kw: 'kurta men' },

  // ── MALE FORMAL ─────────────────────────────────────────────────────
  cat_formal_shirt: { path: 'formal-shirts', kw: 'formal shirt men' },
  cat_tuxedo: { path: 'suits', kw: 'suit men' },
  cat_formal_trouser: { path: 'formal-trousers', kw: 'formal trouser men' },
  cat_waistcoat: { path: 'waistcoats', kw: 'waistcoat men' },

  // ── MALE CASUAL ─────────────────────────────────────────────────────
  cat_shirt: { path: 'men-casual-shirts', kw: 'casual shirt' },
  cat_tshirt: { path: 'men-t-shirts', kw: 't-shirt' },
  cat_polo: { path: 'men-t-shirts', kw: 'polo t-shirt' },
  cat_blazer: { path: 'men-blazers', kw: 'blazer men' },
  cat_coord_set_male: { path: 'co-ords', kw: 'men coord set' },

  // ── MALE BOTTOMS ────────────────────────────────────────────────────
  cat_jeans: { path: 'men-jeans', kw: 'jeans men' },
  cat_cargo: { path: 'men-cargo-pants', kw: 'cargo pants men' },
  cat_chinos: { path: 'men-chinos', kw: 'chinos men' },
  cat_shorts: { path: 'men-shorts', kw: 'shorts men' },
  cat_track_pants: { path: 'track-pants-joggers', kw: 'track pants men' },
  cat_pant: { path: 'men-trousers', kw: 'trousers men' },

  // ── MALE OUTERWEAR ──────────────────────────────────────────────────
  cat_hoodie: { path: 'men-sweatshirts', kw: 'hoodie men' },
  cat_jacket: { path: 'jackets', kw: 'jacket men' },
  cat_bomber: { path: 'bomber-jackets', kw: 'bomber jacket men' },
  cat_sweatshirt: { path: 'sweatshirts', kw: 'sweatshirt men' },

  // ── MALE FOOTWEAR ───────────────────────────────────────────────────
  cat_sneakers: { path: 'men-sneakers', kw: 'sneakers men' },
  cat_loafers: { path: 'loafers', kw: 'loafers men' },
  cat_boots: { path: 'men-boots', kw: 'boots men' },
  cat_formal_shoe: { path: 'men-formal-shoes', kw: 'formal shoes men' },
  cat_sports_shoe: { path: 'men-sports-shoes', kw: 'sports shoes men' },
  cat_shoes: { path: 'men-footwear', kw: 'shoes men' },
  cat_mojaris: { path: 'mojaris', kw: 'mojaris juttis men' },

  // ── MALE INNERWEAR & BASICS ─────────────────────────────────────────
  cat_vest: { path: 'men-innerwear', kw: 'vest ganji men' },
  cat_ganji: { path: 'men-innerwear', kw: 'ganji banyan men' },
  cat_boxers: { path: 'men-boxers', kw: 'boxers men' },
  cat_briefs: { path: 'men-innerwear', kw: 'briefs men' },
  cat_innerwear: { path: 'men-innerwear', kw: 'innerwear men' },
  cat_socks: { path: 'socks', kw: 'socks men' },

  // ── MALE ACCESSORIES & GROOMING ─────────────────────────────────────
  cat_watch: { path: 'watches', kw: 'watch men' },
  cat_wallet: { path: 'wallets', kw: 'wallet men' },
  cat_belt: { path: 'belts', kw: 'belt men' },
  cat_sunglasses: { path: 'men-sunglasses', kw: 'sunglasses men' },
  cat_backpack: { path: 'backpacks', kw: 'backpack men' },
  cat_accessory: { path: 'accessories', kw: 'men accessory' },
  cat_cologne: { path: 'perfumes', kw: 'cologne perfume men' },
  cat_perfume: { path: 'perfumes', kw: 'perfume men' },
  cat_chain: { path: 'jewellery', kw: 'chain men' },
  cat_bracelet: { path: 'jewellery', kw: 'bracelet kada men' },
  cat_ring: { path: 'jewellery', kw: 'signet ring men' },
  cat_bundi: { path: 'nehru-jackets', kw: 'nehru jacket bundi men' },
  cat_pathani: { path: 'men-kurtas', kw: 'pathani kurta men' },

  // ── FEMALE ETHNIC ───────────────────────────────────────────────────
  cat_saree_silk: { path: 'sarees', kw: 'silk saree' },
  cat_lehenga: { path: 'lehenga-cholis', kw: 'lehenga choli' },
  cat_anarkali: { path: 'anarkali-suits', kw: 'anarkali suit' },
  cat_kurti: { path: 'kurtas-kurtis', kw: 'kurti women' },
  cat_kurti_set: { path: 'kurtas-kurtis', kw: 'kurti set' },
  cat_sharara: { path: 'sharara-suits', kw: 'sharara set' },
  cat_palazzo_suit: { path: 'palazzo-suits', kw: 'palazzo suit' },
  cat_saree: { path: 'sarees', kw: 'saree' },
  cat_blouse: { path: 'blouses', kw: 'designer blouse women' },

  // ── FEMALE TOPS & CO-ORDS ───────────────────────────────────────────
  cat_crop_top: { path: 'crop-tops', kw: 'crop top women' },
  cat_croptop: { path: 'crop-tops', kw: 'crop top women' },
  cat_corset: { path: 'tops', kw: 'corset top women' },
  cat_shirt_female: { path: 'tops', kw: 'shirt women' },
  cat_satin_shirt: { path: 'tops', kw: 'satin shirt women' },
  cat_top: { path: 'tops', kw: 'top women' },
  cat_coord: { path: 'co-ords', kw: 'coord set women' },
  cat_jumpsuit: { path: 'jumpsuits', kw: 'jumpsuit women' },
  cat_sweater: { path: 'sweaters', kw: 'sweater women' },

  // ── FEMALE DRESSES ──────────────────────────────────────────────────
  cat_dress: { path: 'dresses', kw: 'dress' },
  cat_dress_maxi: { path: 'maxi-dresses', kw: 'maxi dress' },
  cat_shirt_dress: { path: 'shirt-dresses', kw: 'shirt dress' },

  // ── FEMALE BOTTOMS ──────────────────────────────────────────────────
  cat_jeans_female: { path: 'women-jeans', kw: 'jeans women' },
  cat_skirt: { path: 'skirts', kw: 'skirt women' },
  cat_palazzo_f: { path: 'palazzos', kw: 'palazzo pants' },
  cat_palazzo: { path: 'palazzos', kw: 'palazzo pants' },
  cat_bottom: { path: 'women-trousers', kw: 'women trousers' },

  // ── FEMALE INNERWEAR & SHAPEWEAR ────────────────────────────────────
  cat_shapewear: { path: 'saree-shapewear', kw: 'saree shapewear' },
  cat_bra: { path: 'bra', kw: 'bra women' },
  cat_panty: { path: 'panties', kw: 'panties women' },
  cat_camisole: { path: 'camisoles', kw: 'camisole women' },

  // ── FEMALE FOOTWEAR ─────────────────────────────────────────────────
  cat_heels: { path: 'heels', kw: 'heels women' },
  cat_flats: { path: 'flats', kw: 'flats women' },
  cat_sandals: { path: 'flats', kw: 'sandals women' },
  cat_juttis: { path: 'mojaris', kw: 'punjabi juttis women' },
  cat_sneakers_f: { path: 'women-sneakers', kw: 'sneakers women' },

  // ── FEMALE ACCESSORIES ──────────────────────────────────────────────
  cat_earrings: { path: 'earrings', kw: 'earrings' },
  cat_jhumka: { path: 'earrings', kw: 'jhumkas women' },
  cat_necklace: { path: 'necklaces', kw: 'necklace' },
  cat_choker: { path: 'necklaces', kw: 'choker necklace' },
  cat_bangles: { path: 'bangles', kw: 'bangles' },
  cat_kadas: { path: 'bangles', kw: 'kadas women' },
  cat_payal: { path: 'jewellery', kw: 'payal anklet women' },
  cat_handbag: { path: 'handbags', kw: 'handbag' },
  cat_clutch: { path: 'clutches', kw: 'clutch women' },
  cat_potli: { path: 'handbags', kw: 'potli bag women' },
  cat_tote: { path: 'handbags', kw: 'tote bag women' },
  cat_belt_f: { path: 'belts', kw: 'belt women' },
  cat_sunglasses_f: { path: 'sunglasses', kw: 'sunglasses women' },
  cat_dupatta: { path: 'stoles-dupattas', kw: 'dupatta' },

  // ── MAKEUP & FRAGRANCE (FEMALE) ─────────────────────────────────────
  cat_foundation: { path: 'foundation', kw: 'foundation' },
  cat_lipstick: { path: 'lipstick', kw: 'lipstick' },
  cat_eyeshadow: { path: 'eyeshadow', kw: 'eyeshadow palette' },
  cat_kajal: { path: 'kajal-and-kohl', kw: 'kajal kohl' },
  cat_eyeliner: { path: 'eyeliner', kw: 'eyeliner' },
  cat_blush: { path: 'blush', kw: 'blush' },
  cat_mascara: { path: 'mascara', kw: 'mascara' },
};

// ── Gender → default path when no category is known ──────────────────
const DEFAULT_PATHS = {
  male: {
    shirt: { path: 'men-casual-shirts', kw: 'shirt men' },
    pant: { path: 'men-trousers', kw: 'trousers men' },
    dress: { path: 'men-t-shirts', kw: 'tshirt men' },
    shoe: { path: 'men-sneakers', kw: 'sneakers men' },
    top: { path: 'men-t-shirts', kw: 'tshirt men' },
    accessory: { path: 'accessories', kw: 'accessory men' },
    watch: { path: 'watches', kw: 'watch men' },
  },
  female: {
    shirt: { path: 'tops', kw: 'top women' },
    pant: { path: 'women-jeans', kw: 'jeans women' },
    dress: { path: 'dresses', kw: 'dress' },
    kurti: { path: 'kurtas-kurtis', kw: 'kurti women' },
    top: { path: 'tops', kw: 'top women' },
    shoe: { path: 'heels', kw: 'heels women' },
    accessory: { path: 'accessories', kw: 'accessory women' },
  },
};

/**
 * Build a Myntra deep-link URL with correct category path.
 */
export const buildMyntraUrl = ({ color, catId, gender, itemType }) => {
  try {
    const isFemale = gender?.toLowerCase().includes('female') || gender === 'women';
    const genderKey = isFemale ? 'female' : 'male';

    // Normalize catId (remove cat_ prefix for lookup)
    const rawKey = (catId || itemType || 'shirt').toLowerCase();
    const catKey = rawKey.startsWith('cat_') ? rawKey.replace('cat_', '') : rawKey;

    // Deep Search for entry
    const catEntry = MYNTRA_PATHS[rawKey] ||
      MYNTRA_PATHS[catKey] ||
      MYNTRA_PATHS[`cat_${catKey}`] ||
      DEFAULT_PATHS[genderKey]?.[catKey] ||
      DEFAULT_PATHS[genderKey]?.[itemType] ||
      DEFAULT_PATHS[genderKey]?.shirt;

    // Crash-proof extraction
    const { path = isFemale ? 'dresses' : 'men-shirts', kw = 'clothing' } = catEntry || {};

    const colorClean = (color || '').toLowerCase().trim();
    const baseUrl = `https://www.myntra.com/${path}`;

    const rawQ = encodeURIComponent(`${colorClean} ${kw}`.trim());

    return `${baseUrl}?rawQuery=${rawQ}`;
  } catch (err) {
    console.error('[MyntraUrl] Critical Guard Triggered:', err);
    return `https://www.myntra.com/search?q=${encodeURIComponent((color || '') + ' ' + (itemType || 'clothing'))}`;
  }
};

/**
 * buildMyntraSearchUrl — Simple search fallback
 */
export function buildMyntraSearchUrl(searchTerm, gender = 'male', itemType = 'shirt') {
  const isFemale = gender === 'female' || gender === 'women';
  const genderKey = isFemale ? 'female' : 'male';
  const typeKey = itemType || 'shirt';

  const fallback = DEFAULT_PATHS[genderKey]?.[typeKey] || DEFAULT_PATHS[genderKey]?.shirt;
  const rawQ = encodeURIComponent(searchTerm).replace(/%20/g, '+');

  return `https://www.myntra.com/${fallback.path}?rawQuery=${rawQ}`;
}
