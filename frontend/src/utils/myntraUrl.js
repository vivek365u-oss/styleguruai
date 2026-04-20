/**
 * buildMyntraUrl.js — Centralized Myntra deep-link generator
 * ─────────────────────────────────────────────────────────────
 * Uses Myntra's CATEGORY-PATH + rawQuery format for maximum accuracy.
 * Format: https://www.myntra.com/{category-path}?rawQuery={color}+{keyword}
 *
 * Why NOT search?q=  → Generic search shows mixed results, same top products
 * Why category path → Myntra's category pages filter correctly by gender + type
 */

// ── Myntra category path map — cat_id → Myntra URL path ──────────────
const MYNTRA_PATHS = {
  // ── MALE ETHNIC ─────────────────────────────────────────────────────
  cat_sherwani:       { path: 'sherwanis',              kw: 'sherwani' },
  cat_kurta_set:      { path: 'kurtas',                 kw: 'kurta set' },
  cat_nehru_jacket:   { path: 'nehru-jackets',          kw: 'nehru jacket' },
  cat_dhoti_kurta:    { path: 'kurtas',                 kw: 'dhoti kurta' },
  cat_ethnic_coord:   { path: 'co-ords',                kw: 'ethnic coord set men' },

  // ── MALE FORMAL ─────────────────────────────────────────────────────
  cat_formal_shirt:   { path: 'formal-shirts',          kw: 'formal shirt men' },
  cat_tuxedo:         { path: 'suits',                  kw: 'suit men' },
  cat_formal_trouser: { path: 'formal-trousers',        kw: 'formal trouser men' },
  cat_waistcoat:      { path: 'waistcoats',             kw: 'waistcoat men' },

  // ── MALE CASUAL ─────────────────────────────────────────────────────
  cat_shirt:          { path: 'men-casual-shirts',      kw: 'premium casual cotton shirt men' },
  cat_formal_shirt:   { path: 'men-formal-shirts',      kw: 'luxury formal dress shirt men' },
  cat_tshirt:         { path: 'men-t-shirts',           kw: 'oversized drop shoulder t-shirt men' },
  cat_polo:           { path: 'men-t-shirts',           kw: 'premium knit polo shirt men' },
  cat_blazer:         { path: 'men-blazers',            kw: 'slim fit premium blazer men' },
  cat_coord_set_male: { path: 'co-ords',                kw: 'men coord set' },

  // ── MALE BOTTOMS ────────────────────────────────────────────────────
  cat_jeans:          { path: 'men-jeans',              kw: 'relaxed fit straight leg jeans men' },
  cat_cargo:          { path: 'men-cargo-pants',        kw: 'premium utility cargo pants men' },
  cat_chinos:         { path: 'men-chinos',             kw: 'slim fit stretch chinos men' },
  cat_shorts:         { path: 'men-shorts',             kw: 'men shorts' },
  cat_track_pants:    { path: 'track-pants-joggers',    kw: 'men track pants' },

  // ── MALE OUTERWEAR ──────────────────────────────────────────────────
  cat_hoodie:         { path: 'men-sweatshirts',        kw: 'heavyweight oversized hoodie men' },
  cat_jacket:         { path: 'jackets',                kw: 'men jacket' },
  cat_bomber:         { path: 'bomber-jackets',         kw: 'men bomber jacket' },
  cat_sweatshirt:     { path: 'sweatshirts',            kw: 'men sweatshirt' },

  // ── MALE FOOTWEAR ───────────────────────────────────────────────────
  cat_sneakers:       { path: 'men-sneakers',           kw: 'men sneakers' },
  cat_loafers:        { path: 'loafers',                kw: 'men loafers' },
  cat_boots:          { path: 'men-boots',              kw: 'men boots' },
  cat_formal_shoe:    { path: 'men-formal-shoes',       kw: 'men formal shoes' },
  cat_sports_shoe:    { path: 'men-sports-shoes',       kw: 'men sports shoes' },

  // ── MALE ACCESSORIES ────────────────────────────────────────────────
  cat_watch:          { path: 'watches',                kw: 'premium minimalist analog watch men' },
  cat_wallet:         { path: 'wallets',                kw: 'genuine leather slim wallet men' },
  cat_belt:           { path: 'belts',                  kw: 'premium leather dress belt men' },
  cat_sunglasses:     { path: 'men-sunglasses',         kw: 'retro square sunglasses men' },
  cat_backpack:       { path: 'backpacks',              kw: 'men backpack' },

  // ── FEMALE ETHNIC ───────────────────────────────────────────────────
  cat_saree_silk:     { path: 'sarees',                 kw: 'silk saree women' },
  cat_saree_chiffon:  { path: 'sarees',                 kw: 'chiffon saree women' },
  cat_saree_cotton:   { path: 'sarees',                 kw: 'cotton saree women' },
  cat_lehenga:        { path: 'lehenga-cholis',         kw: 'lehenga choli women' },
  cat_anarkali:       { path: 'anarkali-suits',         kw: 'anarkali suit women' },
  cat_kurti:          { path: 'kurtas-kurtis',          kw: 'kurti women' },
  cat_kurti_set:      { path: 'kurtas-kurtis',          kw: 'kurti set women' },
  cat_sharara:        { path: 'sharara-suits',          kw: 'sharara set women' },
  cat_palazzo_suit:   { path: 'palazzo-suits',          kw: 'palazzo suit women' },
  cat_dhoti_pants:    { path: 'churidar-suits',         kw: 'dhoti pants women' },

  // ── FEMALE FUSION ───────────────────────────────────────────────────
  cat_indo_western:   { path: 'indo-western',           kw: 'indo western dress women' },
  cat_coord_set_f:    { path: 'co-ords',                kw: 'coord set women' },
  cat_cape_set:       { path: 'jackets',                kw: 'cape set women' },

  // ── FEMALE TOPS ─────────────────────────────────────────────────────
  cat_crop_top:       { path: 'crop-tops',              kw: 'crop top women' },
  cat_blouse:         { path: 'blouses',                kw: 'blouse women' },
  cat_corset:         { path: 'corsets',                kw: 'corset top women' },
  cat_puff_top:       { path: 'tops',                   kw: 'puff sleeve top women' },
  cat_shirt_female:   { path: 'tops',                   kw: 'shirt tunic women' },
  cat_tank_top:       { path: 'tank-tops',              kw: 'tank top women' },
  cat_sweater:        { path: 'sweaters',               kw: 'sweater women' },

  // ── FEMALE DRESSES ──────────────────────────────────────────────────
  cat_dress_maxi:     { path: 'maxi-dresses',           kw: 'maxi dress women' },
  cat_dress_mini:     { path: 'mini-dresses',           kw: 'mini dress women' },
  cat_dress_midi:     { path: 'midi-dresses',           kw: 'midi dress women' },
  cat_bodycon:        { path: 'bodycon-dresses',        kw: 'bodycon dress women' },
  cat_shirt_dress:    { path: 'shirt-dresses',          kw: 'shirt dress women' },

  // ── FEMALE BOTTOMS ──────────────────────────────────────────────────
  cat_jeans_female:   { path: 'women-jeans',            kw: 'women jeans' },
  cat_mom_jeans:      { path: 'women-jeans',            kw: 'mom jeans women' },
  cat_skirt:          { path: 'skirts',                 kw: 'skirt women' },
  cat_palazzo_f:      { path: 'palazzos',               kw: 'palazzo pants women' },
  cat_shorts_female:  { path: 'women-shorts',           kw: 'women shorts' },
  cat_track_f:        { path: 'track-pants-joggers',    kw: 'track pants women' },

  // ── FEMALE OUTERWEAR ────────────────────────────────────────────────
  cat_hoodie_f:       { path: 'women-hoodies-sweatshirts', kw: 'women hoodie' },
  cat_blazer_f:       { path: 'women-blazers',          kw: 'blazer women' },
  cat_shrug:          { path: 'shrugs',                 kw: 'shrug cardigan women' },
  cat_sweatshirt_f:   { path: 'women-hoodies-sweatshirts', kw: 'sweatshirt women' },

  // ── FEMALE FOOTWEAR ─────────────────────────────────────────────────
  cat_heels:          { path: 'heels',                  kw: 'heels women' },
  cat_flats:          { path: 'flats',                  kw: 'flats juttis women' },
  cat_sneakers_f:     { path: 'women-sneakers',         kw: 'women sneakers' },
  cat_sandals:        { path: 'sandals',                kw: 'sandals women' },
  cat_boots_f:        { path: 'women-boots',            kw: 'ankle boots women' },

  // ── FEMALE ACCESSORIES ──────────────────────────────────────────────
  cat_earrings:       { path: 'earrings',               kw: 'earrings women' },
  cat_necklace:       { path: 'necklaces',              kw: 'necklace women' },
  cat_bangles:        { path: 'bangles',                kw: 'bangles women' },
  cat_handbag:        { path: 'handbags',               kw: 'handbag clutch women' },
  cat_belt_f:         { path: 'belts',                  kw: 'waist belt women' },
  cat_sunglasses_f:   { path: 'sunglasses',             kw: 'sunglasses women' },
  cat_dupatta:        { path: 'stoles-dupattas',        kw: 'dupatta stole women' },

  // ── UNISEX ──────────────────────────────────────────────────────────
  cat_unisex_hoodie:  { path: 'hoodies',                kw: 'hoodie unisex' },
  cat_graphic_tee:    { path: 'tshirts',                kw: 'graphic tee' },
  cat_sneakers_u:     { path: 'sneakers',               kw: 'sneakers' },
  cat_bomber_u:       { path: 'bomber-jackets',         kw: 'bomber jacket' },
  cat_loungewear:     { path: 'co-ords',                kw: 'loungewear set' },
};

