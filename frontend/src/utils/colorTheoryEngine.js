/**
 * colorTheoryEngine.js — Master Color Theory & Wardrobe Taxonomy Engine
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides 100% scientifically accurate, skin-tone & undertone harmonized
 * palettes, head-to-toe outfit ensembles, and curated accessory suites
 * for Male and Female users across Indian ethnic, Western, streetwear,
 * basics, footwear, and grooming.
 */

// ── COLOR PALETTE DICTIONARY ────────────────────────────────────────────────
export const MASTER_COLORS = {
  // Classic Neutrals & Staples
  white: { hex: '#FFFFFF', name: 'Crisp White' },
  off_white: { hex: '#FAF0E6', name: 'Warm Off-White' },
  ivory: { hex: '#FFFFF0', name: 'Regal Ivory' },
  cream: { hex: '#FFFDD0', name: 'Soft Cream' },
  beige: { hex: '#F5F5DC', name: 'Natural Beige' },
  sand: { hex: '#C2B280', name: 'Desert Sand' },
  khaki: { hex: '#C3B091', name: 'Classic Khaki' },
  camel: { hex: '#C19A6B', name: 'Warm Camel' },
  tan: { hex: '#D2B48C', name: 'Cognac Tan' },
  chocolate: { hex: '#5C381E', name: 'Chocolate Brown' },
  charcoal: { hex: '#36454F', name: 'Charcoal Grey' },
  slate_grey: { hex: '#708090', name: 'Slate Grey' },
  black: { hex: '#111111', name: 'Jet Black' },

  // Blues & Teals
  navy_blue: { hex: '#000080', name: 'Midnight Navy' },
  royal_blue: { hex: '#4169E1', name: 'Royal Blue' },
  cobalt_blue: { hex: '#0047AB', name: 'Cobalt Blue' },
  sky_blue: { hex: '#87CEEB', name: 'Sky Blue' },
  powder_blue: { hex: '#B0E0E6', name: 'Powder Blue' },
  teal: { hex: '#008080', name: 'Deep Teal' },

  // Greens & Earth
  olive_green: { hex: '#556B2F', name: 'Olive Green' },
  forest_green: { hex: '#228B22', name: 'Forest Green' },
  emerald: { hex: '#50C878', name: 'Emerald Green' },
  sage_green: { hex: '#9CAF88', name: 'Sage Green' },
  mint_green: { hex: '#98FF98', name: 'Mint Green' },

  // Reds, Corals & Pinks
  maroon: { hex: '#800000', name: 'Deep Maroon' },
  burgundy: { hex: '#722F37', name: 'Wine Burgundy' },
  rust: { hex: '#B7410E', name: 'Earthy Rust' },
  terracotta: { hex: '#E2725B', name: 'Terracotta' },
  coral: { hex: '#FF7F50', name: 'Vibrant Coral' },
  peach: { hex: '#FFDAB9', name: 'Warm Peach' },
  dusty_rose: { hex: '#DCAE96', name: 'Dusty Rose' },
  rose_pink: { hex: '#FF66B2', name: 'Rose Pink' },
  lavender: { hex: '#E6E6FA', name: 'Cool Lavender' },
  plum: { hex: '#8E4585', name: 'Rich Plum' },

  // Yellows, Oranges & Metallics
  mustard: { hex: '#E1AD01', name: 'Mustard Gold' },
  gold_champagne: { hex: '#F7E7CE', name: 'Champagne Gold' },
  bright_yellow: { hex: '#FFD700', name: 'Warm Gold' },
  burnt_orange: { hex: '#CC5500', name: 'Burnt Orange' },
  silver_grey: { hex: '#C0C0C0', name: 'Sterling Silver' },
};

// ── SKIN-TONE NORMALIZATION HELPER ──────────────────────────────────────────
export function normalizeSkinProfile(analysis) {
  const toneRaw = (analysis?.skin_tone?.category || analysis?.skin_tone || 'medium').toLowerCase();
  const underRaw = (analysis?.skin_tone?.undertone || analysis?.skin_tone?.subcategory || 'neutral').toLowerCase();

  let category = 'medium';
  if (toneRaw.includes('ultra_fair') || toneRaw.includes('fair')) category = 'fair';
  else if (toneRaw.includes('light')) category = 'light';
  else if (toneRaw.includes('olive')) category = 'olive';
  else if (toneRaw.includes('dark') || toneRaw.includes('deep')) category = 'dark';
  else if (toneRaw.includes('brown')) category = 'brown';
  else category = 'medium';

  let undertone = 'neutral';
  if (underRaw.includes('warm')) undertone = 'warm';
  else if (underRaw.includes('cool')) undertone = 'cool';
  else undertone = 'neutral';

  return { category, undertone };
}

// ── DYNAMIC COLOR DERIVATION ENGINE ─────────────────────────────────────────
/**
 * Derives color swatches for any wardrobe category, adhering to color science.
 */
