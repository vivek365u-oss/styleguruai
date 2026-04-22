/**
 * myntraUrl.js — Centralized Myntra deep-link generator
 * ─────────────────────────────────────────────────────────────
 * Uses Myntra's CATEGORY-PATH + rawQuery format for maximum accuracy.
 * Format: https://www.myntra.com/{category-path}?rawQuery={color}+{keyword}
 */

// ── Myntra category path map — cat_id → Myntra URL path ──────────────
const MYNTRA_PATHS = {
  // ── MALE ETHNIC ─────────────────────────────────────────────────────
  cat_sherwani:       { path: 'men-sherwanis',          kw: 'sherwani men' },
  cat_kurta_set:      { path: 'men-kurta-sets',         kw: 'kurta set men' },
  cat_nehru_jacket:   { path: 'men-nehru-jackets',      kw: 'nehru jacket men' },
  cat_dhoti_kurta:    { path: 'men-kurta-sets',         kw: 'dhoti kurta men' },
  cat_ethnic_coord:   { path: 'men-co-ords',            kw: 'ethnic coord set men' },

  // ── MALE FORMAL ─────────────────────────────────────────────────────
  cat_formal_shirt:   { path: 'men-formal-shirts',      kw: 'formal shirt men' },
  cat_tuxedo:         { path: 'men-suits',              kw: 'suit men' },
  cat_formal_trouser: { path: 'men-formal-trousers',    kw: 'formal trouser men' },
  cat_waistcoat:      { path: 'men-waistcoats',         kw: 'waistcoat men' },

  // ── MALE CASUAL ─────────────────────────────────────────────────────
  cat_shirt:          { path: 'men-casual-shirts',      kw: 'premium casual shirt men' },
  cat_tshirt:         { path: 'men-t-shirts',           kw: 'oversized drop shoulder t-shirt' },
  cat_polo:           { path: 'men-t-shirts',           kw: 'premium polo shirt' },
  cat_blazer:         { path: 'men-blazers',            kw: 'slim fit blazer men' },
  cat_coord_set_male: { path: 'co-ords',                kw: 'men coord set' },

  // ── MALE BOTTOMS ────────────────────────────────────────────────────
  cat_jeans:          { path: 'men-jeans',              kw: 'relaxed fit jeans men' },
  cat_cargo:          { path: 'men-cargo-pants',        kw: 'premium cargo pants men' },
  cat_chinos:         { path: 'men-chinos',             kw: 'slim fit chinos men' },
  cat_shorts:         { path: 'men-shorts',             kw: 'men shorts' },
  cat_track_pants:    { path: 'men-track-pants',        kw: 'men track pants' },
  cat_pant:           { path: 'men-trousers',           kw: 'men trousers' },

  // ── MALE OUTERWEAR ──────────────────────────────────────────────────
  cat_hoodie:         { path: 'men-sweatshirts',        kw: 'hoodie men' },
  cat_jacket:         { path: 'men-jackets',            kw: 'men jacket' },
  cat_bomber:         { path: 'men-jackets',            kw: 'men bomber jacket' },
  cat_sweatshirt:     { path: 'men-sweatshirts',        kw: 'men sweatshirt' },

  // ── MALE FOOTWEAR ───────────────────────────────────────────────────
  cat_sneakers:       { path: 'men-sneakers',           kw: 'men sneakers' },
  cat_loafers:        { path: 'loafers',                kw: 'men loafers' },
  cat_boots:          { path: 'men-boots',              kw: 'men boots' },
  cat_formal_shoe:    { path: 'men-formal-shoes',       kw: 'men formal shoes' },
  cat_sports_shoe:    { path: 'men-sports-shoes',       kw: 'men sports shoes' },
  cat_shoes:          { path: 'men-footwear',           kw: 'men shoes' },

  // ── MALE ACCESSORIES ────────────────────────────────────────────────
  cat_watch:          { path: 'men-watches',            kw: 'analog watch men' },
  cat_wallet:         { path: 'men-wallets',            kw: 'leather wallet men' },
  cat_belt:           { path: 'men-belts',              kw: 'leather belt men' },
  cat_sunglasses:     { path: 'men-sunglasses',         kw: 'sunglasses men' },
  cat_backpack:       { path: 'men-backpacks',          kw: 'laptop backpack men' },
  cat_accessory:      { path: 'men-accessories',         kw: 'men accessory' },

  // ── FEMALE ETHNIC ───────────────────────────────────────────────────
  cat_saree_silk:     { path: 'sarees',                 kw: 'silk saree' },
  cat_lehenga:        { path: 'lehenga-cholis',         kw: 'lehenga choli' },
  cat_anarkali:       { path: 'anarkali-suits',         kw: 'anarkali suit' },
  cat_kurti:          { path: 'kurtas-kurtis',          kw: 'kurti women' },
  cat_kurti_set:      { path: 'kurtas-kurtis',          kw: 'kurti set' },
  cat_sharara:        { path: 'sharara-suits',          kw: 'sharara set' },
  cat_palazzo_suit:   { path: 'palazzo-suits',          kw: 'palazzo suit' },
  cat_saree:          { path: 'sarees',                 kw: 'saree women' },

  // ── FEMALE TOPS ─────────────────────────────────────────────────────
  cat_crop_top:       { path: 'crop-tops',              kw: 'crop top women' },
  cat_blouse:         { path: 'blouses',                kw: 'blouse women' },
  cat_shirt_female:   { path: 'tops',                   kw: 'shirt women' },
  cat_top:            { path: 'tops',                   kw: 'women top' },
  cat_sweater:        { path: 'sweaters',               kw: 'sweater women' },

  // ── FEMALE DRESSES ──────────────────────────────────────────────────
  cat_dress:          { path: 'women-dresses',          kw: 'dress women' },
  cat_dress_maxi:     { path: 'women-maxi-dresses',     kw: 'maxi dress' },
  cat_shirt_dress:    { path: 'women-dresses',          kw: 'shirt dress' },

  // ── FEMALE BOTTOMS ──────────────────────────────────────────────────
  cat_jeans_female:   { path: 'women-jeans',            kw: 'women jeans' },
  cat_skirt:          { path: 'skirts',                 kw: 'skirt women' },
  cat_palazzo_f:      { path: 'palazzos',               kw: 'palazzo pants' },
  cat_bottom:         { path: 'palazzos',               kw: 'women bottom' },

  // ── FEMALE FOOTWEAR ─────────────────────────────────────────────────
  cat_heels:          { path: 'heels',                  kw: 'heels women' },
  cat_flats:          { path: 'flats',                  kw: 'flats women' },
  cat_sneakers_f:     { path: 'women-sneakers',         kw: 'women sneakers' },

  // ── FEMALE ACCESSORIES ──────────────────────────────────────────────
  cat_earrings:       { path: 'earrings',               kw: 'earrings women' },
  cat_necklace:       { path: 'necklaces',              kw: 'necklace women' },
  cat_bangles:        { path: 'bangles',                kw: 'bangles women' },
  cat_handbag:        { path: 'handbags',               kw: 'handbag women' },
  cat_belt_f:         { path: 'belts',                  kw: 'waist belt women' },
  cat_sunglasses_f:   { path: 'sunglasses',             kw: 'sunglasses women' },
  cat_dupatta:        { path: 'stoles-dupattas',        kw: 'dupatta women' },
};