// ── Gender → default path when no category is known ──────────────────
const DEFAULT_PATHS = {
  male: {
    shirt: { path: 'men-shirts',           kw: 'premium slim fit shirt men' },
    pant:  { path: 'men-trousers',         kw: 'slim fit tailored trousers men' },
    dress: { path: 'tshirts',       kw: 'men tshirt' },
    shoe:  { path: 'men-sneakers',  kw: 'men sneakers' },
    top:   { path: 'tshirts',       kw: 'men tshirt' },
  },
  female: {
    shirt: { path: 'tops',          kw: 'women top' },
    pant:  { path: 'women-jeans',   kw: 'women jeans' },
    dress: { path: 'co-ords',       kw: 'women coord set' },
    kurti: { path: 'kurtas-kurtis',         kw: 'premium ethnic kurti women' },
    top:   { path: 'tops',                  kw: 'korean minimal top women' },
    shoe:  { path: 'heels',                 kw: 'premium block heel sandals women' },
    accessory: { path: 'accessories',       kw: 'minimalist jewelry women' },
  },
};

/**
 * Build a Myntra deep-link URL with correct category path.
 *
 * @param {object} opts
 * @param {string} opts.color      - Color name (e.g. "Royal Blue")
 * @param {string} [opts.catId]   - Category id like 'cat_crop_top' (optional)
 * @param {string} [opts.gender]  - 'male' | 'female' (optional)
 * @param {string} [opts.itemType] - Fallback type hint: 'shirt'|'pant'|'dress'|'kurti'|'top'|'shoe'
 * @param {string} [opts.priceMax] - Max price e.g. '1000' (optional, not widely supported)
 * @returns {string} Full Myntra URL
 */