export function deriveCategoryColors(category, gender, analysis, recommendations = {}) {
  const isFemale = gender === 'female' || gender === 'women';
  const { category: skinCategory, undertone } = normalizeSkinProfile(analysis);
  const catKey = (category || 'shirt').toLowerCase().replace(/^cat_/, '');

  // 1. Direct Backend Recommendations (if available)
  if (isFemale) {
    if (catKey === 'dress' && recommendations.best_dress_colors?.length > 0) return recommendations.best_dress_colors;
    if (catKey === 'top' && recommendations.best_top_colors?.length > 0) return recommendations.best_top_colors;
    if (catKey === 'kurti' && recommendations.best_kurti_colors?.length > 0) return recommendations.best_kurti_colors;
    if (catKey === 'lehenga' && recommendations.best_lehenga_colors?.length > 0) return recommendations.best_lehenga_colors;
    if (catKey === 'saree' && recommendations.best_saree_colors?.length > 0) return recommendations.best_saree_colors;
    if (catKey === 'bottom' && (recommendations.best_bottom_colors?.length > 0 || recommendations.best_pant_colors?.length > 0)) {
      return recommendations.best_bottom_colors || recommendations.best_pant_colors;
    }
  } else {
    if (catKey === 'tshirt' && recommendations.best_tshirt_colors?.length > 0) return recommendations.best_tshirt_colors;
    if (catKey === 'shirt' && recommendations.best_shirt_colors?.length > 0) return recommendations.best_shirt_colors;
    if (catKey === 'kurta' && recommendations.best_kurta_colors?.length > 0) return recommendations.best_kurta_colors;
    if (catKey === 'blazer' && recommendations.best_blazer_colors?.length > 0) return recommendations.best_blazer_colors;
    if (catKey === 'hoodie' && recommendations.best_hoodie_colors?.length > 0) return recommendations.best_hoodie_colors;
    if (catKey === 'cargo' && recommendations.best_pant_colors?.length > 0) return recommendations.best_pant_colors;
  }

  // 2. Synthesize High-Precision Colors based on Color Theory
  switch (catKey) {
    // ── BLOUSE (FEMALE) ─────────────────────────────────────────────────────
    case 'blouse': {
      if (undertone === 'warm') {
        return [
          { ...MASTER_COLORS.maroon, reason: 'Rich maroon blouse adds regal contrast against warm golden undertones' },
          { ...MASTER_COLORS.gold_champagne, reason: 'Champagne brocade blouse highlights warm skin radiance' },
          { ...MASTER_COLORS.forest_green, reason: 'Forest green silk blouse offers striking Indian festive harmony' },
          { ...MASTER_COLORS.rust, reason: 'Earthy rust complements saree silks without overwhelming' },
          { ...MASTER_COLORS.black, reason: 'Velvet black blouse is an ultra-versatile contrast pairing' },
        ];
      } else if (undertone === 'cool') {
        return [
          { ...MASTER_COLORS.burgundy, reason: 'Wine burgundy elevates cool rosy tones with luxurious depth' },
          { ...MASTER_COLORS.silver_grey, reason: 'Silver zari tissue blouse creates a high-fashion cool gleam' },
          { ...MASTER_COLORS.royal_blue, reason: 'Royal blue raw silk blouse delivers timeless statement contrast' },
          { ...MASTER_COLORS.emerald, reason: 'Deep emerald jewel tones glow naturally against cool complexions' },
          { ...MASTER_COLORS.white, reason: 'Raw silk pearl white blouse creates crisp modern elegance' },
        ];
      }
      return [
        { ...MASTER_COLORS.teal, reason: 'Deep teal silk blouse is universally balanced for neutral complexions' },
        { ...MASTER_COLORS.dusty_rose, reason: 'Dusty rose embroidered blouse softens and flatters the visage' },
        { ...MASTER_COLORS.gold_champagne, reason: 'Antique gold blouse bridges both warm and cool saree drapes' },
        { ...MASTER_COLORS.navy_blue, reason: 'Midnight navy delivers a slender, sophisticated aesthetic' },
      ];
    }

    // ── CO-ORDS & JUMPSUITS (FEMALE) ────────────────────────────────────────
    case 'coord':
    case 'jumpsuit': {
      if (undertone === 'warm') {
        return [
          { ...MASTER_COLORS.terracotta, reason: 'Warm terracotta co-ord radiates modern resort elegance' },
          { ...MASTER_COLORS.olive_green, reason: 'Olive linen set balances golden facial undertones effortlessly' },
          { ...MASTER_COLORS.off_white, reason: 'Warm off-white monochromatic set elongates your silhouette' },
          { ...MASTER_COLORS.mustard, reason: 'Mustard yellow co-ord makes summer skin pop with energy' },
        ];
      } else if (undertone === 'cool') {
        return [
          { ...MASTER_COLORS.cobalt_blue, reason: 'Cobalt blue power co-ord creates high-impact cool contrast' },
          { ...MASTER_COLORS.charcoal, reason: 'Slate charcoal jumpsuit offers sleek European minimalism' },
          { ...MASTER_COLORS.lavender, reason: 'Pastel lavender linen co-ord softens facial features' },
          { ...MASTER_COLORS.emerald, reason: 'Emerald green jumpsuits deliver instant evening glam' },
        ];
      }
      return [
        { ...MASTER_COLORS.sage_green, reason: 'Sage green monochrome set balances subtle earthy undertones' },
        { ...MASTER_COLORS.navy_blue, reason: 'Midnight navy co-ord delivers timeless, slimming sophistication' },
        { ...MASTER_COLORS.dusty_rose, reason: 'Dusty rose co-ord exudes quiet luxury aesthetic' },
      ];
    }

    // ── SHAPEWEAR & INNERWEAR (FEMALE) ──────────────────────────────────────
    case 'shapewear':
    case 'bra':
    case 'panty':
    case 'basics': {
      if (skinCategory === 'fair' || skinCategory === 'light') {
        return [
          { name: 'Soft Sand Nude', hex: '#E8D3B9', reason: 'Seamless invisible match under light-colored sarees & tops' },
          { name: 'Warm Almond', hex: '#DEBA9D', reason: 'Disappears completely under thin chiffons and georgettes' },
          { ...MASTER_COLORS.black, reason: 'Firming compression staple for dark sarees & evening gowns' },
          { ...MASTER_COLORS.white, reason: 'Pristine base for pure white suits and sheer kurtis' },
        ];
      } else if (skinCategory === 'medium' || skinCategory === 'olive') {
        return [
          { name: 'Honey Biscuit Nude', hex: '#C69C6D', reason: 'True second-skin tone match for wheatish & medium complexions' },
          { name: 'Caramel Bronze', hex: '#B07E4D', reason: 'Zero silhouette visibility under pastel or sheer drapes' },
          { ...MASTER_COLORS.black, reason: 'Slimming contour staple for partywear & festive lehengas' },
          { ...MASTER_COLORS.off_white, reason: 'Soft neutral for daily cotton kurtis' },
        ];
      }
      return [
        { name: 'Rich Cocoa Nude', hex: '#7A4A28', reason: 'Flawless tone-matched nude that prevents show-through on deep skin' },
        { name: 'Espresso Bronze', hex: '#4E2F1D', reason: 'Seamless contour foundation garment for sheer sarees' },
        { ...MASTER_COLORS.black, reason: 'Essential dark silhouette support' },
      ];
    }

    // ── FOOTWEAR & HEELS (FEMALE) ───────────────────────────────────────────
    case 'heels':
    case 'flats':
    case 'shoes': {
      if (undertone === 'warm') {
        return [
          { ...MASTER_COLORS.tan, reason: 'Cognac tan heels elongate legs and harmonize with warm skin' },
          { ...MASTER_COLORS.gold_champagne, reason: 'Champagne metallic block heels add festive sparkle to sarees' },
          { ...MASTER_COLORS.off_white, reason: 'Warm ivory sneakers or mules keep daily outfits crisp' },
          { ...MASTER_COLORS.chocolate, reason: 'Rich chocolate leather complements earthy trousers' },
        ];
      } else if (undertone === 'cool') {
        return [
          { ...MASTER_COLORS.silver_grey, reason: 'Metallic silver stilettos add a sharp, radiant edge' },
          { ...MASTER_COLORS.black, reason: 'Classic patent black pumps define and ground cool outfits' },
          { ...MASTER_COLORS.white, reason: 'Clean white platform trainers provide crisp contrast' },
          { ...MASTER_COLORS.burgundy, reason: 'Wine red heels deliver sophisticated evening drama' },
        ];
      }
      return [
        { name: 'Classic Nude Tan', hex: '#D2B48C', reason: 'Nude footwear creates an uninterrupted, leg-lengthening line' },
        { ...MASTER_COLORS.black, reason: 'Go-to anchor for both Western trousers and ethnic sets' },
        { ...MASTER_COLORS.gold_champagne, reason: 'Muted dual-tone metallic works with both silver & gold zari' },
      ];
    }

    // ── MALE FORMAL & CASUAL SHIRTS ─────────────────────────────────────────
    case 'shirt':
    case 'formal_shirt': {
      if (undertone === 'warm') {
        return [
          { ...MASTER_COLORS.off_white, reason: 'Warm off-white shirt flatters golden undertones without harsh glare' },
          { ...MASTER_COLORS.olive_green, reason: 'Olive linen shirt brings out natural warmth and masculine edge' },
          { ...MASTER_COLORS.terracotta, reason: 'Terracotta button-down is trending for smart-casual dates' },
          { ...MASTER_COLORS.navy_blue, reason: 'Deep navy provides reliable, authoritative contrast' },
          { ...MASTER_COLORS.khaki, reason: 'Sand khaki shirt works seamlessly for effortless daywear' },
        ];
      } else if (undertone === 'cool') {
        return [
          { ...MASTER_COLORS.powder_blue, reason: 'French powder blue crisp dress shirt illuminates cool undertones' },
          { ...MASTER_COLORS.white, reason: 'Stark pure white button-down creates sharp corporate authority' },
          { ...MASTER_COLORS.charcoal, reason: 'Charcoal grey textured shirt provides sleek modern styling' },
          { ...MASTER_COLORS.lavender, reason: 'Lilac lavender shirt softens and balances cool facial tones' },
          { ...MASTER_COLORS.navy_blue, reason: 'Midnight navy shirt enhances sharp jawline definition' },
        ];
      }
      return [
        { ...MASTER_COLORS.sky_blue, reason: 'Classic sky blue oxford shirt is universally flattering' },
        { ...MASTER_COLORS.sage_green, reason: 'Sage green linen shirt delivers fresh, modern smart-casual appeal' },
        { ...MASTER_COLORS.navy_blue, reason: 'Navy button-down provides timeless versatile styling' },
        { ...MASTER_COLORS.off_white, reason: 'Off-white linen resort shirt offers relaxed refinement' },
      ];
    }

    // ── MALE OUTERWEAR & JACKETS ────────────────────────────────────────────
    case 'jacket':
    case 'bomber': {
      if (undertone === 'warm') {
        return [
          { ...MASTER_COLORS.camel, reason: 'Warm camel trucker jacket highlights warm golden skin tones' },
          { ...MASTER_COLORS.olive_green, reason: 'Military olive bomber jacket provides rugged, masculine depth' },
          { ...MASTER_COLORS.chocolate, reason: 'Dark brown leather jacket anchors casual streetwear' },
          { ...MASTER_COLORS.black, reason: 'Classic black jacket for high-contrast evening layering' },
        ];
      } else if (undertone === 'cool') {
        return [
          { ...MASTER_COLORS.charcoal, reason: 'Charcoal wool jacket provides tailored cool-tone sophistication' },
          { ...MASTER_COLORS.navy_blue, reason: 'Navy varsity jacket gives a sleek, youthful contrast' },
          { ...MASTER_COLORS.black, reason: 'Black moto leather jacket gives timeless edge' },
          { ...MASTER_COLORS.slate_grey, reason: 'Slate grey bomber bridges casual and semi-formal wear' },
        ];
      }
      return [
        { ...MASTER_COLORS.navy_blue, reason: 'Midnight navy jacket pairs with nearly all neutral trousers' },
        { ...MASTER_COLORS.olive_green, reason: 'Muted olive jacket creates effortless streetwear synergy' },
        { ...MASTER_COLORS.black, reason: 'Essential black jacket grounds bold inner tees' },
      ];
    }

    // ── MALE INNERWEAR & BASICS ─────────────────────────────────────────────
    case 'vest':
    case 'ganji':
    case 'boxers': {
      return [
        { ...MASTER_COLORS.white, reason: '100% breathable ribbed cotton vest keeps you fresh and cool' },
        { ...MASTER_COLORS.charcoal, reason: 'Charcoal grey gym tank prevents sweat mark visibility' },
        { ...MASTER_COLORS.black, reason: 'Black cotton boxer briefs provide supportive everyday comfort' },
        { ...MASTER_COLORS.navy_blue, reason: 'Midnight navy innerwear offers a clean, masculine staple' },
      ];
    }

    // ── MALE FOOTWEAR & SNEAKERS ────────────────────────────────────────────
    case 'sneakers':
    case 'shoes':
    case 'formals': {
      if (undertone === 'warm') {
        return [
          { ...MASTER_COLORS.tan, reason: 'Burnished cognac tan loafers elevate chinos and kurtas effortlessly' },
          { ...MASTER_COLORS.white, reason: 'Minimalist white leather sneakers provide clean daily streetwear contrast' },
          { ...MASTER_COLORS.chocolate, reason: 'Dark chocolate suede Chelsea boots add rich autumn texture' },
          { ...MASTER_COLORS.gold_champagne, reason: 'Gold-embroidered mojaris provide authentic royal festive footing' },
        ];
      } else if (undertone === 'cool') {
        return [
          { ...MASTER_COLORS.black, reason: 'Polished black Oxford dress shoes deliver commanding corporate presence' },
          { ...MASTER_COLORS.white, reason: 'Crisp white retro sneakers brighten cool-tone casual fits' },
          { ...MASTER_COLORS.charcoal, reason: 'Grey suede Chelsea boots create modern European edge' },
          { ...MASTER_COLORS.navy_blue, reason: 'Navy slip-on driving shoes offer effortless summer ease' },
        ];
      }
      return [
        { ...MASTER_COLORS.white, reason: 'Pristine white trainers pair with everything from denims to suits' },
        { ...MASTER_COLORS.tan, reason: 'Classic tan dress shoes bridge office and wedding wear' },
        { ...MASTER_COLORS.black, reason: 'Sleek black formal derbies anchor sharp evening looks' },
      ];
    }

    default: {
      // General fallbacks aligned to tone
      if (undertone === 'warm') {
        return [
          { ...MASTER_COLORS.rust, reason: 'Warm earthy shade flatters your undertone' },
          { ...MASTER_COLORS.olive_green, reason: 'Natural green provides rich harmony' },
          { ...MASTER_COLORS.navy_blue, reason: 'Deep navy provides balanced contrast' },
        ];
      } else if (undertone === 'cool') {
        return [
          { ...MASTER_COLORS.royal_blue, reason: 'Striking jewel tone illuminates cool skin' },
          { ...MASTER_COLORS.charcoal, reason: 'Polished cool neutral' },
          { ...MASTER_COLORS.white, reason: 'Clean crisp contrast' },
        ];
      }
      return [
        { ...MASTER_COLORS.teal, reason: 'Balanced shade flattering all neutral undertones' },
        { ...MASTER_COLORS.burgundy, reason: 'Rich depth for any occasion' },
        { ...MASTER_COLORS.navy_blue, reason: 'Timeless anchor color' },
      ];
    }
  }
}