// ── Gender → default path when no category is known ──────────────────
const DEFAULT_PATHS = {
  male: {
    shirt:    { path: 'men-shirts',      kw: 'shirt men' },
    pant:     { path: 'men-trousers',    kw: 'trousers men' },
    dress:    { path: 'tshirts',         kw: 'men tshirt' },
    shoe:     { path: 'men-sneakers',    kw: 'men sneakers' },
    top:      { path: 'tshirts',         kw: 'men tshirt' },
    accessory: { path: 'accessories',    kw: 'men accessory' },
    watch:    { path: 'watches',         kw: 'men watch' },
  },
  female: {
    shirt:    { path: 'tops',            kw: 'women top' },
    pant:     { path: 'women-jeans',     kw: 'women jeans' },
    dress:    { path: 'co-ords',         kw: 'women coord set' },
    kurti:    { path: 'kurtas-kurtis',   kw: 'kurti women' },
    top:      { path: 'tops',            kw: 'women top' },
    shoe:     { path: 'heels',           kw: 'women heels' },
    accessory: { path: 'accessories',    kw: 'women accessory' },
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
    const { path = isFemale ? 'tops' : 'men-shirts', kw = 'clothing' } = catEntry || {};
    
    const colorClean = (color || '').toLowerCase().trim();
    const baseUrl = `https://www.myntra.com/${path}`;

    // STRICT ADULT FILTER
    const genderFilter = isFemale 
      ? 'Gender:women,men%20women' 
      : 'Gender:men,men%20women';
    
    // Myntra rawQuery works best with + for spaces and lowercase values
    const rawQ = encodeURIComponent(`${colorClean} ${kw}`).replace(/%20/g, '+');
    
    // If we have a specific gendered path, we can skip f= for cleaner URLs, but adding it is safer
    return `${baseUrl}?f=${genderFilter}&rawQuery=${rawQ}`;
  } catch (err) {
    console.error('[MyntraUrl] Critical Guard Triggered:', err);
    return `https://www.myntra.com/search?q=${encodeURIComponent(color + ' ' + (itemType || 'clothing'))}`;
  }
};

/**
 * buildMyntraSearchUrl — Simple search fallback
 */
export function buildMyntraSearchUrl(searchTerm, gender = 'male', itemType = 'shirt') {
  const isFemale = gender === 'female' || gender === 'women';
  const genderKey = isFemale ? 'female' : 'male';
  const typeKey   = itemType || 'shirt';
  
  const fallback = DEFAULT_PATHS[genderKey]?.[typeKey] || DEFAULT_PATHS[genderKey]?.shirt;
  const rawQ = encodeURIComponent(searchTerm).replace(/%20/g, '+');
  
  return `https://www.myntra.com/${fallback.path}?rawQuery=${rawQ}`;
}