export function buildMyntraUrl({ color = '', catId = '', gender = 'male', itemType = 'shirt', priceMax = null }) {
  const colorSlug = color.trim().toLowerCase().replace(/\s+/g, '+');

  // 1. Try exact category mapping (most accurate)
  const catEntry = catId ? MYNTRA_PATHS[catId] : null;

  // 2. Fallback: use gender + itemType default
  const genderKey   = gender === 'female' ? 'female' : 'male';
  const typeKey     = itemType || 'shirt';
  const fallback    = DEFAULT_PATHS[genderKey]?.[typeKey] || DEFAULT_PATHS[genderKey]?.shirt;

  const { path, kw } = catEntry || fallback;

  // Build rawQuery: color + item keyword
  // FIX: If color already contains the keyword (e.g. "Silver Watch"), don't append "men watch"
  const kwWords = kw.toLowerCase().split(/\s+/);
  const colorLower = color.toLowerCase();
  const containsKeyword = kwWords.some(w => w !== 'men' && w !== 'women' && colorLower.includes(w));
  
  const rawQ = containsKeyword 
    ? colorSlug 
    : (colorSlug ? `${colorSlug}+${kw.replace(/\s+/g, '+')}` : kw.replace(/\s+/g, '+'));

  return `https://www.myntra.com/${path}?rawQuery=${rawQ}`;
}

/**
 * Convenience: build Myntra URL from a free-text search term + optional gender.
 * Used for StyleNavigator and WeatherTip which don't have category IDs.
 *
 * @param {string} searchTerm   - e.g. "navy blue oversized tshirt"
 * @param {string} [gender]     - 'male' | 'female'
 * @param {string} [itemType]   - 'shirt' | 'pant' | 'dress' | 'kurti' | 'top' | 'shoe'
 */
export function buildMyntraSearchUrl(searchTerm, gender = 'male', itemType = 'shirt') {
  const genderKey = gender === 'female' ? 'female' : 'male';
  const typeKey   = itemType || 'shirt';
  const fallback  = DEFAULT_PATHS[genderKey]?.[typeKey] || DEFAULT_PATHS[genderKey]?.shirt;
  const rawQ = encodeURIComponent(searchTerm).replace(/%20/g, '+');
  return `https://www.myntra.com/${fallback.path}?rawQuery=${rawQ}`;
}