// ── COMPREHENSIVE OUTFITS ENGINE ────────────────────────────────────────────
export function deriveOutfitSuites(gender, analysis, recommendations = {}, userOccasion = 'casual') {
  const isFemale = gender === 'female' || gender === 'women';
  const { category: skinCategory, undertone } = normalizeSkinProfile(analysis);

  if (isFemale) {
    return {
      combos: [
        {
          name: 'Old Money Linen Elegance',
          upper: 'Linen Button-Down Shirt in Off-White',
          lower: 'High-Waisted Wide-Leg Trousers in Beige',
          shoes: 'Cognac Block Heels & Leather Belt',
          accent: 'Pearl Studs & Structured Shoulder Bag',
          vibe: 'Quiet Luxury',
          occasion: 'Brunch / Work',
          catId: 'shirt',
        },
        {
          name: 'Gen-Z Streetwear Silhouette',
          upper: 'Ribbed Halter Crop Top in ' + (undertone === 'warm' ? 'Terracotta' : 'Cobalt Blue'),
          lower: 'Wide-Leg Utility Cargo Pants in Charcoal',
          shoes: 'Chunky Platform White Sneakers',
          accent: 'Silver Chunky Hoops & Crossbody Bag',
          vibe: 'Urban Streetwear',
          occasion: 'Casual / College',
          catId: 'croptop',
        },
        {
          name: 'Sunset Satin Dinner Look',
          upper: 'Cowl-Neck Satin Slip Top in ' + (undertone === 'warm' ? 'Warm Bronze' : 'Wine Burgundy'),
          lower: 'Pleated Cigarette Trousers in Jet Black',
          shoes: 'Pointed Stiletto Pumps',
          accent: 'Layered Gold Chain & Evening Clutch',
          vibe: 'Chic Glam',
          occasion: 'Date Night / Party',
          catId: 'top',
        },
        {
          name: 'Summer Resort Co-ord',
          upper: 'Breezy Cotton Co-ord Shirt Set in ' + (undertone === 'warm' ? 'Sage Green' : 'Pastel Lavender'),
          lower: 'Matching Flared Culotte Shorts',
          shoes: 'Slide-on Flat Sandals',
          accent: 'Woven Straw Tote & Cat-Eye Sunglasses',
          vibe: 'Effortless Vacation',
          occasion: 'Travel / Resort',
          catId: 'coord',
        },
      ],
      sarees: [
        {
          type: 'Banarasi Silk Saree Drape',
          saree: undertone === 'warm' ? 'Deep Maroon Banarasi Silk with Gold Zari' : 'Emerald Green Silk with Antique Silver Border',
          blouse: undertone === 'warm' ? 'Sweetheart Neck Brocade Blouse in Champagne Gold' : 'Raw Silk Contrast Blouse in Wine Burgundy',
          shapewear: skinCategory === 'fair' ? 'Soft Sand Saree Shapewear (Mermaid Fit)' : 'Honey Biscuit Saree Shapewear (Fish Cut)',
          accessories: 'Antique Temple Kundan Jhumkas, Gold Kadas & Wedges',
          occasion: 'Wedding / Festive Gala',
          colors: undertone === 'warm' ? 'Maroon & Gold' : 'Emerald & Silver',
          reason: 'Rich silk luster reflects ambient light onto your face, enhancing natural undertone warmth.',
        },
        {
          type: 'Modern Organza Saree Drape',
          saree: undertone === 'warm' ? 'Peach Organza with Floral Threadwork' : 'Powder Blue Sheer Organza with Scalloped Border',
          blouse: 'Sleeveless Satin Blouse with V-Neckline',
          shapewear: 'Skin-Tone ToneFit Breathable Microfiber Petticoat',
          accessories: 'Minimal Pearl Choker, Crystal Studs & Kitten Heels',
          occasion: 'Cocktail / Farewell / Day Wedding',
          colors: undertone === 'warm' ? 'Peach & Pearl' : 'Powder Blue & Crystal',
          reason: 'Translucent organza creates a lightweight ethereal drape that softens and flatters facial angles.',
        },
        {
          type: 'Contemporary Ready-to-Wear Ruffle Saree',
          saree: undertone === 'warm' ? 'Rust Orange Pre-Draped Tiered Saree' : 'Royal Blue Georgette Ruffle Saree',
          blouse: 'Sequin Embellished Backless Blouse',
          shapewear: 'Tummy Tucker Mermaid Saree Shaper',
          accessories: 'Chandelier Earrings, Metallic Box Clutch & Stilettos',
          occasion: 'Sangeet / Reception / Party',
          colors: undertone === 'warm' ? 'Rust & Copper' : 'Royal Blue & Silver',
          reason: 'Pre-stitched pleats guarantee zero bunching, providing a streamlined, red-carpet silhouette.',
        },
      ],
      festive: [
        {
          title: 'Royal Heritage Lehenga Set',
          lehenga: undertone === 'warm' ? 'Crimson Velvet Lehenga with Zardozi Work' : 'Midnight Navy Raw Silk Lehenga with Silver Gota',
          choli: 'Fitted Sweetheart Choli with Elbow Sleeves',
          dupatta: 'Lightweight Net Dupatta with Scalloped Lace Border',
          footwear: 'Handcrafted Punjabi Juttis with Cushion Sole',
          occasion: 'Bridal / Sangeet Night',
        },
        {
          title: 'Flared Sharara & Peplum Kurti',
          lehenga: undertone === 'warm' ? 'Mustard Yellow Sharara Suit with Mirror Work' : 'Teal Green Sharara with Gota Patti',
          choli: 'Short Flared Peplum Kurti',
          dupatta: 'Chiffon Dupatta with Tassels',
          footwear: 'Kolhapuri Platform Wedges',
          occasion: 'Haldi / Mehendi / Family Puja',
        },
      ],
    };
  }

  // Male Outfits Architecture
  return {
    combos: [
      {
        name: 'Gen-Z Minimalist Streetwear',
        upper: 'Heavyweight Drop-Shoulder Oversized Tee in ' + (undertone === 'warm' ? 'Desert Sand' : 'Slate Charcoal'),
        lower: '6-Pocket Utility Cargo Pants in Jet Black',
        shoes: 'Minimalist White Leather Sneakers',
        accent: 'Stainless Steel Box Chain & Minimal Watch',
        vibe: 'Modern Streetwear',
        occasion: 'Casual / Weekend',
        catId: 'tshirt',
      },
      {
        name: 'Old Money Resort Aesthetic',
        upper: 'Pure Linen Camp-Collar Shirt in ' + (undertone === 'warm' ? 'Warm Off-White' : 'French Sky Blue'),
        lower: 'Tailored Flat-Front Chinos in Khaki / Navy',
        shoes: 'Burnished Tan Suede Penny Loafers',
        accent: 'Braided Leather Belt & Retro Wayfarers',
        vibe: 'Quiet Luxury',
        occasion: 'Date Night / Travel',
        catId: 'shirt',
      },
      {
        name: 'Modern Smart Casual Power',
        upper: 'Fine-Knit Polo Shirt in ' + (undertone === 'warm' ? 'Forest Green' : 'Cobalt Navy'),
        lower: 'Slim-Tapered Ankle Trousers in Charcoal',
        shoes: 'White Leather Court Sneakers or Suede Loafers',
        accent: 'Chronograph Steel Watch & Leather Messenger',
        vibe: 'Smart Casual',
        occasion: 'Office / Networking',
        catId: 'polo',
      },
      {
        name: 'Urban Night Out Layering',
        upper: 'Fitted Crewneck Tee under ' + (undertone === 'warm' ? 'Camel Suede Trucker Jacket' : 'Black Leather Biker Jacket'),
        lower: 'Straight-Fit Dark Wash Denim',
        shoes: 'Leather Chelsea Boots in Dark Chocolate / Black',
        accent: 'Silver Kada & Minimal Signet Ring',
        vibe: 'Chic Rugged',
        occasion: 'Night Out / Dinner',
        catId: 'jacket',
      },
    ],
    ethnic: [
      {
        type: 'Lucknowi Chikankari Kurta & Bundi Set',
        title: 'Lucknowi Chikankari Kurta with Embroidered Bundi (Nehru Jacket)',
        kurta: undertone === 'warm' ? 'Ivory White Cotton Chikankari Kurta with Churidar' : 'Powder Blue Silk Kurta Pajama',
        bundi: undertone === 'warm' ? 'Mustard / Rust Brocade Nehru Jacket with Mandarin Collar' : 'Navy Blue Silk Nehru Jacket with Silver Buttons',
        footwear: 'Handcrafted Velvet Embroidered Mojaris',
        accessories: 'Gold-rimmed Watch, Pocket Square & Pocket Dupatta',
        occasion: 'Diwali / Eid / Engagement Guest',
        colors: undertone === 'warm' ? 'Ivory, Mustard & Gold' : 'Blue, Navy & Silver',
      },
      {
        type: 'Royal Jodhpuri Bandhgala Suit',
        title: 'Bespoke Jodhpuri Bandhgala Suit',
        kurta: undertone === 'warm' ? 'Deep Maroon Raw Silk Bandhgala Jacket' : 'Midnight Navy Structured Bandhgala Jacket',
        bundi: 'Matching Tailored Formal Trousers',
        footwear: 'Patent Black Formal Oxford Shoes',
        accessories: 'Silver/Gold Lapel Pin, Pocket Square',
        occasion: 'Wedding Reception / Formal Banquet',
        colors: undertone === 'warm' ? 'Maroon & Charcoal' : 'Navy & Black',
      },
      {
        type: 'Festive Short Kurta Fusion',
        title: 'Short Mandarin Collar Kurta with Chinos',
        kurta: undertone === 'warm' ? 'Olive Green or Terracotta Short Kurta' : 'Cobalt Blue or White Short Kurta',
        bundi: 'Straight-Fit Beige or Black Chinos',
        footwear: 'Leather Peshawari Sandals / Loafers',
        accessories: 'Leather Wristband & Minimal Aviators',
        occasion: 'Puja / Haldi / Casual Festive',
        colors: undertone === 'warm' ? 'Olive & Khaki' : 'Cobalt & Charcoal',
      },
    ],
  };
}

// ── COMPREHENSIVE ACCESSORIES SUITE ─────────────────────────────────────────
export function deriveAccessoriesSuite(gender, analysis) {
  const isFemale = gender === 'female' || gender === 'women';
  const { category: skinCategory, undertone } = normalizeSkinProfile(analysis);

  if (isFemale) {
    return {
      jewellery: [
        {
          type: 'Earrings',
          title: undertone === 'warm' ? 'Kundan Gold Jhumkas & Pearl Drops' : 'Sterling Silver Chandbalis & Amethyst Drops',
          colors: undertone === 'warm' ? 'Yellow Gold, Pearls, Coral' : 'Oxidised Silver, Diamonds, Cool Crystals',
          reason: undertone === 'warm' ? 'Gold metal reflects warm golden highlights onto cheeks' : 'Cool silver illuminates rosy facial undertones',
          cat: 'jhumka',
        },
        {
          type: 'Necklace',
          title: undertone === 'warm' ? 'Multi-Layered Gold Chain & Polki Choker' : 'Silver Tennis Choker & Blue Sapphire Pendant',
          colors: undertone === 'warm' ? '22k Gold Finish, Amber, Emerald Beads' : 'Rhodium Silver, Zirconia, Icy Blue',
          reason: 'Draws focus to the collarbone and frames facial symmetry.',
          cat: 'necklace',
        },
        {
          type: 'Bangles & Kadas',
          title: undertone === 'warm' ? 'Antique Gold Filigree Kadas & Glass Bangles' : 'Platinum Plated Bangles & Silver Kadas',
          colors: undertone === 'warm' ? 'Gold & Maroon' : 'Silver & Sapphire',
          reason: 'Adds authentic ethnic resonance to ethnic sarees and lehengas.',
          cat: 'bangles',
        },
        {
          type: 'Traditional Accents',
          title: 'Delicate Floral Maang Tikka & Silver Payal (Anklet)',
          colors: undertone === 'warm' ? 'Gold & Pearl' : 'Silver & Ghungroo',
          reason: 'Essential bridal and festive grace.',
          cat: 'payal',
        },
      ],
      bags_footwear: [
        {
          type: 'Structured Tote Bag',
          title: 'Everyday Work & College Leather Tote',
          colors: undertone === 'warm' ? 'Warm Cognac Tan, Camel' : 'Jet Black, Slate Grey',
          reason: 'Spacious, durable silhouette holding laptop & essentials with polish.',
          cat: 'tote',
        },
        {
          type: 'Party Clutch & Potli',
          title: 'Embroidered Zari Potli Bag & Box Clutch',
          colors: undertone === 'warm' ? 'Gold Brocade, Rust Orange' : 'Silver Shimmer, Royal Navy',
          reason: 'Indispensable companion for sarees, suits, and evening gowns.',
          cat: 'potli',
        },
        {
          type: 'Block Heels & Pumps',
          title: 'Comfortable Block Heels (2.5 Inch)',
          colors: undertone === 'warm' ? 'Nude Tan, Champagne Gold' : 'Classic Black, Silver Metallic',
          reason: 'Provides all-day posture support without foot fatigue.',
          cat: 'heels',
        },
        {
          type: 'Ethnic Juttis',
          title: 'Handcrafted Punjabi Leather Juttis',
          colors: undertone === 'warm' ? 'Maroon with Gold Threadwork' : 'Pastel Lilac with Silver Dabka',
          reason: 'Soft cushioned sole ideal for long festival gatherings.',
          cat: 'juttis',
        },
      ],
      makeup: [
        {
          product: 'Skin Tone Foundation',
          shade: undertone === 'warm' ? 'Warm Honey / Golden Olive Undertone' : undertone === 'cool' ? 'Cool Rosy / Porcelain Undertone' : 'Neutral Almond Beige',
          brands: 'Maybelline Fit Me, MAC Studio Fix, Kay Beauty',
          tip: 'Matches jawline seamlessly without ashy or oxidized cast.',
          cat: 'foundation',
        },
        {
          product: 'Matte Liquid Lipstick',
          shade: undertone === 'warm' ? 'Terracotta Nude, Spiced Peach, Warm Brick Red' : undertone === 'cool' ? 'Berry Mauve, Ruby Red, Plum Rose' : 'Dusty Rose, Classic Cherry Red',
          brands: 'Nykaa Matte to Last, Swiss Beauty, Sugar',
          tip: 'Hydrating non-drying transfer-proof formula.',
          cat: 'lipstick',
        },
        {
          product: 'Silk Cheek Blush',
          shade: undertone === 'warm' ? 'Peachy Apricot & Warm Terracotta' : undertone === 'cool' ? 'Soft Petal Pink & Cool Mauve' : 'Rose Nude',
          brands: 'Rare Beauty, Kay Beauty, Insight',
          tip: 'Tap on high points of cheekbones for an instant natural lift.',
          cat: 'blush',
        },
        {
          product: 'Smudge-Proof Kohl & Kajal',
          shade: 'Intense Carbon Black Gel Kajal + Volumizing Mascara',
          brands: 'Plum 100% Kohl, Maybelline Colossal, Colorbar',
          tip: 'Waterproof 24h wear defining Indian almond eyes.',
          cat: 'kajal',
        },
        {
          product: 'Luxury Eau de Parfum (EDP)',
          shade: undertone === 'warm' ? 'Warm Amber, Spiced Madagascar Vanilla & Sandalwood' : 'White Florals, Jasmine Sambac & Fresh Aquatic Bergamot',
          brands: 'Titan Skinn, Zara, Bella Vita Luxury',
          tip: 'Spray on pulse points (wrists, neck, collarbone) for 8+ hour sillage.',
          cat: 'perfume',
        },
      ],
      basics_shapewear: [
        {
          type: 'Saree Shapewear (Fish Cut)',
          title: 'Targeted Mermaid Saree Shapewear Petticoat',
          colors: skinCategory === 'fair' ? 'Soft Sand Nude' : skinCategory === 'medium' ? 'Honey Biscuit Nude' : 'Cocoa Bronze',
          reason: 'Seamless microfiber with side slit for comfortable movement and flat tummy tuck.',
          cat: 'shapewear',
        },
        {
          type: 'Seamless T-Shirt Bra',
          title: 'Non-Padded Wirefree Seamless T-Shirt Bra',
          colors: 'Skin Nude & Jet Black',
          reason: 'Zero cup outline visibility under tight tops, kurtis, and bodycons.',
          cat: 'bra',
        },
        {
          type: 'Laser-Cut Panties',
          title: 'No-VPL Seamless Laser-Cut Hipster Panties',
          colors: 'Nude, Black, Taupe',
          reason: 'Guarantees zero visible panty lines even under satin or thin white trousers.',
          cat: 'panty',
        },
        {
          type: 'Camisole / Slip',
          title: '100% Breathable Cotton Spaghetti Camisole',
          colors: 'Off-White, Black, Nude',
          reason: 'Essential modesty layer under sheer blouses and chikankari kurtis.',
          cat: 'camisole',
        },
      ],
    };
  }

  // Male Accessories Suite
  return {
    watches_jewellery: [
      {
        type: 'Wrist Watch',
        title: undertone === 'warm' ? 'Gold & Bronze Chronograph / Tan Leather Watch' : 'Stainless Steel Silver Chronograph Watch',
        colors: undertone === 'warm' ? 'Champagne Gold Dial with Brown Leather' : 'Brushed Silver with Blue / Black Sunburst Dial',
        reason: undertone === 'warm' ? 'Gold bezel harmonizes with golden skin warmth' : 'Steel and silver links pop cleanly against cool skin',
        cat: 'watch',
      },
      {
        type: 'Neck Chain',
        title: 'Minimalist 3mm Stainless Steel Box Chain',
        colors: undertone === 'warm' ? 'Antique Gold / Brass Tone' : 'Sterling Silver / Rhodium Polish',
        reason: 'Sits subtly at collarbone under unbuttoned shirts & Cuban collars.',
        cat: 'chain',
      },
      {
        type: 'Kada & Bracelet',
        title: 'Sleek Stainless Steel Kada / Braided Leather Bracelet',
        colors: undertone === 'warm' ? 'Cognac Leather & Brass Kada' : 'Matte Black Steel & Silver Kada',
        reason: 'Adds confident masculine detail to your wrist game.',
        cat: 'bracelet',
      },
      {
        type: 'Signet Ring',
        title: 'Minimalist Brushed Geometric Signet Ring',
        colors: undertone === 'warm' ? 'Warm Gold Finish' : 'Oxidised Silver Finish',
        reason: 'Old money aesthetic accent on pinky or ring finger.',
        cat: 'ring',
      },
    ],
    footwear_belts: [
      {
        type: 'Sneakers',
        title: 'Clean Minimalist White Leather Sneakers',
        colors: 'Crisp All-White with Tan Gum Sole',
        reason: 'The ultimate versatile shoe — pairs with jeans, cargos, and suits.',
        cat: 'sneakers',
      },
      {
        type: 'Loafers',
        title: 'Penny Loafers / Horsebit Suede Loafers',
        colors: undertone === 'warm' ? 'Burnished Cognac Tan' : 'Jet Black / Slate Charcoal',
        reason: 'Essential smart-casual footwear for chinos, linen, and short kurtas.',
        cat: 'loafers',
      },
      {
        type: 'Boots',
        title: 'Ankle Chelsea Boots with Elastic Gusset',
        colors: undertone === 'warm' ? 'Dark Chocolate Brown Suede' : 'Polished Black Leather',
        reason: 'Adds height, ankle support, and rugged streetwear presence.',
        cat: 'boots',
      },
      {
        type: 'Ethnic Mojaris',
        title: 'Handcrafted Velvet Zari Mojaris',
        colors: undertone === 'warm' ? 'Deep Maroon & Antique Gold' : 'Midnight Navy & Silver',
        reason: 'Authentic traditional footing for Kurtas, Bundis, and Sherwanis.',
        cat: 'mojaris',
      },
      {
        type: 'Leather Belt',
        title: 'Reversible Formal & Casual Leather Belt',
        colors: 'Dual Tone Black & Cognac Brown with Brushed Buckle',
        reason: 'Matches both black and tan shoes across every trouser type.',
        cat: 'belt',
      },
    ],
    wallets_bags: [
      {
        type: 'Bi-fold Wallet',
        title: 'Slim RFID-Blocking Full-Grain Leather Wallet',
        colors: undertone === 'warm' ? 'Tan / Vintage Brown Leather' : 'Matte Black / Charcoal Leather',
        reason: 'Ultra-thin pocket silhouette that never bulges in trousers.',
        cat: 'wallet',
      },
      {
        type: 'Messenger & Backpack',
        title: 'Structured Leather Messenger Bag / Urban Canvas Backpack',
        colors: undertone === 'warm' ? 'Camel Tan with Brass Hardware' : 'Midnight Navy & Black with Matte Zips',
        reason: 'Elevates daily commute and fits 15" laptop with grooming kit.',
        cat: 'backpack',
      },
      {
        type: 'Sunglasses',
        title: 'Polarized Aviators & Retro Acetate Wayfarers',
        colors: undertone === 'warm' ? 'Tortoiseshell Frame with Brown Tint' : 'Matte Black Metal Frame with Dark Green Tint',
        reason: 'Blocks 100% UV rays while chiseling cheekbones and jawline.',
        cat: 'sunglasses',
      },
    ],
    grooming: [
      {
        product: 'Signature Cologne (EDP)',
        title: undertone === 'warm' ? 'Smoked Amber, Leather, Cardamom & Oud Wood' : 'Fresh Oceanic Sea Salt, Bergamot & Haitian Vetiver',
        brands: 'Titan Skinn (Raw / Steele), Bella Vita, Zara Man, Dior Sauvage',
        tip: 'Apply on collarbone, wrists, and behind ears for 10+ hour projection.',
        cat: 'cologne',
      },
      {
        product: 'Beard & Hair Styling Clay',
        title: 'Organic Argan Beard Oil + Strong-Hold Matte Hair Pomade',
        brands: 'Beardo, Ustraa, The Man Company',
        tip: 'Tames frizz without greasy shine, maintaining structured hold all day.',
        cat: 'makeup',
      },
    ],
    basics_innerwear: [
      {
        type: 'Cotton Vest (Ganji)',
        title: '100% Combed Cotton Ribbed Undershirt Vest (Ganji / Banyan)',
        colors: 'Pure White & Heather Grey',
        reason: 'Ultra-soft, sweat-absorbing base layer protecting dress shirts and kurtas.',
        cat: 'vest',
      },
      {
        type: 'Boxer Briefs',
        title: 'Moisture-Wicking Anti-Chafe Cotton Boxer Briefs',
        colors: 'Charcoal, Navy, Black 3-Pack',
        reason: 'Ergonomic pouch support preventing thigh chafing during active movement.',
        cat: 'boxers',
      },
      {
        type: 'Socks Pack',
        title: 'Bamboo Cotton Loafer Invisible Socks & Ribbed Crew Socks',
        colors: 'Assorted Black, White, Charcoal',
        reason: 'Silicone heel grip guarantees no slipping inside sneakers and loafers.',
        cat: 'socks',
      },
    ],
  };
}
